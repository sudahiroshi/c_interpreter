#include <stdio.h>

int add( int x, int y ) {
    return x + y;
}

int main() {
    int a = 10;
    printf( a );
    int b = 20;
    int c;
    c = add( a, b );
    return 0;
}

