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

console.log( ast );

const TYPE = {
    VARIABLE: "Variable",
    FUNCTION: "Function",
    BLOCK: "Block"
}

const global = {};
const func = {};

function interprit( ast ) {
    let last = null;
    switch( ast["type"] ) {
        case "Program":
            for( let line of ast["body"] ) {
                interprit( line );
            }
            break;
        case "Include":
            console.log( ast["standardheader"] );
            console.log("include " + line["standardheader"] );
            break;
        case "function":
            console.log( ast["name"] );
            func[ ast["name"] ] = { block: ast["block"], parameter: ast["parameter"] } ;
            
    }
}

switch( ast["type"] ) {
    case "Program":
        for( let line of ast["body"] ) {
            console.log( line["type"] );
            switch( line["type"] ) {
                case "Include":
                    console.log("include " + line["standardheader"] );

                    
            }
        }
}