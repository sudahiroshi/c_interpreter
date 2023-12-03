#include <stdio.h>

int add( int x, int y ) {
    return x + y;
}

int main(int argc, char *argv[] ) {
    int a = 10;
    print( a );
    printf( a );
    int b = 20;
    int c;
    c = add( a, b );
    return 0;
}

