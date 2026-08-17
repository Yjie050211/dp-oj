// C7 恰好赏花：混合背包 + 恰好装满
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<long long> f(V + 1, NEG);
    f[0] = 0;
    for (int i = 0; i < N; i++) {
        int c, w, t, m = 1;
        cin >> c >> w >> t;
        if (t == 3) cin >> m;
        if (t == 2) {
            for (int v = c; v <= V; v++) if (f[v - c] != NEG) f[v] = max(f[v], f[v - c] + w);
        } else {
            int k = 1;
            while (m > 0) {
                int take = min(k, m);
                int cc = c * take;
                long long ww = 1LL * w * take;
                for (int v = V; v >= cc; v--) if (f[v - cc] != NEG) f[v] = max(f[v], f[v - cc] + ww);
                m -= take; k <<= 1;
            }
        }
    }
    if (f[V] == NEG) cout << "-1" << endl;
    else cout << f[V] << endl;
    return 0;
}
