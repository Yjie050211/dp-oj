// C12 矿石的摆法：多重背包方案数（滑动窗口前缀和）
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<long long> f(V + 1, 0);
    f[0] = 1;
    for (int i = 0; i < N; i++) {
        int c, m; cin >> c >> m;
        vector<long long> g = f, h(V + 1, 0);
        for (int v = 0; v <= V; v++) {
            long long val = g[v];
            if (v >= c) val = (val + h[v - c]) % MOD;
            long long cut = v - 1LL * (m + 1) * c;
            if (cut >= 0) val = ((val - g[cut]) % MOD + MOD) % MOD;
            h[v] = val;
        }
        f = h;
    }
    cout << f[V] << endl;
    return 0;
}
