#include <stdio.h>

int add(int d, int e){
    debug();
    int f;
    debug();
    f = d + e;
    debug();
    return f;
}

int main() {
    int a = 3;
    debug();
    int b = 5;
    debug();
    int c = add(a,b);
    debug();
    print(c);
    return 0;
}