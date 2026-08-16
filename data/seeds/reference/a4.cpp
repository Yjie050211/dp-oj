// A4 樱花：混合背包（按类型分派）
#include <bits/stdc++.h>
using namespace std;

void zeroOne(vector<long long>& f, int V, int c, long long w) {
    for (int v = V; v >= c; v--) f[v] = max(f[v], f[v - c] + w);
}
void complete(vector<long long>& f, int V, int c, long long w) {
    for (int v = c; v <= V; v++) f[v] = max(f[v], f[v - c] + w);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N;
    cin >> V >> N;
    vector<long long> f(V + 1, 0);
    for (int i = 0; i < N; i++) {
        int c, w, t, m = 1;
        cin >> c >> w >> t;
        if (t == 3) cin >> m;
        if (t == 1) zeroOne(f, V, c, w);
        else if (t == 2) complete(f, V, c, w);
        else {
            int k = 1;
            while (k < m) { zeroOne(f, V, c * k, 1LL * w * k); m -= k; k *= 2; }
            if (m > 0) zeroOne(f, V, c * m, 1LL * w * m);
        }
    }
    cout << f[V] << endl;
    return 0;
}
