#include <stdio.h>

int main() {
    int a[2][2];
    debug();
    for(int i = 0;i < 2;i++){
        for(int j = 0;j < 2;j++){
            debug();
            a[i][j] = 2;
            debug();
        }
    }
    print(a);
    return 0;
}