// C9 恰好分组：分组背包 + 恰好装满
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N, K; cin >> V >> N >> K;
    vector<vector<pair<int, int>>> groups(K + 1);
    for (int i = 0; i < N; i++) {
        int c, w, g; cin >> c >> w >> g;
        groups[g].push_back({c, w});
    }
    vector<long long> f(V + 1, NEG);
    f[0] = 0;
    for (int g = 1; g <= K; g++) {
        vector<long long> cur = f;
        for (int v = 0; v <= V; v++) {
            if (cur[v] == NEG) continue;
            for (size_t j = 0; j < groups[g].size(); j++) {
                int c = groups[g][j].first, w = groups[g][j].second;
                int nv = v + c;
                if (nv <= V) f[nv] = max(f[nv], cur[v] + w);
            }
        }
    }
    if (f[V] == NEG) cout << "-1" << endl;
    else cout << f[V] << endl;
    return 0;
}
