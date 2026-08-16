// A9 装箱问题：01 背包求最小剩余空间
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int V, N;
    cin >> V >> N;
    vector<int> f(V + 1, 0);
    for (int i = 0; i < N; i++) {
        int c;
        cin >> c;
        for (int v = V; v >= c; v--) f[v] = max(f[v], f[v - c] + c);
    }
    cout << V - f[V] << endl;
    return 0;
}
