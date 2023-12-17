const pegjs = require('pegjs');
const fs = require('fs');

const DEVELOP = false;
const MEMORY_SIZE = 64;

const ruleset = fs.readFileSync("parser.pegjs", "utf-8");

if( process.argv.length == 0 ) {
    console.log("C言語のソースコードを指定してください");
    process.exit(1);
}

const models = {
    'int': 32,
    'long': 32,
    'short': 16,
    'char': 8
}

/**
 * メモリ空間を司るクラス
 */
class Memory {
    /**
     * コンストラクタ
     * @param { number } size スタック全体のサイズ（バイト）
     */
    constructor( size ) {
        this.memory = new ArrayBuffer( size );
        this.access = {};
        this.access[8] = this.u8 = new Uint8Array( this.memory );
        this.access[16] = this.u16 = new Uint16Array( this.memory );
        this.access[32] = this.u32 = new Uint32Array( this.memory );
        this.access[64] = this.u64 = new BigUint64Array( this.memory );
    }

    /**
     * メモリからデータを読み取る
     * @param { number } address アドレス
     * @param { number } size 読み取りサイズ（ビット）
     * @returns 
     */
    load( address, size ) {
        let value = this.access[size].at( address/(size/8) );
        if( DEVELOP ) console.log( "load", address, size, value );
        return value;
    }
    /**
     * メモリにデータを書き込む
     * @param { number } address アドレス
     * @param { number } size 書き込みサイズ（ビット）
     * @param { number } value 値
     */
    store( address, size, value ) {
        if( DEVELOP ) console.log( "store", address, size, value, this.access, this.access["32"] );
        this.access[size].set( [value], address/(size/8) );
    }
}

/**
 * スタック領域及びスタックポインタを司るクラス
 */
class Stack {
    /**
     * コンストラクタ
     * @param { ArrayBuffer } memory メモリ空間
     * @param { number } address スタックポインタの初期値
     */
    constructor( memory, address ) {
        // this.stack = new ArrayBuffer( size );
        // this.access = {};
        // this.access[8] = this.u8 = new Uint8Array( this.stack );
        // this.access[16] = this.u16 = new Uint16Array( this.stack );
        // this.access[32] = this.u32 = new Uint32Array( this.stack );
        // this.access[64] = this.u64 = new BigUint64Array( this.stack );
        this.memory = memory;
        this.sp = address;
    }
    /**
     * スタックにデータを積む（アライメントを考慮する）
     * @param { number } data スタックに積むデータ
     * @param { number } size スタックに積むデータのサイズ（ビット）
     */
    push( data, size ) {
        this.sp-=(size/8);
        while( this.sp % (size/8) != 0 ) {
            this.sp--;
        }
        this.memory.store( this.sp, size, data );
        //this.access[size].set( [data], this.sp/(size/8) );
        // console.log( 36, size, data );
        // console.log( this.access[size] );
    }
    /**
     * スタックからデータを取り出す（SPを変更する）
     * @param { number } size スタックから取り出すデータのサイズ（ビット）
     * @returns データ
     */
    pop( size ) {
        let data = this.memory.load( this.sp, size );
        //let data = this.access[size].at( this.sp/(size/8) );
        this.sp += size/8;
        return data;
    }
    /**
     * スタックからデータを読み取る
     * @param { number } address スタック上のアドレス
     * @param { number } size 読み取りサイズ（ビット）
     * @returns 
     */
    get( address, size ) {
        //let dummy = this.access[size].at( address/(size/8) );
        let dummy = this.memory.load( address, size );
        //console.log( "Stack.get", address, size, address, dummy );
        return dummy;
    }
    /**
     * スタックにデータを書き込む
     * @param { number } address スタック上のアドレス
     * @param { number } size 書き込みサイズ（ビット）
     * @param { number } value 値
     */
    set( address, size, value ) {
        if( DEVELOP ) console.log( 48, address, size, value );
        //this.access[size].set( [value], address/(size/8) );
        this.memory.store( address, size, value );
        // console.log( this.access[size] );
    }
}

/**
 * スコープごとに変数を管理するクラス
 */
