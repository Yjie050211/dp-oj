// B5 精打细算：恰好装满 + 字典序最小方案（编号反转）
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<int> c(N + 1), w(N + 1);
    for (int i = 1; i <= N; i++) cin >> c[i] >> w[i];
    vector<int> rc(N + 1), rw(N + 1);
    for (int i = 1; i <= N; i++) { rc[i] = c[N+1-i]; rw[i] = w[N+1-i]; }
    vector<vector<long long>> F(N + 1, vector<long long>(V + 1, NEG));
    F[0][0] = 0;
    for (int i = 1; i <= N; i++) {
        for (int v = 0; v <= V; v++) {
            F[i][v] = F[i-1][v];
            if (v >= rc[i] && F[i-1][v-rc[i]] != NEG) F[i][v] = max(F[i][v], F[i-1][v-rc[i]] + rw[i]);
        }
    }
    if (F[N][V] == NEG) { cout << "-1" << endl; return 0; }
    vector<int> picked;
    int v = V;
    for (int i = N; i >= 1; i--) {
        if (v >= rc[i] && F[i][v] != NEG && F[i-1][v-rc[i]] != NEG && F[i][v] == F[i-1][v-rc[i]] + rw[i]) {
            picked.push_back(N + 1 - i);
            v -= rc[i];
        }
    }
    sort(picked.begin(), picked.end());
    if (picked.empty()) { cout << "0" << endl; return 0; }
    for (size_t i = 0; i < picked.size(); i++) {
        if (i) cout << " ";
        cout << picked[i];
    }
    cout << endl;
    return 0;
}
