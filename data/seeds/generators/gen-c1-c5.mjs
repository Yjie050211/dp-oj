// C1-C5 测试数据生成器：固定种子可复现
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

// C1 恰好装满最大价值
function c1Solve(V, items) {
  const NEG = -Infinity;
  const f = new Array(V + 1).fill(NEG);
  f[0] = 0;
  for (const [c, w] of items) {
    for (let v = V; v >= c; v--) if (f[v - c] !== NEG && f[v - c] + w > f[v]) f[v] = f[v - c] + w;
  }
  return f[V] === NEG ? -1 : f[V];
}

// C2 价值维度最小费用
function c2Solve(S, items) {
  const INF = Infinity;
  const f = new Array(S + 1).fill(INF);
  f[0] = 0;
  for (const [c, w] of items) {
    for (let s = S; s >= 0; s--) {
      if (f[s] !== INF) {
        const ns = Math.min(S, s + w);
        if (f[s] + c < f[ns]) f[ns] = f[s] + c;
      }
    }
  }
  return f[S] === INF ? -1 : f[S];
}

// C3 恰好装满方案数
function c3Solve(V, items) {
  const f = new Array(V + 1).fill(0n);
  f[0] = 1n;
  for (const c of items) {
    for (let v = V; v >= c; v--) f[v] = (f[v] + f[v - c]) % MOD;
  }
  return f[V].toString();
}

// C4 完全最少件数
function c4Solve(V, coins) {
  const INF = 1e9;
  const f = new Array(V + 1).fill(INF);
  f[0] = 0;
  for (const c of coins) {
    for (let v = c; v <= V; v++) if (f[v - c] + 1 < f[v]) f[v] = f[v - c] + 1;
  }
  return f[V] >= INF ? -1 : f[V];
}

// C5 完全恰好装满最大价值
function c5Solve(V, items) {
  const NEG = -Infinity;
  const f = new Array(V + 1).fill(NEG);
  f[0] = 0;
  for (const [c, w] of items) {
    for (let v = c; v <= V; v++) if (f[v - c] !== NEG && f[v - c] + w > f[v]) f[v] = f[v - c] + w;
  }
  return f[V] === NEG ? -1 : f[V];
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

// ================= C1 =================
{
  const cases = [];
  cases.push({ input: "10 3\n3 5\n4 6\n7 10\n", output: c1Solve(10, [[3,5],[4,6],[7,10]]) + "\n" });
  cases.push({ input: "10 2\n3 5\n5 7\n", output: c1Solve(10, [[3,5],[5,7]]) + "\n" }); // 3+5=8, 无恰好 10 -> -1
  cases.push({ input: "5 2\n2 4\n3 6\n", output: c1Solve(5, [[2,4],[3,6]]) + "\n" }); // 2+3=5 -> 10
  for (const [seed, V, N] of [[2001,20,5],[2002,50,10],[2003,100,20],[2004,300,50],[2005,1000,100],[2006,1000,100],[2007,1000,100],[2008,800,80],[2009,1000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, V), ri(rnd, 1, 10000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: c1Solve(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c1/cases"), cases);
}

// ================= C2 =================
{
  const cases = [];
  cases.push({ input: "10 3\n3 4\n5 6\n4 5\n", output: c2Solve(10, [[3,4],[5,6],[4,5]]) + "\n" });
  cases.push({ input: "50 2\n10 20\n15 30\n", output: c2Solve(50, [[10,20],[15,30]]) + "\n" });
  for (const [seed, S, N] of [[2101,20,5],[2102,100,10],[2103,500,20],[2104,2000,50],[2105,10000,100],[2106,10000,100],[2107,10000,100],[2108,5000,80],[2109,10000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, 1000), ri(rnd, 1, 100)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: S + " " + N + "\n" + lines.join("\n") + "\n", output: c2Solve(S, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c2/cases"), cases);
}

// ================= C3 =================
{
  const cases = [];
  cases.push({ input: "10 4\n3\n4\n7\n3\n", output: c3Solve(10, [3,4,7,3]) + "\n" });
  cases.push({ input: "5 2\n2\n3\n", output: c3Solve(5, [2,3]) + "\n" }); // {2,3} 1 种
  for (const [seed, V, N] of [[2201,20,5],[2202,50,10],[2203,100,20],[2204,300,50],[2205,1000,100],[2206,1000,100],[2207,1000,100],[2208,800,80],[2209,1000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push(ri(rnd, 1, V));
    cases.push({ input: V + " " + N + "\n" + items.join("\n") + "\n", output: c3Solve(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c3/cases"), cases);
}

// ================= C4 =================
{
  const cases = [];
  cases.push({ input: "12 3\n5\n3\n7\n", output: c4Solve(12, [5,3,7]) + "\n" });
  cases.push({ input: "11 2\n4\n6\n", output: c4Solve(11, [4,6]) + "\n" }); // 无解 -> -1
  for (const [seed, V, N] of [[2301,50,5],[2302,200,10],[2303,1000,20],[2304,5000,50],[2305,10000,100],[2306,10000,100],[2307,10000,100],[2308,8000,80],[2309,10000,100]]) {
    const rnd = mulberry32(seed);
    const coins = new Set();
    while (coins.size < N) coins.add(ri(rnd, 1, Math.min(V, 2000)));
    const arr = [...coins];
    cases.push({ input: V + " " + N + "\n" + arr.join("\n") + "\n", output: c4Solve(V, arr) + "\n" });
  }
  writeCases(join(root, "data/problems/c4/cases"), cases);
}

// ================= C5 =================
{
  const cases = [];
  cases.push({ input: "24 3\n4 5\n7 9\n10 15\n", output: c5Solve(24, [[4,5],[7,9],[10,15]]) + "\n" });
  cases.push({ input: "13 2\n4 5\n6 9\n", output: c5Solve(13, [[4,5],[6,9]]) + "\n" }); // 无解 -> -1
  for (const [seed, V, N] of [[2401,50,5],[2402,200,10],[2403,1000,20],[2404,5000,50],[2405,10000,100],[2406,10000,100],[2407,10000,100],[2408,8000,80],[2409,10000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, Math.min(V, 2000)), ri(rnd, 1, 100000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: c5Solve(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c5/cases"), cases);
}
