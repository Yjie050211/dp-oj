// A7-A12 测试数据生成器：固定种子可复现，答案由参考 DP 解生成
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

// ---------- A7 金明的预算方案 ----------
function dependentKnapsack(N, items) {
  const mains = items.filter((it) => it.q === 0);
  const attach = new Map();
  for (const it of items) {
    if (it.q !== 0) {
      if (!attach.has(it.q)) attach.set(it.q, []);
      attach.get(it.q).push(it);
    }
  }
  const groups = [];
  for (const m of mains) {
    const atts = attach.get(m.idx) ?? [];
    const val = m.v * m.p;
    const strategies = [{ cost: m.v, value: val }];
    if (atts.length >= 1) {
      const a = atts[0];
      strategies.push({ cost: m.v + a.v, value: val + a.v * a.p });
    }
    if (atts.length >= 2) {
      const a = atts[0], b = atts[1];
      strategies.push({ cost: m.v + b.v, value: val + b.v * b.p });
      strategies.push({ cost: m.v + a.v + b.v, value: val + a.v * a.p + b.v * b.p });
    }
    groups.push(strategies);
  }
  const f = new Array(N + 1).fill(0);
  for (const g of groups) {
    for (let v = N; v >= 0; v--) {
      for (const s of g) {
        if (v >= s.cost && f[v - s.cost] + s.value > f[v]) f[v] = f[v - s.cost] + s.value;
      }
    }
  }
  return f[N];
}

// ---------- A8 选课（树形分组背包）----------
function treeKnapsack(N, M, f, s) {
  const children = Array.from({ length: N + 1 }, () => []);
  for (let i = 1; i <= N; i++) children[f[i]].push(i);
  const NEG = -Infinity;
  const maxJ = M + 1;
  function dfs(u, score) {
    const dp = new Array(maxJ + 1).fill(NEG);
    dp[1] = score;
    for (const c of children[u]) {
      const dc = dfs(c, s[c]);
      for (let j = maxJ; j >= 1; j--) {
        for (let k = 1; k < j; k++) {
          if (dp[j - k] !== NEG && dc[k] !== NEG) dp[j] = Math.max(dp[j], dp[j - k] + dc[k]);
        }
      }
    }
    return dp;
  }
  return dfs(0, 0)[maxJ];
}

// ---------- A9 装箱问题 ----------
function packing(V, items) {
  const f = new Array(V + 1).fill(0);
  for (const c of items) {
    for (let v = V; v >= c; v--) if (f[v - c] + c > f[v]) f[v] = f[v - c] + c;
  }
  return V - f[V];
}

// ---------- A10 货币兑换（完全背包计数）----------
function coinCount(V, coins) {
  const f = new Array(V + 1).fill(0n);
  f[0] = 1n;
  for (const c of coins) {
    for (let v = c; v <= V; v++) f[v] = (f[v] + f[v - c]) % MOD;
  }
  return f[V].toString();
}

// ---------- A11 第 K 优解 ----------
function kthBest(V, items, K) {
  const NEG = -Infinity;
  const f = Array.from({ length: V + 1 }, () => new Array(K).fill(NEG));
  for (let v = 0; v <= V; v++) f[v][0] = 0; // 空方案对任何容量可达
  for (const [c, w] of items) {
    for (let v = V; v >= c; v--) {
      const a = f[v], b = f[v - c];
      const merged = new Array(K).fill(NEG);
      let i = 0, j = 0;
      for (let t = 0; t < K; t++) {
        const av = i < K ? a[i] : NEG;
        const bv = j < K ? b[j] + w : NEG;
        if (av >= bv) { merged[t] = av; i++; } else { merged[t] = bv; j++; }
      }
      f[v] = merged;
    }
  }
  return f[V][K - 1];
}