class Scope {
    /**
     * 
     * @param { Scope } callee 呼び出し元のスコープ
     * @param { Scope } parent 上位のスコープ
     * @param { Stack } stack スタック領域
     */
    constructor( callee, parent, stack ) {
        this.callee = callee;
        this.parent = parent;
        this.stack = stack;
        this.vars = {};
        // console.log( "Scope.new", stack.sp );
    }
    /**
     * 新しい変数を定義する
     * @param { String } name 変数名
     * @param { String } model 型名（char/int/long)
     * @param { number } val 初期値
     */
    newvar( name, model, val=0 ) {
        this.vars[name] = {};
        this.vars[name]["type"] = 'number';        
        switch( model ) {
            case 'int':
            case 'long':
                this.vars[name]["size"] = 32;
                break;
            case 'short':
                this.vars[name]["size"] = 16;
                break;
            case 'char':
                this.vars[name]["size"] = 8;
                break;
            case 'pointer':
                this.vars[name]["size"] = 32;
                this.vars[name]["type"] = 'pointer';
                break;
            default:
                throw new Error('変数のサイズがおかしいです' );
        }
        // console.log( "newvar", val, this.vars[name]["size"] );
        this.stack.push( val, this.vars[name]["size"] );
        this.vars[name]["sp"] = this.stack.sp;
        // console.log( 80, name, this.vars[name], stack.sp );
    }
    /**
     * 新しい配列を定義する
     * @param { String } name 配列名
     * @param { String } model 型名
     * @param { number } length 要素数
     * @param { Array{number} } dimension 配列の次元ごとの要素数
     */
    newarray( name, model, length, dimension ) {
        this.vars[name] = {};
        this.vars[name]["length"] = length;
        this.vars[name]["type"] = 'array';
        this.vars[name]["dimension"] = dimension;
        switch( model ) {
            case 'int':
            case 'long':
                this.vars[name]["size"] = 32;
                break;
            case 'short':
                this.vars[name]["size"] = 16;
                break;
            case 'char':
                this.vars[name]["size"] = 8;
                break;
            default:
                throw new Error('変数のサイズがおかしいです');
        }
        for( let i=0; i<length; i++ ) {
            stack.push( 0, this.vars[name]["size"] );
        }
        this.vars[name]["sp"] = this.stack.sp;
    }
    /**
     * 変数の値を取得する
     * @param { String } name 変数名
     * @returns 
     */
    getvar( name ) {
        if( DEVELOP ) console.log( 76, this.vars );
        if( this.vars[name] ) {
            // console.log( 81, stack.u32 );
            // console.log( "getvar", this.vars[name] );
            let dummy = this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            // console.log( "Scope.getvar", name, dummy );
            //return this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            return dummy;
        } else {
            console.log( 78, "name error!", name );
        }
    }
    /**
     * 変数のアドレスを取得する
     * @param { String } name 変数名
     * @returns 
     */
    getaddress( name ) {
        if( DEVELOP ) console.log( 177, this.vars );
        if( this.vars[name] ) {
            // console.log( 81, stack.u32 );
            let dummy = this.vars[name]["sp"];
            // console.log( "Scope.getvar", name, dummy );
            //return this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            return dummy;
        } else {
            console.log( 78, "name error!" );
        }
    }
    /**
     * 変数に値を代入する
     * @param { String } name 変数名
     * @param {*} value 値
     */
    setvar( name, value ) {
        if( DEVELOP ) console.log( 165, name, value );
        if( this.vars[name] ) {
            if(
                 this.vars[name]["type"] == 'number' ||
                 this.vars[name]["type"] == 'pointer'
             ) {
                this.stack.set( this.vars[name]["sp"], this.vars[name]["size"], value );
            } else {
                this.vars[name]["sp"] = value;
            }
            //this.stack[ this.vars[name]["sp"] ] = value;
        } else {
            console.log( 169, "name error!" );
        }       
    }
    gettype( name ) {
        if( DEVELOP ) console.log( 264, name );
        if( this.vars[name] ) {
            return this.vars[name]["type"];
        } else {
            console.log( 268, "name error!" );
        }
    }
}

let memory = new Memory( MEMORY_SIZE );
let stack = new Stack( memory, MEMORY_SIZE );
let mem_grobal = new Scope( null, null, stack );

console.log("Ruleset = syntax.pegjs" );
console.log("source code = " + process.argv[2] );

const source = fs.readFileSync( process.argv[2], "utf-8" );
let parser = pegjs.generate( ruleset );
let ast = parser.parse( source );

// console.log( ast );

