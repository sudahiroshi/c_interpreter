const DEVELOP = false;

/**
 * メモリ空間を司るクラス
 */
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
     * @returns データ
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

/**
 * スタック領域及びスタックポインタを司るクラス
 */
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
     * @returns データ
     */
    get( address, size ) {
        //let dummy = this.access[size].at( address/(size/8) );
        let dummy = this.memory.load( address/(size/8), size );
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
        //this.access[size].set( [value], address/(size/8) );
        this.memory.store( address/(size/8), value );
        // console.log( this.access[size] );
    }
}

/**
 * スコープごとに変数を管理するクラス
 */
class Scope {
    /**
     * 
     * @param { Scope } callee 呼び出し元のスコープ
     * @param { Scope } parent 上位のスコープ
     * @param { Stack } stack スタック領域
     */
    constructor( callee, parent, stack ) {
        this.callee = callee;
        this.parent = parent;
        this.stack = stack;
        this.vars = {};
        // console.log( "Scope.new", stack.sp );
    }
    /**
     * 新しい変数を定義する
     * @param { String } name 変数名
     * @param { String } model 型名（char/int/long)
     * @param { number } val 初期値
     */
    newvar( name, model, val=0 ) {
        this.vars[name] = {};
        this.vars[name]["type"] = 'number';        
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
            case 'pointer':
                this.vars[name]["size"] = 32;
                this.vars[name]["type"] = 'pointer';
                break;
            default:
                throw new Error('変数のサイズがおかしいです' );
        }
        console.log( "newvar", val, this.vars[name]["size"] );
        this.stack.push( val, this.vars[name]["size"] );
        this.vars[name]["sp"] = this.stack.sp;
        // console.log( 80, name, this.vars[name], stack.sp );
    }
    /**
     * 新しい配列を定義する
     * @param { String } name 配列名
     * @param { String } model 型名
     * @param { number } length 要素数
     */
    newarray( name, model, length ) {
        this.vars[name] = {};
        this.vars[name]["length"] = length;
        this.vars[name]["type"] = 'array';
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
        for( let i=0; i<length; i++ ) {
            stack.push( 0, this.vars[name]["size"] );
        }
        this.vars[name]["sp"] = this.stack.sp;
    }
    /**
     * 変数の値を取得する
     * @param { String } name 変数名
     * @returns 値
     */
    getvar( name ) {
        if( DEVELOP ) console.log( 76, this.vars );
        if( this.vars[name] ) {
            // console.log( 81, stack.u32 );
            let dummy = this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            // console.log( "Scope.getvar", name, dummy );
            //return this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            return dummy;
        } else {
            console.log( 78, "name error!" );
        }
    }
    /**
     * 変数のアドレスを取得する
     * @param { String } name 変数名
     * @returns アドレス
     */
    getaddress( name ) {
        if( DEVELOP ) console.log( 177, this.vars );
        if( this.vars[name] ) {
            // console.log( 81, stack.u32 );
            let dummy = this.vars[name]["sp"];
            // console.log( "Scope.getvar", name, dummy );
            //return this.stack.get( this.vars[name]["sp"], this.vars[name]["size"] );
            return dummy;
        } else {
            console.log( 78, "name error!" );
        }
    }
    /**
     * 変数に値を代入する
     * @param { String } name 変数名
     * @param {*} value 値
     */
    setvar( name, value ) {
        if( DEVELOP ) console.log( 165, name, value );
        if( this.vars[name] ) {
            if( this.vars[name]["type"] == 'number' ) {
                this.stack.set( this.vars[name]["sp"], this.vars[name]["size"], value );
            } else {
                this.vars[name]["sp"] = value;
            }
            //this.stack[ this.vars[name]["sp"] ] = value;
        } else {
            console.log( 169, "name error!" );
        }       
    }
}

const mem = new Memory( 32 );
mem.store( 0, 32, 0x10203040 );
mem.store( 4, 32, 0x0f0f0f0f );
mem.store( 8, 16, 0xffff );
mem.store( 12, 32, 0x20202020 );
console.log( mem );

const st = new Stack( mem, 32 );
//console.log( st );
st.push( 0x10101010, 32 );
//console.log( st );
// console.log( st.pop( 32 ) );
st.push( 0x0f0f0f0f, 32 );
st.push( 0xffff, 16 );
// console.log( st );
st.push( 0x20202020, 32 );
console.log( st.pop( 32 ) );
console.log( st.pop( 32 ) );
console.log( st.pop( 32 ) );
console.log( st.pop( 32 ) );
// console.log( st.get( 8, 32 ) );

let scope = new Scope( null, null, st );

scope.newvar( "test", 'int' );
console.log( scope );
scope.setvar( "test", 8 );
console.log( scope.vars );
console.log( 82, scope.getvar( "test" ));