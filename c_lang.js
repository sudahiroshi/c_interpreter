const pegjs = require('pegjs');
const fs = require('fs');

const ruleset = fs.readFileSync("parser.pegjs", "utf-8");

if( process.argv.length == 0 ) {
    console.log("C言語のソースコードを指定してください");
    process.exit(1);
}

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
func[ "printf" ] = ( arg ) => { console.log( 28, arg[0].value ); };

function interprit( ast ) {
    let last = null;
    switch( ast["type"] ) {
        case "Program":
            console.log( 34, ast.body );
            for( let line of ast.body ) {
                interprit( line );
            }
            break;
        case "Include":
            console.log( 40, ast );
            console.log( ast["standardheader"] );
            console.log(41, "include " + ast["standardheader"] );
            break;
        case "FunctionExecution":
            if( func[ ast["name"] ] ){
                console.log( 46, ast["name"] );
                console.log( 47, ast.parameter );
                let f = func[ ast["name"] ];
                f( ast["parameter"] );
            }
            break;
        case "FunctionDefinition":
            console.log( 52, ast["name"] );
            console.log( 53, ast.block );
            func[ ast["name"] ] = () => interprit( ast.block );
            break;
        case "block":
            console.log( 56, ast );
            for( let line of ast.stmt ) {
                interprit( line );
            }
            break;
    }
}

interprit( ast );
console.log( 59, func["main"] );
func[ "main" ]();