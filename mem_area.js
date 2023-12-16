const DEVELOP = true;

class Memory {
    /**
     * コンストラクタ
     * @param { number } size メモリ全体のサイズ（バイト）
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
        let dummy = this.access[size].at( address/(size/8) );
        if( DEVELOP ) console.log( "load", address, size, value );
        return dummy;
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

class Area {
    constructor( memory, start, size ) {
        this.memory = memory;
        this.start = start;
        this.size = size;
        this.using = 0;
    }
    malloc( size ) {
        if( this.start + this.size < this.using + size ) {
            throw new Error( "メモリが足りません" );
        } else {
            let address = this.using;
            this.using += size;
            return address;
        }
    }
}

const mem = new Memory( 16 );
mem.store( 0, 32, 0x10203040 );
mem.store( 4, 32, 0x0f0f0f0f );
mem.store( 8, 16, 0xffff );
mem.store( 12, 32, 0x20202020 );
console.log( mem );