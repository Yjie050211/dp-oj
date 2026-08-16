// B4 赏花计数：混合背包 + 最优方案总数
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007LL;
int V;

void zeroOne(vector<long long>& f, vector<long long>& g, int c, long long w) {
    for (int v = V; v >= c; v--) {
        long long nv = f[v-c] + w;
        if (nv > f[v]) { f[v] = nv; g[v] = g[v-c]; }
        else if (nv == f[v]) g[v] = (g[v] + g[v-c]) % MOD;
    }
}
void complete(vector<long long>& f, vector<long long>& g, int c, long long w) {
    for (int v = c; v <= V; v++) {
        long long nv = f[v-c] + w;
        if (nv > f[v]) { f[v] = nv; g[v] = g[v-c]; }
        else if (nv == f[v]) g[v] = (g[v] + g[v-c]) % MOD;
    }
}
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int N; cin >> V >> N;
    vector<long long> f(V + 1, 0), g(V + 1, 1);
    for (int i = 0; i < N; i++) {
        int c, w, t, m = 1;
        cin >> c >> w >> t;
        if (t == 3) cin >> m;
        if (t == 1) zeroOne(f, g, c, w);
        else if (t == 2) complete(f, g, c, w);
        else {
            int k = 1;
            while (k < m) { zeroOne(f, g, c*k, 1LL*w*k); m -= k; k *= 2; }
            if (m > 0) zeroOne(f, g, c*m, 1LL*w*m);
        }
    }
    cout << f[V] << " " << g[V] % MOD << endl;
    return 0;
}
