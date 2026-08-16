// B2 有线电视网：树形背包（收益最大化）
#include <bits/stdc++.h>
using namespace std;
const int NEG = -1e9;
int N, M;
vector<vector<pair<int,int>>> children;
vector<int> pay;
vector<int> isLeaf;

vector<int> dfs(int u) {
    vector<int> dp;
    if (isLeaf[u]) {
        dp = {0, pay[u]};
    } else {
        dp = {0};
        for (auto& it : children[u]) {
            int ch = it.first; int cost = it.second;
            vector<int> dc = dfs(ch);
            vector<int> nd(dp.size() + dc.size() - 1, NEG);
            for (size_t j = 0; j < dp.size(); j++) {
                if (dp[j] == NEG) continue;
                nd[j] = max(nd[j], dp[j]);
                for (size_t k = 1; k < dc.size(); k++) {
                    if (dc[k] != NEG) nd[j+k] = max(nd[j+k], dp[j] + dc[k] - cost);
                }
            }
            dp = nd;
        }
    }
    return dp;
}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    cin >> N >> M;
    children.assign(N + 1, {});
    isLeaf.assign(N + 1, 0);
    for (int i = N - M + 1; i <= N; i++) isLeaf[i] = 1;
    for (int i = 2; i <= N; i++) {
        int p, c; cin >> p >> c;
        children[p].push_back({i, c});
    }
    pay.assign(N + 1, 0);
    for (int i = N - M + 1; i <= N; i++) cin >> pay[i];
    vector<int> d = dfs(1);
    int ans = 0;
    for (size_t j = 0; j < d.size(); j++) if (d[j] >= 0) ans = max(ans, (int)j);
    cout << ans << endl;
    return 0;
}
