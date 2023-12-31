#include <stdio.h>

int main() {
    int a[] = { 1,2,3 };
    int *d;
    d = a;
    print( *(d+0) );
    print( *(d+1) );
    print( *(d+2) );

    return 0;
}