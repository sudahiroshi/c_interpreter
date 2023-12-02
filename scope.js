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

let stack = new Stack( 32 );
let scope = new Scope( null, stack );

scope.newvar( "test", 'int' );
console.log( scope );
scope.setvar( "test", 8 );
console.log( scope );
console.log( scope.getvar( "test" ));