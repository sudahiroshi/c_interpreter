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
    }
    pop( size ) {
        let data = this.access[size].at( this.sp/(size/8) );
        this.sp += size/8;
        return data;
    }
    get( address, size ) {
        return this.access[size].at( address/(size/8) );
    }
}

class Scope {
    constructor( parent, stack ) {
        this.parent = parent;
        this.stack = stack;
        this.vars = {};
    }
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
        }

        stack.push( val, this.vars[name]["size"] );
        this.vars[name]["sp"] = this.stack.sp;
    }
    getvar( name ) {
        if( this.vars[name] ) {
            return this.stack[ this.vars[name]["sp"] ];
        }
    }

    setvar( name, value ) {
        if( this.vars[name] ) {
            this.stack[ this.vars[name]["sp"] ] = value;
        }        
    }
}

let stack = new Stack( 16384 );
let grobal = new Scope( null, stack );

console.log("Ruleset = syntax.pegjs" );
console.log("source code = " + process.argv[2] );

const source = fs.readFileSync( process.argv[2], "utf-8" );
let parser = pegjs.generate( ruleset );
let ast = parser.parse( source );

//console.log( ast );

const TYPE = {
    VARIABLE: "Variable",
    FUNCTION: "Function",
    BLOCK: "Block"
}

const global = {};
const func = {};
func[ "printf" ] = ( arg ) => { console.log( 28, arg ); };

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
            if( func[ ast["name"] ] ){
                console.log( 46, ast["name"] );
                console.log( 47, ast.parameter );
                let f = func[ ast["name"] ];
                console.log( 84, stack.sp );
                for( let i of ast.parameter ) {
                    console.log( 120, i );
                    stack.push( i.value, 32 );
                }
                console.log( 88, stack.sp );
                f( ast["parameter"], scope );
            }
            break;
        case "FunctionDefinition":
            console.log( 52, ast["name"] );
            // console.log( 53, ast.block );
            func[ ast["name"] ] = ( parent, param_num ) => {
                let sc = new Scope( parent, stack );
                let result = interprit( ast.block, sc );
                return result;
            }
            break;
        case "block":
            // console.log( 56, ast );
            for( let line of ast.stmt ) {
                interprit( line, scope );
            }
            break;
        case "variable":
            console.log( 148, ast );
            console.log( 148, ast["value"]["name"] );
            console.log( 149, ast["model"] );
            console.log( 153, scope["vars"] );
            scope.newvar( ast["value"]["name"], ast["model"] );
            console.log( 151, ast["value"]["name"] );
            console.log( 152, scope.getvar( ast["value"]["name"] ) );
            if( ast["expr"] )
            {
                console.log( 154, ast["expr"]);
                interprit( ast[ "expr" ], scope );
            }
            break;
        case "AssignmentExpression":
            console.log( 155, ast );
            let result = interprit( ast["right"], scope );
            scope.setvar( ast["left"]["name"], result );
            console.log( 156, result );
            console.log( 157, scope.getvar( ast["left"]["name"] ) );
            console.log( 158, scope["vars"] );
            console.log( 160, scope.getvar( ast["left"]["name"] ) );
            break;
        case "Literal":
            console.log( 163, "literal" );
            return ast["value"];
            break;
        case "expr":
            console.log( 166, ast );
            break;
    }
}

interprit( ast, grobal );
console.log( 59, func["main"] );
console.log( 108, func );
// stack.push( 0, 32 );
// stack.push( 0, 32 );
func[ "main" ]( grobal, 2 );