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
        console.log( this.access[size] );
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

const st = new Stack( 16 );
//console.log( st );
st.push( 0x10101010, 32 );
// console.log( st );
// console.log( st.pop( 32 ) );
st.push( 0x0f0f0f0f, 32 );
st.push( 0xffff, 16 );
// console.log( st );
st.push( 0x20202020, 32 );
// console.log( st );
// console.log( st.get( 8, 32 ) );