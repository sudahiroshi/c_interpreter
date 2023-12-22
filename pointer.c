#include <stdio.h>

int main() {
    int a[][][] = {{{ 1,2,3 },{4,5,6}},{{ 7,8,9 },{10,11,12}}};
    int c[] = {1,2,3};
    int b[3];

    print( a[0][1][1] );
    int *d;
    d = a;
    print( d );
    print( *d );
    print( *(d+2) );
    debvars();
    return 0;
}