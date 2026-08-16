// B8 泛化物品求和：两两合并 O(KV^2)
#include <bits/stdc++.h>
using namespace std;
int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int V, K; cin >> V >> K;
    vector<long long> s(V + 1);
    for (int v = 0; v <= V; v++) cin >> s[v];
    for (int i = 1; i < K; i++) {
        vector<long long> h(V + 1);
        for (int v = 0; v <= V; v++) cin >> h[v];
        vector<long long> t(V + 1, 0);
        for (int v = 0; v <= V; v++) {
            long long best = 0;
            for (int k = 0; k <= v; k++) best = max(best, s[v-k] + h[k]);
            t[v] = best;
        }
        s = t;
    }
    cout << *max_element(s.begin(), s.end()) << endl;
    return 0;
}
