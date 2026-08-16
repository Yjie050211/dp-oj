// A5 勤工俭学：二维费用背包
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, U, N;
    cin >> V >> U >> N;
    vector<vector<long long>> f(V + 1, vector<long long>(U + 1, 0));
    for (int i = 0; i < N; i++) {
        int c, d, w;
        cin >> c >> d >> w;
        for (int v = V; v >= c; v--)
            for (int u = U; u >= d; u--)
                f[v][u] = max(f[v][u], f[v - c][u - d] + w);
    }
    cout << f[V][U] << endl;
    return 0;
}
