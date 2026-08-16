// A8 选课：树形分组背包（泛化物品）
#include <bits/stdc++.h>
using namespace std;

int N, M;
vector<vector<int>> children;
vector<int> s;
const int NEG = -1e9;

vector<int> dfs(int u, int score) {
    vector<int> dp(M + 2, NEG);
    dp[1] = score;
    for (int c : children[u]) {
        vector<int> dc = dfs(c, s[c]);
        for (int j = M + 1; j >= 1; j--) {
            for (int k = 1; k < j; k++) {
                if (dp[j - k] != NEG && dc[k] != NEG) dp[j] = max(dp[j], dp[j - k] + dc[k]);
            }
        }
    }
    return dp;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> N >> M;
    children.assign(N + 1, {});
    s.assign(N + 1, 0);
    for (int i = 1; i <= N; i++) {
        int f;
        cin >> f >> s[i];
        children[f].push_back(i);
    }
    cout << dfs(0, 0)[M + 1] << endl;
    return 0;
}
