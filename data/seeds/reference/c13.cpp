// C13 价值达标：混合背包价值维度最小花费（价值截断到 S）
#include <bits/stdc++.h>
using namespace std;
const long long INF = 1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int S, N; cin >> S >> N;
    vector<long long> f(S + 1, INF);
    f[0] = 0;
    auto apply = [&](int c, int w, bool full) {
        if (!full) {
            for (int s = S; s >= 0; s--) {
                if (f[s] == INF) continue;
                int ns = min(S, s + w);
                f[ns] = min(f[ns], f[s] + c);
            }
        } else {
            for (int s = 0; s <= S; s++) {
                if (f[s] == INF) continue;
                int ns = min(S, s + w);
                f[ns] = min(f[ns], f[s] + c);
            }
        }
    };
    for (int i = 0; i < N; i++) {
        int c, w, t, m = 1;
        cin >> c >> w >> t;
        if (t == 3) cin >> m;
        if (t == 2) apply(c, w, true);
        else {
            int k = 1;
            while (m > 0) {
                int take = min(k, m);
                apply(c * take, w * take, false);
                m -= take; k <<= 1;
            }
        }
    }
    if (f[S] == INF) cout << "-1" << endl;
    else cout << f[S] << endl;
    return 0;
}
