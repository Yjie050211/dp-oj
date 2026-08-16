// A7 金明的预算方案：依赖背包（主件+附件 -> 物品组）
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int N, M;
    cin >> N >> M;
    vector<int> v(M + 1), p(M + 1), q(M + 1);
    vector<vector<int>> attach(M + 1);
    vector<int> mains;
    for (int i = 1; i <= M; i++) {
        cin >> v[i] >> p[i] >> q[i];
        if (q[i] == 0) mains.push_back(i);
        else attach[q[i]].push_back(i);
    }
    vector<long long> f(N + 1, 0);
    for (int m : mains) {
        vector<pair<int, long long>> strategies;
        strategies.push_back({v[m], 1LL * v[m] * p[m]});
        int a1 = attach[m].size() >= 1 ? attach[m][0] : 0;
        int a2 = attach[m].size() >= 2 ? attach[m][1] : 0;
        if (a1) strategies.push_back({v[m] + v[a1], 1LL * v[m] * p[m] + 1LL * v[a1] * p[a1]});
        if (a2) strategies.push_back({v[m] + v[a2], 1LL * v[m] * p[m] + 1LL * v[a2] * p[a2]});
        if (a1 && a2) strategies.push_back({v[m] + v[a1] + v[a2], 1LL * v[m] * p[m] + 1LL * v[a1] * p[a1] + 1LL * v[a2] * p[a2]});
        for (int cost = N; cost >= 0; cost--) {
            for (auto& it : strategies) {
                int c = it.first; long long w = it.second;
                if (cost >= c) f[cost] = max(f[cost], f[cost - c] + w);
            }
        }
    }
    cout << f[N] << endl;
    return 0;
}
