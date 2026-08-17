// C2 预算最小化：价值维度 01 背包最小费用
#include <bits/stdc++.h>
using namespace std;
const long long INF = 1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int S, N; cin >> S >> N;
    vector<long long> f(S + 1, INF);
    f[0] = 0;
    for (int i = 0; i < N; i++) {
        int c, w; cin >> c >> w;
        for (int s = S; s >= 0; s--) {
            if (f[s] != INF) {
                int ns = min(S, s + w);
                f[ns] = min(f[ns], f[s] + c);
            }
        }
    }
    if (f[S] == INF) cout << "-1" << endl;
    else cout << f[S] << endl;
    return 0;
}
