// B1 矿石巨量：多重背包（二进制拆分，O(V Σlog M)）
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<long long> f(V + 1, 0);
    for (int i = 0; i < N; i++) {
        int c, w, m; cin >> c >> w >> m;
        int k = 1;
        while (k < m) {
            long long cc = 1LL*c*k, ww = 1LL*w*k;
            for (int v = V; v >= cc; v--) f[v] = max(f[v], f[v-cc] + ww);
            m -= k; k *= 2;
        }
        if (m > 0) {
            long long cc = 1LL*c*m, ww = 1LL*w*m;
            for (int v = V; v >= cc; v--) f[v] = max(f[v], f[v-cc] + ww);
        }
    }
    cout << f[V] << endl;
    return 0;
}
