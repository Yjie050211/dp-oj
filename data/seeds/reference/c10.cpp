// C10 自由搭配：依赖背包（主件+不限量附件，先主件后附件 01 线性化）
#include <bits/stdc++.h>
using namespace std;
const long long NEG = -1e18;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int N, M; cin >> N >> M;
    vector<int> v(M + 1), p(M + 1), q(M + 1);
    vector<int> mains;
    vector<int> mainId(M + 1, -1);
    for (int i = 1; i <= M; i++) {
        cin >> v[i] >> p[i] >> q[i];
        if (q[i] == 0) { mainId[i] = (int)mains.size(); mains.push_back(i); }
    }
    vector<vector<int>> atts(mains.size());
    for (int i = 1; i <= M; i++) {
        if (q[i] != 0) atts[mainId[q[i]]].push_back(i);
    }
    vector<long long> f(N + 1, NEG);
    f[0] = 0;
    for (size_t g = 0; g < mains.size(); g++) {
        int mi = mains[g];
        vector<long long> best(N + 1, NEG);
        for (int w = N; w >= v[mi]; w--) {
            if (f[w - v[mi]] != NEG) best[w] = f[w - v[mi]] + 1LL * v[mi] * p[mi];
        }
        for (size_t j = 0; j < atts[g].size(); j++) {
            int ai = atts[g][j];
            for (int w = N; w >= v[ai]; w--) {
                if (best[w - v[ai]] != NEG) best[w] = max(best[w], best[w - v[ai]] + 1LL * v[ai] * p[ai]);
            }
        }
        for (int w = 0; w <= N; w++) f[w] = max(f[w], best[w]);
    }
    long long ans = 0;
    for (int w = 0; w <= N; w++) ans = max(ans, f[w]);
    cout << ans << endl;
    return 0;
}
