// A1 采药：标准 01 背包（一维逆序）—— 应判 AC
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N;
    cin >> V >> N;
    vector<long long> f(V + 1, 0);
    for (int i = 0; i < N; i++) {
        int c, w;
        cin >> c >> w;
        for (int v = V; v >= c; v--) {
            f[v] = max(f[v], f[v - c] + w);
        }
    }
    cout << f[V] << endl;
    return 0;
}
