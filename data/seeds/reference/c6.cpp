// C6 装得下吗：多重背包可行性（二进制拆分 + 01 可达性）
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<char> f(V + 1, 0);
    f[0] = 1;
    for (int i = 0; i < N; i++) {
        int c, m; cin >> c >> m;
        int k = 1;
        while (m > 0) {
            int take = min(k, m);
            int cc = c * take;
            for (int v = V; v >= cc; v--) if (f[v - cc]) f[v] = 1;
            m -= take; k <<= 1;
        }
    }
    cout << (f[V] ? 1 : 0) << endl;
    return 0;
}
