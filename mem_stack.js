const DEVELOP = true;

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
        if( DEVELOP ) console.log( "store", address, size, value );
        this.access[size].set( [value], address/(size/8) );
    }
}

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
        let dummy = this.access[size].at( address/(size/8) );
        // console.log( "Stack.get", address, size, this.access[size].at( address/(size/8) ) );
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
        this.access[size].set( [value], address/(size/8) );
        // console.log( this.access[size] );
    }
}

const mem = new Memory( 16 );
mem.store( 0, 32, 0x10203040 );
mem.store( 4, 32, 0x0f0f0f0f );
mem.store( 8, 16, 0xffff );
mem.store( 12, 32, 0x20202020 );
console.log( mem );

const st = new Stack( mem, 16 );
//console.log( st );
st.push( 0x10101010, 32 );
//console.log( st );
// console.log( st.pop( 32 ) );
st.push( 0x0f0f0f0f, 32 );
st.push( 0xffff, 16 );
// console.log( st );
st.push( 0x20202020, 32 );
console.log( st.pop( 32 ) );
// console.log( st.get( 8, 32 ) );