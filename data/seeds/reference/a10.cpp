// A10 货币兑换：完全背包计数（mod 1e9+7）
#include <bits/stdc++.h>
using namespace std;

const long long MOD = 1000000007LL;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N;
    cin >> V >> N;
    vector<long long> f(V + 1, 0);
    f[0] = 1;
    for (int i = 0; i < N; i++) {
        int c;
        cin >> c;
        for (int v = c; v <= V; v++) f[v] = (f[v] + f[v - c]) % MOD;
    }
    cout << f[V] << endl;
    return 0;
}
