// C8 满负荷工作：二维费用背包 + 恰好装满
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, U, N; cin >> V >> U >> N;
    vector<vector<long long>> f(V + 1, vector<long long>(U + 1, NEG));
    f[0][0] = 0;
    for (int i = 0; i < N; i++) {
        int c, d, w; cin >> c >> d >> w;
        for (int v = V; v >= c; v--) {
            for (int u = U; u >= d; u--) {
                if (f[v - c][u - d] != NEG) f[v][u] = max(f[v][u], f[v - c][u - d] + w);
            }
        }
    }
    if (f[V][U] == NEG) cout << "-1" << endl;
    else cout << f[V][U] << endl;
    return 0;
}
