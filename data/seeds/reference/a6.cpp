// A6 通天之分组背包：分组背包
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N, K;
    cin >> V >> N >> K;
    vector<vector<pair<int, int>>> groups(K + 1);
    for (int i = 0; i < N; i++) {
        int c, w, g;
        cin >> c >> w >> g;
        groups[g].push_back({c, w});
    }
    vector<long long> f(V + 1, 0);
    for (int g = 1; g <= K; g++) {
        for (int v = V; v >= 0; v--) {
            for (auto& it : groups[g]) {
                int c = it.first; long long w = it.second;
                if (v >= c) f[v] = max(f[v], f[v - c] + w);
            }
        }
    }
    cout << f[V] << endl;
    return 0;
}
