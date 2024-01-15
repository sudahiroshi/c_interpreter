#include<stdio.h>

int main() {
    int a[2];
    debug();
    int b[2] = {1,2};
    debug();
    for(int i=0;i<2;i++){
        a[i] = b[i];
        debug();
    }
    return 0;
}