const TYPE = {
    VARIABLE: "Variable",
    FUNCTION: "Function",
    BLOCK: "Block"
}

const global = {};
const func = {};
func[ "printf" ] = ( arg ) => { console.log( 28, arg ); };
func[ "print" ] = ( scope, argc ) => {
    // console.log( "print", scope, stack.sp, argc );
    console.log( "print", stack.get( stack.sp, 32) );
    // console.log( 105, scope );
    // console.log( 106, stack.sp );
    //console.log( stack.get( stack.sp, 32 ) );
    // console.log( 108, stack.u32 );
}
func[ "pp" ] = ( scope, argc ) => {
    console.log( "pp", argc );
}
func[ "debvars" ] = ( scope, argc ) => {
    console.log( "debug", scope.vars );
}

function BinaryExpression( ast, scope ) {
    // console.log( 231, ast );
    // console.log( 239, stack.u32 );
    // console.log( 240, scope.vars );
    let left = interprit( ast["left"], scope );
    // console.log( 236, left );
    let right = interprit( ast["right"], scope );
    // console.log( 247, right );
    switch( ast["operator"] ) {
        case "+":
            // console.log( 244, left, right, left + right );
            return left + right;
            break;
        case "-":
            return left - right;
            break;
        case "*":
            return left * right;
            break;
        case "/":
            return left / right;
            break;
        case "%":
            return left % right;
            break;
        case ">":
            return left > right ? 1 : 0;
            break;
        case "<":
            return left < right ? 1 : 0;
            break;
        case ">=":
            return left >= right ? 1 : 0;
            break;
        case "<=":
            return left <= right ? 1 : 0;
            break;
        default:
            throw new Error( '演算子が不明です' );
    }
}

// func[ "debvars" ] = ( arg, scope ) => {
//     console.log( "aa", scope.vars );
// }
if( DEVELOP ) console.log( func );
/**
 * ASTを実行する
 * @param {*} ast AST
 * @param {Scope} scope 変数のスコープ
 * @returns 実行結果
 */