// ---------- A12 打包清单（字典序最小方案）----------
function lexMinSolution(V, items) {
  // 编号反转技巧：反转后标准反向回溯 = 优先选原编号小的物品（字典序最小）
  const N = items.length;
  const rev = [null, ...items.slice().reverse()]; // rev[i] = 原编号 N+1-i 的物品
  const F = Array.from({ length: N + 1 }, () => new Array(V + 1).fill(0));
  for (let i = 1; i <= N; i++) {
    const [c, w] = rev[i];
    for (let v = 0; v <= V; v++) {
      F[i][v] = F[i - 1][v];
      if (v >= c && F[i - 1][v - c] + w > F[i][v]) F[i][v] = F[i - 1][v - c] + w;
    }
  }
  const pickedRev = [];
  let v = V;
  for (let i = N; i >= 1; i--) {
    const [c, w] = rev[i];
    if (v >= c && F[i][v] === F[i - 1][v - c] + w) {
      pickedRev.push(N + 1 - i); // 还原原编号
      v -= c;
    }
  }
  pickedRev.sort((a, b) => a - b);
  return pickedRev.length ? pickedRev.join(" ") : "0";
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

// ================= A7 =================
{
  const cases = [];
  {
    const items = [
      { idx: 1, v: 800, p: 2, q: 0 }, { idx: 2, v: 400, p: 5, q: 1 },
      { idx: 3, v: 300, p: 5, q: 1 }, { idx: 4, v: 400, p: 3, q: 0 }, { idx: 5, v: 500, p: 2, q: 0 },
    ];
    cases.push({ input: "1000 5\n800 2 0\n400 5 1\n300 5 1\n400 3 0\n500 2 0\n", output: dependentKnapsack(1000, items) + "\n" });
  }
  for (const [seed, N, M] of [[601,1000,5],[602,2000,10],[603,5000,20],[604,10000,30],[605,20000,40],[606,32000,60],[607,32000,60],[608,32000,60],[609,15000,45],[610,32000,60],[611,8000,25]]) {
    const rnd = mulberry32(seed);
    const items = [];
    let nextIdx = 1;
    for (let m = 0; m < M; m++) {
      const v = ri(rnd, 1, Math.min(10000, N));
      const p = ri(rnd, 1, 5);
      items.push({ idx: nextIdx++, v, p, q: 0 });
    }
    for (const main of items) {
      const na = ri(rnd, 0, 2);
      for (let a = 0; a < na; a++) {
        items.push({ idx: nextIdx++, v: ri(rnd, 1, Math.min(10000, N)), p: ri(rnd, 1, 5), q: main.idx });
      }
    }
    const lines = items.map((it) => [it.v, it.p, it.q].join(" "));
    cases.push({ input: N + " " + items.length + "\n" + lines.join("\n") + "\n", output: dependentKnapsack(N, items) + "\n" });
  }
  writeCases(join(root, "data/problems/a7/cases"), cases);
}

// ================= A8 =================
{
  const cases = [];
  {
    const f = [0, 2, 0, 0, 2, 7, 7, 2];
    const s = [0, 2, 1, 4, 1, 1, 6, 2];
    cases.push({ input: "7 4\n2 2\n0 1\n0 4\n2 1\n7 1\n7 6\n2 2\n", output: treeKnapsack(7, 4, f, s) + "\n" });
  }
  for (const [seed, N, M] of [[701,5,3],[702,10,5],[703,20,10],[704,50,25],[705,100,50],[706,200,100],[707,300,150],[708,300,300],[709,150,60],[710,300,200],[711,80,40]]) {
    const rnd = mulberry32(seed);
    const f = new Array(N + 1).fill(0);
    const s = new Array(N + 1).fill(0);
    for (let i = 1; i <= N; i++) {
      f[i] = ri(rnd, 0, i - 1);
      s[i] = ri(rnd, 1, 20);
    }
    const lines = [];
    for (let i = 1; i <= N; i++) lines.push(f[i] + " " + s[i]);
    cases.push({ input: N + " " + M + "\n" + lines.join("\n") + "\n", output: treeKnapsack(N, M, f, s) + "\n" });
  }
  writeCases(join(root, "data/problems/a8/cases"), cases);
}

// ================= A9 =================
{
  const cases = [];
  cases.push({ input: "24 6\n8\n3\n12\n7\n9\n7\n", output: packing(24, [8, 3, 12, 7, 9, 7]) + "\n" });
  cases.push({ input: "100 1\n50\n", output: packing(100, [50]) + "\n" });
  cases.push({ input: "100 1\n101\n", output: "100\n" });
  for (const [seed, V, N] of [[801,10,3],[802,50,5],[803,200,10],[804,1000,20],[805,10000,30],[806,20000,30],[807,20000,30],[808,15000,25],[809,20000,30]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push(ri(rnd, 1, V));
    cases.push({ input: V + " " + N + "\n" + items.join("\n") + "\n", output: packing(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/a9/cases"), cases);
}

// ================= A10 =================
{
  const cases = [];
  cases.push({ input: "5 2\n1\n2\n", output: coinCount(5, [1, 2]) + "\n" });
  cases.push({ input: "10 1\n3\n", output: coinCount(10, [3]) + "\n" });
  for (const [seed, V, N] of [[901,10,3],[902,100,5],[903,1000,10],[904,5000,15],[905,10000,25],[906,10000,25],[907,10000,20],[908,8000,15],[909,10000,25],[910,6000,10]]) {
    const rnd = mulberry32(seed);
    const coins = new Set();
    while (coins.size < N) coins.add(ri(rnd, 1, V));
    const arr = [...coins];
    cases.push({ input: V + " " + N + "\n" + arr.join("\n") + "\n", output: coinCount(V, arr) + "\n" });
  }
  writeCases(join(root, "data/problems/a10/cases"), cases);
}

// ================= A11 =================
{
  const cases = [];
  {
    const items = [[3, 5], [4, 6], [7, 8]];
    cases.push({ input: "10 3 2\n3 5\n4 6\n7 8\n", output: kthBest(10, items, 2) + "\n" });
  }
  for (const [seed, V, N, K] of [[1001,10,10,1],[1002,50,20,5],[1003,100,30,10],[1004,500,60,20],[1005,1000,100,30],[1006,1000,100,30],[1007,1000,100,30],[1008,800,80,25],[1009,1000,100,30],[1010,500,50,15],[1011,1000,100,30]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, V), ri(rnd, 1, 100)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + " " + K + "\n" + lines.join("\n") + "\n", output: kthBest(V, items, K) + "\n" });
  }
  writeCases(join(root, "data/problems/a11/cases"), cases);
}

// ================= A12 =================
{
  const cases = [];
  {
    const items = [[3, 5], [4, 6], [5, 9], [7, 10]];
    cases.push({ input: "10 4\n3 5\n4 6\n5 9\n7 10\n", output: lexMinSolution(10, items) + "\n" });
  }
  cases.push({ input: "10 2\n3 5\n4 6\n", output: lexMinSolution(10, [[3,5],[4,6]]) + "\n" });
  cases.push({ input: "5 3\n6 10\n7 10\n8 10\n", output: lexMinSolution(5, [[6,10],[7,10],[8,10]]) + "\n" });
  for (const [seed, V, N] of [[1101,10,5],[1102,50,10],[1103,100,20],[1104,300,50],[1105,1000,100],[1106,1000,100],[1107,1000,100],[1108,800,80],[1109,1000,100],[1110,500,40]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, V), ri(rnd, 1, 10000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: lexMinSolution(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/a12/cases"), cases);
}
