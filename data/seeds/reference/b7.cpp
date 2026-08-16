// B7 装备树：依赖森林树形背包
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int V, N;
vector<int> c, w;
vector<vector<int>> children;

vector<long long> dfs(int u) {
    vector<long long> dp(V + 1, NEG);
    dp[c[u]] = w[u];
    for (int ch : children[u]) {
        vector<long long> dc = dfs(ch);
        vector<long long> nd = dp;
        for (int v = V; v >= 0; v--) {
            if (dp[v] == NEG) continue;
            for (int k = 0; k <= V - v; k++) {
                if (dc[k] != NEG) nd[v+k] = max(nd[v+k], dp[v] + dc[k]);
            }
        }
        dp = nd;
    }
    return dp;
}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    cin >> V >> N;
    c.assign(N + 1, 0); w.assign(N + 1, 0);
    children.assign(N + 1, {});
    for (int i = 1; i <= N; i++) {
        int p; cin >> c[i] >> w[i] >> p;
        children[p].push_back(i);
    }
    vector<long long> f(V + 1, 0);
    for (int r : children[0]) {
        vector<long long> dr = dfs(r);
        vector<long long> nf = f;
        for (int v = V; v >= 0; v--) {
            for (int k = 0; k <= V - v; k++) {
                if (dr[k] != NEG) nf[v+k] = max(nf[v+k], f[v] + dr[k]);
            }
        }
        f = nf;
    }
    cout << *max_element(f.begin(), f.end()) << endl;
    return 0;
}
