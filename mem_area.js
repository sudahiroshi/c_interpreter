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
        this.event = [];
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
        for( let ev of this.event ) {
            if( (ev.start <= address) && (address<ev.end) ) {
                ev.callback( address, size, value );
            }
        }
    }
    /**
     * メモリ書き込みを監視する
     * @param { number } start 開始アドレス
     * @param { number } end 終了アドレス
     * @param { function } callback コールバック関数
     */
    on( start, end, callback ) {
        this.event.push( { start: start, end: end, callback: callback} );
    }
}

class Area {
    /**
     * 管理するメモリ空間
     * @param { Memory | Area } memory メモリ空間
     * @param { String } name 空間の名前
     * @param { number } start 開始アドレス
     * @param { number } size メモリ容量
     */
    constructor( memory, name, start, size ) {
        this.memory = memory;
        this.name = name;
        this.start = start;
        this.size = size;
        /**
         * 次に使用するアドレス
         */
        this.using = start;
    }
    malloc( size ) {
        console.log( "area", this.start, this.size, this.using, size );
        if( this.start + this.size < this.using + size ) {
            throw new Error( "メモリが足りません" );
        } else {
            let address = this.using;
            this.using += size;
            return address;
        }
    }
}

const mem = new Memory( 32 );
mem.on( 4, 8, ( ad, sz, val ) => {
    console.log( "memory changed:", ad, sz, val );
});
mem.on( 0, 16, ( ad, sz, val ) => {
    console.log( "memory changed2:", ad, sz, val );
});
mem.store( 0, 32, 0x10203040 );
mem.store( 4, 32, 0x0f0f0f0f );
mem.store( 8, 16, 0xffff );
mem.store( 12, 32, 0x20202020 );
const textarea = new Area( mem, "text", 0, 16 );
const t2 = new Area( textarea, "other", 16, 4 );
let addr1 = textarea.malloc( 4 );
let addr2 = textarea.malloc( 4 );
let addr3 = t2.malloc( 4 );
//console.log( mem, addr1, addr2, addr3 );