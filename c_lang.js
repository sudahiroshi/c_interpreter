const pegjs = require('pegjs');
const fs = require('fs');

const ruleset = fs.readFileSync("parser.pegjs", "utf-8");

if( process.argv.length == 0 ) {
    console.log("C言語のソースコードを指定してください");
    process.exit(1);
}

class Stack {
    /**
     * コンストラクタ
     * @param { number } size スタック全体のサイズ（バイト）
     */
    constructor( size ) {
        this.stack = new ArrayBuffer( size );
        this.access = {};
        this.access[8] = this.u8 = new Uint8Array( this.stack );
        this.access[16] = this.u16 = new Uint16Array( this.stack );
        this.access[32] = this.u32 = new Uint32Array( this.stack );
        this.access[64] = this.u64 = new BigUint64Array( this.stack );
        this.sp = size;
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
        this.access[size].set( [data], this.sp/(size/8) );
        // console.log( 36, size, data );
        // console.log( this.access[size] );
    }
    pop( size ) {
        let data = this.access[size].at( this.sp/(size/8) );
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
        let dummy = this.access[size].at( address/(size/8) );
        console.log( "Stack.get", address, size, this.access[size].at( address/(size/8) ) );
        return dummy;
    }
    /**
     * スタックにデータを書き込む
     * @param { number } address スタック上のアドレス
     * @param { number } size 書き込みサイズ（ビット）
     * @param { number } value 値
     */
    set( address, size, value ) {
        // console.log( 48, address, size, value );
        this.access[size].set( [value], address/(size/8) );
        // console.log( this.access[size] );
    }
}

class Scope {
    constructor( parent, stack ) {
        this.parent = parent;
        this.stack = stack;
        this.vars = {};
        console.log( "Scope.new", stack.sp );
    }
    /**
     * 新しい変数を定義する
     * @param { String } name 変数名
     * @param { String } model 型名（char/int/long)
     * @param { number } val 初期値
     */
    newvar( name, model, val=0 ) {
        this.vars[name] = {};
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
        stack.push( val, this.vars[name]["size"] );
        this.vars[name]["sp"] = this.stack.sp;
        console.log( 80, name, this.vars[name], stack.sp );
    }
    /**
     * 変数の値を取得する
     * @param { String } name 変数名
     * @returns 
     */
    getvar( name ) {
        if( this.vars[name] ) {
            console.log( 81, stack.u32 );
            console.log( 76, this.vars );
            let dummy = this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            console.log( "Scope.getvar", name, dummy );
            return this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
        } else {
            console.log( 78, "name error!" );
        }
    }

    setvar( name, value ) {
        if( this.vars[name] ) {
            this.stack.set( this.vars[name]["sp"], this.vars[name]["size"], value );
            //this.stack[ this.vars[name]["sp"] ] = value;
        } else {
            console.log( 78, "name error!" );
        }       
    }
}

let stack = new Stack( 64 );
let grobal = new Scope( null, stack );

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
func[ "print" ] = ( arg, scope ) => {
     console.log( 122, arg );
    // console.log( 105, scope );
    // console.log( 106, stack.sp );
    //console.log( stack.get( stack.sp, 32 ) );
    // console.log( 108, stack.u32 );
}
func[ "pp" ] = ( arg, scope ) => {
    console.log( 129, stack.get( stack.sp, 32) );
}

