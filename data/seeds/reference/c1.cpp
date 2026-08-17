// C1 满载而归：01 背包恰好装满
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, N; cin >> V >> N;
    vector<long long> f(V + 1, NEG);
    f[0] = 0;
    for (int i = 0; i < N; i++) {
        int c, w; cin >> c >> w;
        for (int v = V; v >= c; v--) if (f[v-c] != NEG) f[v] = max(f[v], f[v-c] + w);
    }
    if (f[V] == NEG) cout << "-1" << endl;
    else cout << f[V] << endl;
    return 0;
}
