#include <stdio.h>

int main() {
    int a[] = { 1,2,3 };
    int b[3];
    print( a[1] );
    int *d;
    d = a;
    print( d );
    print( *d );
    print( *(d+2) );

    return 0;
}