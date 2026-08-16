// A12 打包清单：01 背包输出字典序最小的最优方案（编号反转技巧）
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N;
    cin >> V >> N;
    vector<int> c(N + 1), w(N + 1);
    for (int i = 1; i <= N; i++) cin >> c[i] >> w[i];

    // 编号反转：rev[i] 对应原编号 N+1-i 的物品
    vector<int> rc(N + 1), rw(N + 1);
    for (int i = 1; i <= N; i++) { rc[i] = c[N + 1 - i]; rw[i] = w[N + 1 - i]; }

    vector<vector<long long>> F(N + 1, vector<long long>(V + 1, 0));
    for (int i = 1; i <= N; i++) {
        for (int v = 0; v <= V; v++) {
            F[i][v] = F[i - 1][v];
            if (v >= rc[i]) F[i][v] = max(F[i][v], F[i - 1][v - rc[i]] + rw[i]);
        }
    }

    // 标准反向回溯：优先命中反转后靠后的物品 = 原编号靠前的物品
    vector<int> picked;
    int v = V;
    for (int i = N; i >= 1; i--) {
        if (v >= rc[i] && F[i][v] == F[i - 1][v - rc[i]] + rw[i]) {
            picked.push_back(N + 1 - i); // 还原原编号
            v -= rc[i];
        }
    }
    sort(picked.begin(), picked.end());
    if (picked.empty()) cout << "0" << endl;
    else {
        for (size_t i = 0; i < picked.size(); i++) {
            if (i) cout << " ";
            cout << picked[i];
        }
        cout << endl;
    }
    return 0;
}
