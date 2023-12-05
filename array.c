#include <stdio.h>

int main() {
    int a[5];
    int b[] = { 1,2,3 };
    int c[3] = { 1,2,3 };
    print( b[1] );
    a[0] = 5;
    print( a[0] );
    return 0;
}