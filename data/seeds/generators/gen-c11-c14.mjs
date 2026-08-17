// C11-C14 测试数据生成器：固定种子可复现
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

// C11 完全背包第 K 优（恰好装满）
function c11Solve(V, K, items) {
  const NEG = -Infinity;
  const f = Array.from({ length: V + 1 }, () => new Array(K).fill(NEG));
  f[0][0] = 0;
  for (const [c, w] of items) {
    for (let v = c; v <= V; v++) {
      const prev = f[v - c], cur = f[v];
      const merged = [];
      let i = 0, j = 0;
      while (merged.length < K && (i < K || j < K)) {
        const a = i < K && prev[i] !== NEG ? prev[i] + w : NEG;
        const b = j < K ? cur[j] : NEG;
        if (a >= b && a !== NEG) { merged.push(a); i++; }
        else if (b !== NEG) { merged.push(b); j++; }
        else break;
      }
      f[v] = merged.concat(new Array(K - merged.length).fill(NEG));
    }
  }
  return f[V][K - 1] === NEG ? -1 : f[V][K - 1];
}

// C12 多重背包方案数（滑动窗口前缀和：h[v] = sum g[v-kc], k=0..m）
function c12Solve(V, items) {
  let f = new Array(V + 1).fill(0n);
  f[0] = 1n;
  for (const [c, m] of items) {
    const g = f;
    const h = new Array(V + 1).fill(0n);
    for (let v = 0; v <= V; v++) {
      let val = g[v];
      if (v >= c) val = (val + h[v - c]) % MOD;
      const cut = v - (m + 1) * c;
      if (cut >= 0) val = ((val - g[cut]) % MOD + MOD) % MOD;
      h[v] = val;
    }
    f = h;
  }
  return f[V].toString();
}

// C13 混合背包价值维度最小花费（价值截断到 S）
function c13Solve(S, items) {
  const INF = Infinity;
  const f = new Array(S + 1).fill(INF);
  f[0] = 0;
  const apply01 = (c, w) => {
    for (let s = S; s >= 0; s--) {
      if (f[s] === INF) continue;
      const ns = Math.min(S, s + w);
      if (f[s] + c < f[ns]) f[ns] = f[s] + c;
    }
  };
  const applyFull = (c, w) => {
    for (let s = 0; s <= S; s++) {
      if (f[s] === INF) continue;
      const ns = Math.min(S, s + w);
      if (f[s] + c < f[ns]) f[ns] = f[s] + c;
    }
  };
  for (const it of items) {
    const c = it[0], w = it[1], t = it[2];
    if (t === 1) apply01(c, w);
    else if (t === 2) applyFull(c, w);
    else {
      let rem = it[3], k = 1;
      while (rem > 0) {
        const take = Math.min(k, rem);
        apply01(c * take, w * take);
        rem -= take; k <<= 1;
      }
    }
  }
  return f[S] === INF ? -1 : f[S];
}

// C14 分组背包方案数（拷贝数组保证每组至多一件）
function c14Solve(V, groups) {
  const f = new Array(V + 1).fill(0n);
  f[0] = 1n;
  for (const g of groups) {
    const cur = f.slice();
    for (let v = 0; v <= V; v++) {
      if (cur[v] === 0n) continue;
      for (const [c] of g) {
        const nv = v + c;
        if (nv <= V) f[nv] = (f[nv] + cur[v]) % MOD;
      }
    }
  }
  return f[V].toString();
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

// ================= C11 ================= 完全第 K 优
{
  const cases = [];
  cases.push({ input: "10 3 3\n2 3\n3 4\n5 9\n", output: c11Solve(10, 3, [[2, 3], [3, 4], [5, 9]]) + "\n" });
  cases.push({ input: "7 2 5\n2 1\n3 2\n", output: c11Solve(7, 5, [[2, 1], [3, 2]]) + "\n" });
  for (const [seed, V, N, K] of [[3001, 20, 5, 3], [3002, 50, 10, 5], [3003, 100, 20, 10], [3004, 300, 50, 15], [3005, 1000, 100, 30], [3006, 1000, 100, 30], [3007, 1000, 100, 30], [3008, 800, 80, 20], [3009, 1000, 100, 30]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, Math.min(V, 100)), ri(rnd, 1, 1000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + " " + K + "\n" + lines.join("\n") + "\n", output: c11Solve(V, K, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c11/cases"), cases);
}

// ================= C12 ================= 多重方案数
{
  const cases = [];
  cases.push({ input: "4 2\n2 2\n1 3\n", output: c12Solve(4, [[2, 2], [1, 3]]) + "\n" });
  cases.push({ input: "3 1\n2 1\n", output: c12Solve(3, [[2, 1]]) + "\n" });
  for (const [seed, V, N] of [[3101, 50, 5], [3102, 200, 10], [3103, 1000, 20], [3104, 5000, 50], [3105, 10000, 100], [3106, 10000, 100], [3107, 10000, 100], [3108, 8000, 80], [3109, 10000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, Math.min(V, 500)), ri(rnd, 1, 100)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: c12Solve(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c12/cases"), cases);
}

// ================= C13 ================= 混合价值维度
{
  const cases = [];
  cases.push({ input: "10 3\n3 4 1\n5 6 2\n2 3 3 2\n", output: c13Solve(10, [[3, 4, 1], [5, 6, 2], [2, 3, 3, 2]]) + "\n" });
  cases.push({ input: "100 1\n5 4 1\n", output: c13Solve(100, [[5, 4, 1]]) + "\n" });
  for (const [seed, S, N] of [[3201, 20, 5], [3202, 100, 10], [3203, 500, 20], [3204, 2000, 50], [3205, 5000, 100], [3206, 5000, 100], [3207, 5000, 100], [3208, 3000, 80], [3209, 5000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) {
      const t = ri(rnd, 1, 3);
      const it = [ri(rnd, 1, 1000), ri(rnd, 1, 100), t];
      if (t === 3) it.push(ri(rnd, 1, 100));
      items.push(it);
    }
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: S + " " + N + "\n" + lines.join("\n") + "\n", output: c13Solve(S, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c13/cases"), cases);
}

// ================= C14 ================= 分组方案数
{
  const cases = [];
  cases.push({ input: "8 6 3\n2 5 1\n3 6 1\n4 7 2\n5 8 2\n1 2 3\n6 9 3\n", output: c14Solve(8, [[[2, 5], [3, 6]], [[4, 7], [5, 8]], [[1, 2], [6, 9]]]) + "\n" });
  for (const [seed, V, N, K] of [[3301, 20, 10, 3], [3302, 100, 20, 5], [3303, 300, 50, 10], [3304, 1000, 200, 20], [3305, 1000, 1000, 100], [3306, 1000, 1000, 100], [3307, 1000, 1000, 100], [3308, 800, 800, 80], [3309, 1000, 1000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, Math.min(V, 30)), ri(rnd, 1, 100), ri(rnd, 1, K)]);
    const groups = Array.from({ length: K }, () => []);
    items.forEach((it) => groups[it[2] - 1].push([it[0], it[1]]));
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + " " + K + "\n" + lines.join("\n") + "\n", output: c14Solve(V, groups) + "\n" });
  }
  writeCases(join(root, "data/problems/c14/cases"), cases);
}
