// C11 求最优的次优：完全背包第 K 优（恰好装满，双指针归并）
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N, K; cin >> V >> N >> K;
    vector<vector<long long>> f(V + 1, vector<long long>(K, NEG));
    f[0][0] = 0;
    for (int i = 0; i < N; i++) {
        int c, w; cin >> c >> w;
        for (int v = c; v <= V; v++) {
            vector<long long> merged(K, NEG);
            int a = 0, b = 0, idx = 0;
            while (idx < K && (a < K || b < K)) {
                long long x = (a < K && f[v - c][a] != NEG) ? f[v - c][a] + w : NEG;
                long long y = (b < K) ? f[v][b] : NEG;
                if (x >= y && x != NEG) { merged[idx++] = x; a++; }
                else if (y != NEG) { merged[idx++] = y; b++; }
                else break;
            }
            f[v] = merged;
        }
    }
    if (f[V][K - 1] == NEG) cout << "-1" << endl;
    else cout << f[V][K - 1] << endl;
    return 0;
}
