#include <stdio.h>

int main() {
    int a[2][2];
    debug();
    for(int i = 0;i < 2;i++){
        for(int j = 0;j < 2;j++){
            debug();
            a[i][j] = i + j;
            debug();
        }
    }

    for(int k = 0;k < 2;k++){
        for(int l = 0;l < 2;l++){
            debug();
            print(a[k][l]);
            debug();
        }
    }
    return 0;
}