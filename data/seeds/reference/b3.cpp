// B3 社团活动：二维费用 + 分组背包
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, U, K; cin >> V >> U >> K;
    vector<vector<array<int,3>>> groups(K);
    for (int g = 0; g < K; g++) {
        int n; cin >> n;
        for (int i = 0; i < n; i++) {
            int c, d, w; cin >> c >> d >> w;
            groups[g].push_back({c, d, w});
        }
    }
    vector<vector<long long>> f(V + 1, vector<long long>(U + 1, 0));
    for (auto& g : groups) {
        for (int v = V; v >= 0; v--) for (int u = U; u >= 0; u--) {
            for (auto& it : g) {
                int c = it[0], d = it[1]; long long w = it[2];
                if (v >= c && u >= d) f[v][u] = max(f[v][u], f[v-c][u-d] + w);
            }
        }
    }
    cout << f[V][U] << endl;
    return 0;
}
