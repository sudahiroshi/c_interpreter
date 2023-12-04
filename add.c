#include <stdio.h>

int add( int x, int y ) {
    int z = x + y;
    return z;
}

int main(int argc, char *argv[] ) {
    int a = 10;
    pp( a );
    int b = 20;
    pp( b );
    int c;
    c = add( a, 1 );
    pp( c );
    return 0;
}

