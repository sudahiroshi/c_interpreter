

const init_program = `#include <stdio.h>

int main() {
    printf( "Hello, world\\n" );
}`



let editor;

require.config({ paths: { vs: "./node_modules/monaco-editor/min/vs" } });
require(["vs/editor/editor.main"], () => {
    editor = monaco.editor.create( 
        document.querySelector( '#editor' ),
        {
            value: init_program,
            language: 'c',
            lineNumbers: true,
            scrollBeyondLastLine: false,
            theme: 'vs-light',
        }
    );
});

let ruleset;
let parser;

fetch( "parser.pegjs" )
.then( res => {
    if( !res.ok ) {
        throw new Error('Error: ' + res.status );
    }
    return res.text();
})
.then( text => {
    ruleset = text;
    parser = peg.generate( ruleset );
})
.catch( err => {
    console.log( 'Error' );
})

document.querySelector('#exec').addEventListener('click', () => {
    let program = editor.getValue();
    let ast = parser.parse( program );
    document.querySelector( '#console' ).innerText = JSON.stringify( ast.body );
});