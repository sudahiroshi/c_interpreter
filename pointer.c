#include <stdio.h>

int main() {
    int a[] = { 1,2,3 };
    print( a[1] );
    int *b;
    b = a;
    print( b );
    print( *b );
    debvars();
    return 0;
}