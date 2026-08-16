// A1 采药：死循环（volatile 防 -O2 消除）—— 应判 TLE
int main() {
    volatile int x = 0;
    while (true) {
        x = x + 1;
    }
    return 0;
}
