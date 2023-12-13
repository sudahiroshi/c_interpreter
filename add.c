#include <stdio.h>

int add( int x, int y ) {
    int z = x + y;
    return z;
}

int main(int argc, char *argv[] ) {
    int a = 10;
    print( a );
    int b = 20;
    print( b );
    int c;
    c = add( a, b );
    print( c );
    return 0;
}

