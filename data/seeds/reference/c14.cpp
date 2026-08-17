// C14 分组的摆法：分组背包方案数（拷贝数组保证每组至多一件）
#include <bits/stdc++.h>
using namespace std;
const long long MOD = 1000000007;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N, K; cin >> V >> N >> K;
    vector<vector<pair<int, int>>> groups(K + 1);
    for (int i = 0; i < N; i++) {
        int c, w, g; cin >> c >> w >> g;
        groups[g].push_back({c, w});
    }
    vector<long long> f(V + 1, 0);
    f[0] = 1;
    for (int g = 1; g <= K; g++) {
        vector<long long> cur = f;
        for (int v = 0; v <= V; v++) {
            if (cur[v] == 0) continue;
            for (size_t j = 0; j < groups[g].size(); j++) {
                int nv = v + groups[g][j].first;
                if (nv <= V) f[nv] = (f[nv] + cur[v]) % MOD;
            }
        }
    }
    cout << f[V] << endl;
    return 0;
}
