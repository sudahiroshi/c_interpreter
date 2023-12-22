#include <stdio.h>

int main() {
    int b[][] = {{ 1,2,3 },{4,5,6}};
    print( b[0][2] );
    print( b[1][1] );
    b[1][1] = 100;
    print( b[1][1] );
    return 0;
}