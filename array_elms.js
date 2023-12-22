const a = [[ [1,2,3], [4,5,6]],[ [1,2,3], [4,5,6]]];
let b = [];

/**
 * 配列の要素数を調べる関数
 * @param { Array } array 調べたい配列
 * @param { Array } output 出力用の配列
 * @returns 配列の要素数
 */
function get_elms( array, output=[] ) {
    if( Array.isArray( array[0] ) ) {
        let out = get_elms( array[0], output );
        output.push( array.length );
        return out * array.length;
    } else {
        output.push( array.length );
        return array.length;
    }
}

/**
 * 配列のアドレスを計算するための次数ごとの値
 * @param { Array } array get_elmsで算出されたoutput
 * @returns 次数ごとの値
 */
function calc_elms( array ) {
    let output = [];
    for( let j=1; j<array.length; j+=1 ) {
        let elms = 1;
        for( let i=j; i<array.length; i++ ) {
            elms *= array[ i ];
        }
        output.push( elms );
    }
    output.push( 1 );
    return output;
}

console.log( get_elms( a, b ), b );
console.log( calc_elms( b ) );