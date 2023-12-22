#include <stdio.h>

int main() {
    int a[] = { 1,2,3 };
    int *d;
    d = a;
    *d = 123;
    for( int i=0; i<3; i++ ) {
        print( *d++ );
        print( d++ );
    }
    debvars();
    return 0;
}