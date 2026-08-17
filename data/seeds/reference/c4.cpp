// C4 零钱最少张：完全背包最少件数
#include <bits/stdc++.h>
using namespace std;
const int INF = 1e9;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<int> f(V + 1, INF);
    f[0] = 0;
    for (int i = 0; i < N; i++) {
        int c; cin >> c;
        for (int v = c; v <= V; v++) f[v] = min(f[v], f[v-c] + 1);
    }
    if (f[V] >= INF) cout << "-1" << endl;
    else cout << f[V] << endl;
    return 0;
}
