// B1-B8 测试数据生成器：固定种子可复现，答案由参考 DP 解生成
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (rnd, lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const MOD = 1000000007n;

// ---------- B1 多重背包（单调队列 O(VN)）----------
function multipleMono(V, items) {
  const f = new Array(V + 1).fill(0);
  for (const [c, w, m] of items) {
    const g = f.slice();
    for (let r = 0; r < c; r++) {
      const q = [];
      for (let t = 0, v = r; v <= V; t++, v += c) {
        while (q.length && g[q[q.length - 1]] - ((q[q.length - 1] - r) / c) * w <= g[v] - t * w) q.pop();
        q.push(v);
        while (q.length && t - (q[0] - r) / c > m) q.shift();
        f[v] = g[q[0]] + (t - (q[0] - r) / c) * w;
      }
    }
  }
  return f[V];
}

// ---------- B2 有线电视网（树形背包）----------
function cableTV(N, M, edges, pays) {
  const children = Array.from({ length: N + 1 }, () => []);
  for (let i = 2; i <= N; i++) children[edges[i][0]].push([i, edges[i][1]]);
  const isLeaf = new Array(N + 1).fill(false);
  for (let i = N - M + 1; i <= N; i++) isLeaf[i] = true;
  const NEG = -1e9;
  function dfs(u) {
    let dp;
    if (isLeaf[u]) {
      dp = [0, pays[u]];
    } else {
      dp = [0];
      for (const [ch, cost] of children[u]) {
        const dc = dfs(ch);
        const nd = new Array(dp.length + dc.length - 1).fill(NEG);
        for (let j = 0; j < dp.length; j++) {
          if (dp[j] === NEG) continue;
          nd[j] = Math.max(nd[j], dp[j]); // 不接这个孩子
          for (let k = 1; k < dc.length; k++) {
            if (dc[k] !== NEG) nd[j + k] = Math.max(nd[j + k], dp[j] + dc[k] - cost);
          }
        }
        dp = nd;
      }
    }
    return dp;
  }
  const d = dfs(1);
  let ans = 0;
  for (let j = 0; j < d.length; j++) if (d[j] >= 0) ans = Math.max(ans, j);
  return ans;
}

// ---------- B3 二维费用 + 分组 ----------
function grouped2D(V, U, groups) {
  const f = Array.from({ length: V + 1 }, () => new Array(U + 1).fill(0));
  for (const g of groups) {
    for (let v = V; v >= 0; v--) {
      for (let u = U; u >= 0; u--) {
        for (const [c, d, w] of g) {
          if (v >= c && u >= d && f[v - c][u - d] + w > f[v][u]) f[v][u] = f[v - c][u - d] + w;
        }
      }
    }
  }
  return f[V][U];
}

// ---------- B4 混合背包 + 最优方案数 ----------
function mixedCount(V, items) {
  const MODN = 1000000007;
  const f = new Array(V + 1).fill(0);
  const g = new Array(V + 1).fill(1); // 空方案
  const zeroOne = (c, w) => {
    for (let v = V; v >= c; v--) {
      const nv = f[v - c] + w;
      if (nv > f[v]) { f[v] = nv; g[v] = g[v - c]; }
      else if (nv === f[v]) g[v] = (g[v] + g[v - c]) % MODN;
    }
  };
  const complete = (c, w) => {
    for (let v = c; v <= V; v++) {
      const nv = f[v - c] + w;
      if (nv > f[v]) { f[v] = nv; g[v] = g[v - c]; }
      else if (nv === f[v]) g[v] = (g[v] + g[v - c]) % MODN;
    }
  };
  for (const it of items) {
    if (it.type === 1) zeroOne(it.c, it.w);
    else if (it.type === 2) complete(it.c, it.w);
    else {
      let k = 1, left = it.m;
      while (k < left) { zeroOne(it.c * k, it.w * k); left -= k; k *= 2; }
      if (left > 0) zeroOne(it.c * left, it.w * left);
    }
  }
  return [f[V], g[V] % MODN];
}

// ---------- B5 恰好装满 + 字典序最小方案 ----------
function exactLex(V, items) {
  const N = items.length;
  const rev = [null, ...items.slice().reverse()];
  const NEG = -Infinity;
  const F = Array.from({ length: N + 1 }, () => new Array(V + 1).fill(NEG));
  F[0][0] = 0;
  for (let i = 1; i <= N; i++) {
    const [c, w] = rev[i];
    for (let v = 0; v <= V; v++) {
      F[i][v] = F[i - 1][v];
      if (v >= c && F[i - 1][v - c] !== NEG) F[i][v] = Math.max(F[i][v], F[i - 1][v - c] + w);
    }
  }
  if (F[N][V] === NEG) return "-1";
  const picked = [];
  let v = V;
  for (let i = N; i >= 1; i--) {
    const [c, w] = rev[i];
    if (v >= c && F[i][v] !== NEG && F[i - 1][v - c] !== NEG && F[i][v] === F[i - 1][v - c] + w) {
      picked.push(N + 1 - i);
      v -= c;
    }
  }
  picked.sort((a, b) => a - b);
  return picked.length ? picked.join(" ") : "0";
}

// ---------- B6 同余背包 ----------
function congruentKnapsack(K, arr, r) {
  const f = new Array(K).fill(false);
  for (const a0 of arr) {
    const a = a0 % K;
    if (a === 0) { f[0] = true; continue; }
    const g = f.slice();
    g[a] = true;
    for (let j = 0; j < K; j++) if (f[j]) g[(j + a) % K] = true;
    f.splice(0, K, ...g);
  }
  return f[r] ? "1" : "0";
}

// ---------- B7 依赖森林（树形背包）----------
function forestKnapsack(V, items) {
  const N = items.length;
  const children = Array.from({ length: N + 1 }, () => []);
  for (let i = 1; i <= N; i++) children[items[i - 1][2]].push(i);
  const NEG = -Infinity;
  function dfs(u) {
    const [c, w] = items[u - 1];
    const dp = new Array(V + 1).fill(NEG);
    dp[c] = w;
    for (const ch of children[u]) {
      const dc = dfs(ch);
      const nd = dp.slice();
      for (let v = V; v >= 0; v--) {
        if (dp[v] === NEG) continue;
        for (let k = 0; k <= V - v; k++) {
          if (dc[k] !== NEG && dp[v] + dc[k] > nd[v + k]) nd[v + k] = dp[v] + dc[k];
        }
      }
      dp.splice(0, dp.length, ...nd);
    }
    return dp;
  }
  const f = new Array(V + 1).fill(0);
  for (const r of children[0]) {
    const dr = dfs(r);
    const nf = f.slice();
    for (let v = V; v >= 0; v--) {
      for (let k = 0; k <= V - v; k++) {
        if (dr[k] !== NEG && f[v] + dr[k] > nf[v + k]) nf[v + k] = f[v] + dr[k];
      }
    }
    f.splice(0, f.length, ...nf);
  }
  return Math.max(...f);
}

// ---------- B8 泛化物品求和 ----------
function generalizedSum(V, hs) {
  let s = hs[0];
  for (let i = 1; i < hs.length; i++) {
    const t = new Array(V + 1).fill(0);
    for (let v = 0; v <= V; v++) {
      let best = 0;
      for (let k = 0; k <= v; k++) {
        const val = s[v - k] + hs[i][k];
        if (val > best) best = val;
      }
      t[v] = best;
    }
    s = t;
  }
  return Math.max(...s);
}

function writeCases(dir, cases) {
  mkdirSync(dir, { recursive: true });
  cases.forEach((c, idx) => {
    const no = String(idx + 1).padStart(2, "0");
    writeFileSync(join(dir, no + ".in"), c.input, "utf8");
    writeFileSync(join(dir, no + ".out"), c.output, "utf8");
  });
  console.log(dir.split("problems")[1] + " : " + cases.length + " 组");
}

const root = new URL("../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// ================= B1 =================
{
  const cases = [];
  {
    const items = [[2, 3, 4], [3, 4, 3], [5, 7, 2]];
    cases.push({ input: "10 3\n2 3 4\n3 4 3\n5 7 2\n", output: multipleMono(10, items) + "\n" });
  }
  for (const [seed, V, N] of [[1201,100,5],[1202,1000,10],[1203,5000,30],[1204,10000,60],[1205,20000,100],[1206,20000,100],[1207,20000,100],[1208,15000,80],[1209,20000,100],[1210,10000,50],[1211,20000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, Math.min(V, 5000)), ri(rnd, 1, 1000), ri(rnd, 1, 20000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: multipleMono(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/b1/cases"), cases);
}

// ================= B2 =================
{
  const cases = [];
  {
    const N = 5, M = 3;
    const edges = [null, null, [1, 2], [2, 2], [2, 2], [1, 25]];
    const pays = new Array(N + 1).fill(0); // 按节点编号索引：叶子 3,4,5
    pays[3] = 0; pays[4] = 10; pays[5] = 10;
    cases.push({ input: "5 3\n1 2\n2 2\n2 2\n1 25\n0\n10\n10\n", output: cableTV(N, M, edges, pays) + "\n" });
  }
  for (const [seed, N, M] of [[1301,6,3],[1302,10,5],[1303,20,10],[1304,50,25],[1305,100,50],[1306,200,100],[1307,300,150],[1308,300,150],[1309,150,70],[1310,300,150],[1311,80,40]]) {
    const rnd = mulberry32(seed);
    const edges = [null, null];
    for (let i = 2; i <= N; i++) {
      edges.push([ri(rnd, 1, i - 1), ri(rnd, 1, 1000)]);
    }
    const pays = new Array(N + 1).fill(0); // 按节点编号索引
    for (let i = N - M + 1; i <= N; i++) pays[i] = ri(rnd, 0, 1000);
    const lines = [];
    for (let i = 2; i <= N; i++) lines.push(edges[i][0] + " " + edges[i][1]);
    for (let i = N - M + 1; i <= N; i++) lines.push(String(pays[i]));
    cases.push({ input: N + " " + M + "\n" + lines.join("\n") + "\n", output: cableTV(N, M, edges, pays) + "\n" });
  }
  writeCases(join(root, "data/problems/b2/cases"), cases);
}

// ================= B3 =================
{
  const cases = [];
  {
    const groups = [[[2, 3, 6], [1, 2, 4]], [[3, 2, 5], [4, 3, 8]], [[5, 5, 10], [2, 1, 3]]];
    cases.push({ input: "10 8 3\n2\n2 3 6\n1 2 4\n2\n3 2 5\n4 3 8\n2\n5 5 10\n2 1 3\n", output: grouped2D(10, 8, groups) + "\n" });
  }
  for (const [seed, V, U, K] of [[1401,10,10,3],[1402,20,20,5],[1403,50,50,10],[1404,100,100,30],[1405,100,100,50],[1406,100,100,50],[1407,100,100,50],[1408,80,80,40],[1409,100,100,50],[1410,60,60,20],[1411,100,100,50]]) {
    const rnd = mulberry32(seed);
    const groups = [];
    const blocks = [];
    for (let g = 0; g < K; g++) {
      const n = ri(rnd, 1, 20);
      const grp = [];
      const rows = [];
      for (let i = 0; i < n; i++) {
        const it = [ri(rnd, 1, V), ri(rnd, 1, U), ri(rnd, 1, 1000)];
        grp.push(it);
        rows.push(it.join(" "));
      }
      groups.push(grp);
      blocks.push(String(n) + "\n" + rows.join("\n"));
    }
    cases.push({ input: V + " " + U + " " + K + "\n" + blocks.join("\n") + "\n", output: grouped2D(V, U, groups) + "\n" });
  }
  writeCases(join(root, "data/problems/b3/cases"), cases);
}

// ================= B4 =================
{
  const cases = [];
  {
    const items = [{ c: 3, w: 5, type: 1 }, { c: 4, w: 6, type: 2 }, { c: 5, w: 9, type: 3, m: 2 }];
    const [mv, cnt] = mixedCount(10, items);
    cases.push({ input: "10 3\n3 5 1\n4 6 2\n5 9 3 2\n", output: mv + " " + cnt + "\n" });
  }
  for (const [seed, V, N] of [[1501,50,10],[1502,100,20],[1503,300,50],[1504,1000,100],[1505,1000,100],[1506,1000,100],[1507,800,80],[1508,1000,100],[1509,500,60],[1510,1000,100],[1511,200,30]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) {
      const type = ri(rnd, 1, 3);
      const m = type === 3 ? ri(rnd, 1, 100) : 0;
      items.push({ c: ri(rnd, 1, Math.min(V, 200)), w: ri(rnd, 1, 1000), type, m });
    }
    const lines = items.map((it) => (it.type === 3 ? [it.c, it.w, 3, it.m].join(" ") : [it.c, it.w, it.type].join(" ")));
    const [mv, cnt] = mixedCount(V, items);
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: mv + " " + cnt + "\n" });
  }
  writeCases(join(root, "data/problems/b4/cases"), cases);
}

// ================= B5 =================
{
  const cases = [];
  {
    const items = [[3, 5], [4, 6], [5, 9], [7, 10]];
    cases.push({ input: "10 4\n3 5\n4 6\n5 9\n7 10\n", output: exactLex(10, items) + "\n" });
  }
  cases.push({ input: "10 3\n4 5\n6 7\n8 9\n", output: exactLex(10, [[4,5],[6,7],[8,9]]) + "\n" }); // 4+6=10 -> {1,2}
  cases.push({ input: "5 2\n2 3\n2 4\n", output: exactLex(5, [[2,3],[2,4]]) + "\n" }); // 无解(奇偶) -> -1
  for (const [seed, V, N] of [[1601,20,5],[1602,50,10],[1603,100,20],[1604,300,50],[1605,1000,100],[1606,1000,100],[1607,1000,100],[1608,800,80],[1609,1000,100],[1610,500,40]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, V), ri(rnd, 1, 10000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: exactLex(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/b5/cases"), cases);
}

// ================= B6 =================
{
  const cases = [];
  cases.push({ input: "3 4\n5\n7\n11\n2\n", output: congruentKnapsack(4, [5, 7, 11], 2) + "\n" });
  cases.push({ input: "2 6\n2\n4\n1\n", output: congruentKnapsack(6, [2, 4], 1) + "\n" }); // 2+4=6≡0, 2≡2, 4≡4, 无 1 -> 0
  for (const [seed, N, K] of [[1701,10,10],[1702,20,50],[1703,50,100],[1704,100,500],[1705,100,1000],[1706,100,1000],[1707,100,1000],[1708,80,800],[1709,100,1000],[1710,60,300],[1711,100,1000]]) {
    const rnd = mulberry32(seed);
    const arr = [];
    for (let i = 0; i < N; i++) arr.push(ri(rnd, 1, 1000000000));
    const r = ri(rnd, 0, K - 1);
    cases.push({ input: N + " " + K + "\n" + arr.join("\n") + "\n" + r + "\n", output: congruentKnapsack(K, arr, r) + "\n" });
  }
  writeCases(join(root, "data/problems/b6/cases"), cases);
}

// ================= B7 =================
{
  const cases = [];
  {
    const items = [[2, 3, 0], [3, 4, 1], [5, 9, 0], [2, 1, 2], [4, 6, 3]];
    cases.push({ input: "10 5\n2 3 0\n3 4 1\n5 9 0\n2 1 2\n4 6 3\n", output: forestKnapsack(10, items) + "\n" });
  }
  for (const [seed, V, N] of [[1801,20,5],[1802,50,10],[1803,100,20],[1804,300,30],[1805,1000,50],[1806,1000,50],[1807,1000,50],[1808,800,40],[1809,1000,50],[1810,500,25]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 1; i <= N; i++) {
      items.push([ri(rnd, 1, V), ri(rnd, 1, 1000), ri(rnd, 0, i - 1)]);
    }
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: forestKnapsack(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/b7/cases"), cases);
}

// ================= B8 =================
{
  const cases = [];
  {
    const hs = [[0, 3, 5, 9, 10], [0, 2, 4, 6, 8]];
    cases.push({ input: "4 2\n0 3 5 9 10\n0 2 4 6 8\n", output: generalizedSum(4, hs) + "\n" });
  }
  for (const [seed, V, K] of [[1901,20,2],[1902,50,3],[1903,100,4],[1904,200,5],[1905,200,5],[1906,200,5],[1907,150,4],[1908,200,5],[1909,100,3],[1910,200,5],[1911,80,2]]) {
    const rnd = mulberry32(seed);
    const hs = [];
    for (let i = 0; i < K; i++) {
      const row = [];
      for (let v = 0; v <= V; v++) row.push(ri(rnd, 0, 1000));
      hs.push(row);
    }
    cases.push({ input: V + " " + K + "\n" + hs.map((r) => r.join(" ")).join("\n") + "\n", output: generalizedSum(V, hs) + "\n" });
  }
  writeCases(join(root, "data/problems/b8/cases"), cases);
}
