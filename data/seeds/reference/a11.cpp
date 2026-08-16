// A11 骨牌收集家：01 背包第 K 优解（有序队列合并）
#include <bits/stdc++.h>
using namespace std;

const int NEG = -1e9;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N, K;
    cin >> V >> N >> K;
    vector<vector<int>> f(V + 1, vector<int>(K, NEG));
    for (int v = 0; v <= V; v++) f[v][0] = 0; // 空方案对任何容量可达
    for (int i = 0; i < N; i++) {
        int c, w;
        cin >> c >> w;
        for (int v = V; v >= c; v--) {
            vector<int> merged(K, NEG);
            int p = 0, q = 0;
            for (int t = 0; t < K; t++) {
                int av = p < K ? f[v][p] : NEG;
                int bv = q < K ? f[v - c][q] + w : NEG;
                if (av >= bv) { merged[t] = av; p++; } else { merged[t] = bv; q++; }
            }
            f[v] = merged;
        }
    }
    cout << f[V][K - 1] << endl;
    return 0;
}
