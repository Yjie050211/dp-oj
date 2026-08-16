// B6 同余凑数：模域上的 01 背包可行性
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int N, K; cin >> N >> K;
    vector<bool> f(K, false);
    for (int i = 0; i < N; i++) {
        long long a0; cin >> a0;
        int a = (int)(a0 % K);
        if (a == 0) { f[0] = true; continue; }
        vector<bool> g = f;
        g[a] = true;
        for (int j = 0; j < K; j++) if (f[j]) g[(j + a) % K] = true;
        f = g;
    }
    int r; cin >> r;
    cout << (f[r] ? 1 : 0) << endl;
    return 0;
}