function interprit( ast, scope ) {
    //console.log( "ast", ast );
    switch( ast["type"] ) {
        case "Program":
            //console.log( 34, ast.body );
            for( let line of ast.body ) {
                //console.log(359);
                interprit( line, scope );
            }
            break;
        case "ExpressionStatement":
            return interprit( ast["expression"], scope );
            break;
        case "Include":
            // console.log( 40, ast );
            // console.log( ast["standardheader"] );
            // console.log(41, "include " + ast["standardheader"] );
            break;
        case "FunctionExecution":
            // console.log( 141, stack.u32 );
            if( func[ ast["name"] ] ){
                //console.log( 46, ast );
                // console.log( 47, ast.parameter );
                let f = func[ ast["name"] ];
                // console.log( 84, stack.sp );
                const backup = stack.sp;
                if( ast.parameter ) {
                    for( let i of ast.parameter ) {
                        // console.log( 120, i );
                        // console.log( 238, scope );
                        // let dummy = scope.getvar( i.name );
                        // console.log( scope.getaddress(i.name) );
                        //console.log(382);
                        let dummy = interprit( i, scope );
                        //if( DEVELOP ) 
                        // console.log( "FuncExec", i, dummy );
                        stack.push( dummy, 32 );
                        // console.log( 139, stack.get( 52, 32 ) );
                        // console.log( 136, scope.getvar( i.name ) );
                    }
                } else {
                    ast.parameter = [];
                }
                // console.log( 88, stack.sp );
                // console.log( 166, ast["parameter"] );
                //
                //console.log( 251, scope );
                let result = f( scope, ast["parameter"].length );
                // console.log( 168, result );
                stack.sp = backup;
                // console.log( 169, stack.sp );
                return result;
            } else {
                throw new Error( "関数" + ast["name"] + "は定義されていません" );
            }
            break;
        case "FunctionDefinition":
            //console.log( 52, ast["name"] );
            //console.log( 53, ast.block );
            func[ ast["name"] ] = ( parent, param_num ) => {
                //console.log( 263, parent );
                let sc = new Scope( scope, parent, stack );
                //console.log( 265, sc );
                const backup = stack.sp;
                //console.log( 143, ast );
                if( ast["parameter"] ) {
                    let offset = 32 * (param_num-1);
                    for( let variable of ast["parameter"] ) {
                        // console.log( "FuncDef", variable.value.name, variable.model, backup + (offset/8), stack.get( backup + (offset/8), 32) );
                        sc.newvar( variable.value.name, variable.model, stack.get( backup + (offset/8), 32) );
                        offset -= 32;
                    }
                }
                // console.log( 156, sc.vars );
                // console.log( 157, stack.get( 32, 32 ) );
                let result = interprit( ast.block, sc );
                // console.log( 189, result );
                return result;
            }
            break;
        case "block":
            //console.log( "block", ast );
            let block_result;
            for( let line of ast.stmt ) {
                //console.log(434);
                block_result = interprit( line, scope );
                // console.log( "block", block_result );
            }
            return block_result;
            break;
        case "variable":
            //console.log( 148, ast );
            // console.log( 148, ast["value"]["name"] );
            // console.log( 149, ast["model"] );
            // console.log( 153, scope["vars"] );
            if( ast["value"]["type"] == "Pointer" ) {
                scope.newvar( ast["value"]["name"], "pointer" );
            }
            else {
                scope.newvar( ast["value"]["name"], ast["model"] );
            }
            // console.log( 151, ast["value"]["name"] );
            // console.log( 152, scope.getvar( ast["value"]["name"] ) );
            if( ast["expr"] )
            {
                // console.log( 154, ast["expr"]);
                //console.log(456);
                let result = interprit( ast[ "expr" ], scope );
                // console.log( 201, result );
                // console.log( 201, stack.u32 );
                scope.setvar( ast["value"]["name"], result );
                // console.log( 203, stack.u32 );
                return result;
            }
            break;
        case "AssignmentExpression":
            //console.log(467);
            let result = interprit( ast["right"], scope );
            scope.setvar( ast["left"]["name"], result );
            // console.log( 156, result );
            // console.log( 157, scope.getvar( ast["left"]["name"] ) );
            // console.log( 158, scope["vars"] );
            // console.log( 160, scope.getvar( ast["left"]["name"] ) );
            // console.log( 195, stack.u32 );
            return result;
            break;
        case "Literal":
            // console.log( 163, "literal", ast["value"] );
            return ast["value"];
            break;
        case "expr":
            // console.log( 166, ast );
            break;
        case "returnStatement":
            //console.log(490);
            let dummy = interprit( ast["value"], scope );
            // console.log( "retStat", ast["value"], dummy );
            return dummy;
            break;
        case "BinaryExpression":
            // console.log( 231, ast );
            // console.log( 239, stack.u32 );
            // console.log( 240, scope.vars );
            //console.log(499);
            let left = interprit( ast["left"], scope );
            // console.log( 236, left );
            let right = interprit( ast["right"], scope );
            // console.log( 247, right );
            switch( ast["operator"] ) {
                case "+":
                    // console.log( 244, left, right, left + right );
                    return left + right;
                    break;
                case "-":
                    return left - right;
                    break;
                case "*":
                    return left * right;
                    break;
                case "/":
                    return left / right;
                    break;
                case "%":
                    return left % right;
                    break;
                case ">":
                    return left > right ? 1 : 0;
                    break;
                case "<":
                    return left < right ? 1 : 0;
                    break;
                case ">=":
                    return left >= right ? 1 : 0;
                    break;
                case "<=":
                    return left <= right ? 1 : 0;
                    break;
                default:
                    throw new Error( '演算子が不明です' );
            }
            break;
        case "Identifier":
            //console.log( "Identifier", ast );
            let resi;
            // console.log( "Identifier", scope.vars[ ast["name"] ] );
            if( scope.vars[ ast["name"] ]["type"] == 'array' ) {
                resi = scope.getaddress( ast["name"] );
            } else {
                //console.log( "Iden2", scope.getvar( ast["name"]));
                resi = scope.getvar( ast["name"] );
            }
            return resi;
            break;
        case "Pointer":
            //console.log("Pointer", ast );
            if( ast["expr"] ) {
                let Pname = ast["expr"]["left"]["name"];
                let Psize = scope.vars[Pname]["size"]
                let address = scope.getvar( Pname );
                let aa = interprit( ast["expr"], scope );
                let Paddress = ( aa - address ) * (Psize/8) + address;
                let res = memory.load( Paddress, Psize );
                // console.log( "Po", Pname, aa, Psize, Paddress, aa - address );
                return res;
            } else {
                //console.log( 249, scope );
                // console.log( 551, ast, ast["name"] );
                let address = scope.getvar( ast["name"] );
                let Psize = scope.vars[ast["name"]]["size"]
                // console.log( "address", address, Psize );
                let res = memory.load( address, Psize );
                // console.log( 255, res );
                return res;
                break;
            }
        case "array":
            if( DEVELOP ) console.log( "array", ast );
            if( ast["expr"] ) {
                return interprit( ast["expr"], scope );
            } else {
                if( ast["model"] ) {    // ast["model"]がある場合は配列定義
                    let length;
                    let name;
                    let dimension = [];
                    if( ast["value"] ) {    // 要素数の指定なし
                        name = ast["value"]["left"]["name"]["name"];
                        length = ast["value"]["right"].length;
                        //console.log( "array要素数なし", length );
                        dimension.push( length );
                    } else {    // 要素数の指定あり
                        name = ast["name"]["name"];
                        //console.log( 595-1, ast["arraydeep"].length );
                        //console.log( 595, ast["arraydeep"]["length"] );
                        length = 1;
                        for( let deep of ast["arraydeep"] ) {
                            let dim = interprit( deep["length"], scope );
                            dimension.push( dim );
                            //console.log( "deep", length, deep, dim, scope );
                            length *= dim;
                        }
                        //length = interprit( ast["arraydeep"]["length"], scope );
                        //console.log( "array要素数あり", length, ast["arraydeep"] );
                    }
                    if( DEVELOP ) console.log( 362, length );
                    //console.log( "newarray", name, ast["model"], length );
                    scope.newarray( name, ast["model"], length, dimension );
                    if( ast["value"] && ast["value"]["right"] ) {
                        for( let i in ast["value"]["right"] ) {
                            if( DEVELOP ) console.log( 379, scope.vars[name] );
                            if( DEVELOP ) console.log( 380, ast["value"]["right"][i] );
                            //console.log(578);
                            //console.log( "array_store", scope.vars[name].sp + (i * models[ast["model"]])/8, models[ast["model"]], interprit( ast["value"]["right"][i], scope ));
                            memory.store( scope.vars[name].sp + (i * models[ast["model"]])/8, models[ast["model"]], interprit( ast["value"]["right"][i], scope ));
                        }
                    }
                } else {    // ast["model"]がない場合は配列を使う
                    // console.log( 590, ast );
                    let name = ast["name"];
                    let deep = ast["arraydeep"].length;
                    //console.log( "name", name, deep, scope.vars[name], ast );
                    let size = scope.vars[name].size;
                    let sp = scope.vars[name].sp;
                    let seq = interprit( ast["arraydeep"][0]["location"] );
                    if( DEVELOP ) console.log( 389, name, scope.vars[name], size, sp, deep );
                    let dummy = memory.load( sp + (seq * size)/8, size );
                    return dummy;
                }
            }
            break;
        case "ForStatement":
            //console.log( "For", ast );
            interprit( ast["assign"], scope );
            while( interprit( ast["condition"], scope ) ) {
                interprit( ast["block"], scope );
                //console.log( 598, ast["change"] );
                interprit( ast["change"], scope );
            }
            break;
        case "whileStatement":
            while( interprit( ast["condition"], scope ) != 0 ) {
                interprit( ast["block"], scope );
            }
            break;
        case "ifStatement":
            if( interprit( ast["condition"], scope ) != 0 ) {
                interprit( ast["block"], scope );
            } else {
                //console.log( "else", ast["else"] );
                if( ast["else"] ) {
                    interprit( ast["else"]["block"], scope );
                }
            }
            break;
        case "PostBinaryExpression":
            //console.log( "Post-ast", ast );
            //console.log( "Post-ast-post", ast["post"] );
            let temp = scope.getvar( ast["post"]["left"]["name"] );
            //console.log( "temp", temp );
            let resultP = interprit( ast["post"], scope );
            //console.log( "resultP", resultP );
            //console.log( "var", scope.getvar( ast["post"]["left"]["name"] ) );
            return temp;
            break;
    }
}

interprit( ast, mem_grobal );
// console.log( 59, func["main"] );
// console.log( 108, func );
// stack.push( 0, 32 );
// stack.push( 0, 32 );
func[ "main" ]( mem_grobal, 0 );