function interprit( ast, scope ) {
    let last = null;
    switch( ast["type"] ) {
        case "Program":
            console.log( 34, ast.body );
            for( let line of ast.body ) {
                interprit( line, scope );
            }
            break;
        case "Include":
            // console.log( 40, ast );
            // console.log( ast["standardheader"] );
            // console.log(41, "include " + ast["standardheader"] );
            break;
        case "FunctionExecution":
            // console.log( 141, stack.u32 );
            if( func[ ast["name"] ] ){
                // console.log( 46, ast["name"] );
                // console.log( 47, ast.parameter );
                let f = func[ ast["name"] ];
                console.log( 84, stack.sp );
                const backup = stack.sp;
                for( let i of ast.parameter ) {
                    console.log( 120, i );
                    // console.log( 137, scope.vars );
                    // let dummy = scope.getvar( i.name );
                    let dummy = interprit( i, scope );
                    console.log( 140, dummy );
                    stack.push( dummy, 32 );
                    // console.log( 139, stack.get( 52, 32 ) );
                    // console.log( 136, scope.getvar( i.name ) );
                }
                // console.log( 88, stack.sp );
                console.log( 166, ast["parameter"] );
                let result = f( scope, ast["parameter"].length );
                console.log( 168, result );
                stack.sp = backup;
                console.log( 169, stack.sp );
                return result;
            }
            break;
        case "FunctionDefinition":
            // console.log( 52, ast["name"] );
            // console.log( 53, ast.block );
            func[ ast["name"] ] = ( parent, param_num ) => {
                let sc = new Scope( parent, stack );
                const backup = stack.sp;
                // console.log( 143, ast );
                let offset = 32 * (param_num-1);
                for( variable of ast["parameter"] ) {
                    console.log( "FuncDef", variable.value.name, variable.model, backup + (offset/8), stack.get( backup + (offset/8), 32) );
                    sc.newvar( variable.value.name, variable.model, stack.get( backup + (offset/8), 32) );
                    offset -= 32;
                }
                // console.log( 156, sc.vars );
                // console.log( 157, stack.get( 32, 32 ) );
                let result = interprit( ast.block, sc );
                console.log( 189, result );
                return result;
            }
            break;
        case "block":
            // console.log( 56, ast );
            let block_result;
            for( let line of ast.stmt ) {
                block_result = interprit( line, scope );
                console.log( "block", block_result );
            }
            return block_result;
            break;
        case "variable":
            // console.log( 148, ast );
            // console.log( 148, ast["value"]["name"] );
            // console.log( 149, ast["model"] );
            // console.log( 153, scope["vars"] );
            if( ast["value"]["type"] == "Pointer" ) {
                scope.newvar( ast["value"]["name"], 32 );
            }
            else {
                scope.newvar( ast["value"]["name"], ast["model"] );
            }
            // console.log( 151, ast["value"]["name"] );
            // console.log( 152, scope.getvar( ast["value"]["name"] ) );
            if( ast["expr"] )
            {
                // console.log( 154, ast["expr"]);
                let result = interprit( ast[ "expr" ], scope );
                // console.log( 201, result );
                // console.log( 201, stack.u32 );
                scope.setvar( ast["value"]["name"], result );
                // console.log( 203, stack.u32 );
                return result;
            }
            break;
        case "AssignmentExpression":
            // console.log( 155, ast );
            let result = interprit( ast["right"], scope );
            // console.log( 197, result );
            scope.setvar( ast["left"]["name"], result );
            // console.log( 156, result );
            // console.log( 157, scope.getvar( ast["left"]["name"] ) );
            // console.log( 158, scope["vars"] );
            // console.log( 160, scope.getvar( ast["left"]["name"] ) );
            // console.log( 195, stack.u32 );
            return result;
            break;
        case "Literal":
            console.log( 163, "literal", ast["value"] );
            return ast["value"];
            break;
        case "expr":
            // console.log( 166, ast );
            break;
        case "returnStatement":

            let dummy = interprit( ast["value"], scope );
            console.log( "retStat", ast["value"], dummy );
            return dummy;
            break;
        case "BinaryExpression":
            console.log( 231, ast );
            console.log( 239, stack.u32 );
            console.log( 240, scope.vars );
            let left = interprit( ast["left"], scope );
            console.log( 236, left );
            let right = interprit( ast["right"], scope );
            console.log( 247, right );
            switch( ast["operator"] ) {
                case "+":
                    console.log( 244, left, right, left + right );
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
            }
        case "Identifier":
            //console.log( 249, scope );
            let res = scope.getvar( ast["name"] );
            console.log( 255, res );
            return res;
            break;

    }
}

interprit( ast, grobal );
// console.log( 59, func["main"] );
// console.log( 108, func );
// stack.push( 0, 32 );
// stack.push( 0, 32 );
func[ "main" ]( grobal, 2 );