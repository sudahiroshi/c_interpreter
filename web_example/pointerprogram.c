#include<stdio.h>

int main(){
    int *a;
    debug();
    int b = 5;
    debug();
    int c = 10;
    debug();
    print(b);
    print(c);
    debug();
    a = &b;
    debug();
    *a = 3;
    debug();
    c = *a;
    debug();
    print(b);
    print(c);
    debug();
    return 0;
}