// A3-A6 测试数据生成器：固定种子可复现，答案由参考 DP 解生成
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

// ---------- 参考解 ----------
function knapsack01(V, items) {
  const f = new Array(V + 1).fill(0);
  for (const [c, w] of items) for (let v = V; v >= c; v--) if (f[v - c] + w > f[v]) f[v] = f[v - c] + w;
  return f[V];
}
function knapsackMultipleBinary(V, items) {
  // items: [c, w, m]
  const parts = [];
  for (const [c, w, m] of items) {
    let k = 1, left = m;
    while (k < left) { parts.push([c * k, w * k]); left -= k; k *= 2; }
    if (left > 0) parts.push([c * left, w * left]);
  }
  return knapsack01(V, parts);
}
function knapsackMixed(V, items) {
  // items: {c, w, type, m}
  const f = new Array(V + 1).fill(0);
  for (const it of items) {
    if (it.type === 1) {
      for (let v = V; v >= it.c; v--) if (f[v - it.c] + it.w > f[v]) f[v] = f[v - it.c] + it.w;
    } else if (it.type === 2) {
      for (let v = it.c; v <= V; v++) if (f[v - it.c] + it.w > f[v]) f[v] = f[v - it.c] + it.w;
    } else {
      // 多重：二进制拆分后 01
      let k = 1, left = it.m;
      while (k < left) {
        const cc = it.c * k, ww = it.w * k;
        for (let v = V; v >= cc; v--) if (f[v - cc] + ww > f[v]) f[v] = f[v - cc] + ww;
        left -= k; k *= 2;
      }
      if (left > 0) {
        const cc = it.c * left, ww = it.w * left;
        for (let v = V; v >= cc; v--) if (f[v - cc] + ww > f[v]) f[v] = f[v - cc] + ww;
      }
    }
  }
  return f[V];
}
function knapsack2D(V, U, items) {
  const f = Array.from({ length: V + 1 }, () => new Array(U + 1).fill(0));
  for (const [c, d, w] of items) {
    for (let v = V; v >= c; v--) for (let u = U; u >= d; u--) {
      if (f[v - c][u - d] + w > f[v][u]) f[v][u] = f[v - c][u - d] + w;
    }
  }
  return f[V][U];
}
function knapsackGrouped(V, groups) {
  const f = new Array(V + 1).fill(0);
  for (const g of groups) {
    for (let v = V; v >= 0; v--) {
      for (const [c, w] of g) {
        if (v >= c && f[v - c] + w > f[v]) f[v] = f[v - c] + w;
      }
    }
  }
  return f[V];
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

// ================= A3 宝物筛选（多重背包）=================
{
  const cases = [];
  cases.push({ input: "10 3\n2 3 2\n3 4 3\n5 7 1\n", output: knapsackMultipleBinary(10, [[2,3,2],[3,4,3],[5,7,1]]) + "\n" });
  cases.push({ input: "50 1\n30 99 1\n", output: knapsackMultipleBinary(50, [[30,99,1]]) + "\n" });
  cases.push({ input: "100 1\n25 40 10\n", output: knapsackMultipleBinary(100, [[25,40,10]]) + "\n" });
  { const items = [[120,5,3],[130,6,2],[110,7,1]]; cases.push({ input: "100 3\n" + items.map(i=>i.join(" ")).join("\n") + "\n", output: "0\n" }); }
  for (const [seed, V, N] of [[201,20,5],[202,100,10],[203,1000,20],[204,10000,50],[205,20000,100],[206,40000,100],[207,40000,100],[208,40000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd,1,Math.min(V,1000)), ri(rnd,1,400), ri(rnd,1,100)]);
    const input = V + " " + N + "\n" + items.map(i=>i.join(" ")).join("\n") + "\n";
    cases.push({ input, output: knapsackMultipleBinary(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/a3/cases"), cases);
}

// ================= A4 樱花（混合背包）=================
{
  const cases = [];
  const fixed = [{c:3,w:5,type:1,m:1},{c:4,w:6,type:2,m:0},{c:5,w:9,type:3,m:2},{c:2,w:3,type:1,m:1}];
  cases.push({ input: "10 4\n3 5 1\n4 6 2\n5 9 3 2\n2 3 1\n", output: knapsackMixed(10, fixed) + "\n" });
  for (const [seed, V, N] of [[301,100,10],[302,200,20],[303,500,50],[304,1000,100],[305,1000,100],[306,1000,100],[307,800,80],[308,500,30],[309,1000,100],[310,300,15],[311,1000,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) {
      const type = ri(rnd,1,3);
      const m = type === 3 ? ri(rnd,1,100) : 0;
      items.push({ c: ri(rnd,1,Math.min(V,100)), w: ri(rnd,1,1000), type, m });
    }
    const lines = items.map((it) => it.type === 3 ? [it.c,it.w,3,it.m].join(" ") : [it.c,it.w,it.type].join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: knapsackMixed(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/a4/cases"), cases);
}

// ================= A5 勤工俭学（二维费用）=================
{
  const cases = [];
  const fixed5 = [[3,2,5],[4,3,7],[2,1,3],[6,5,10]];
  cases.push({ input: "10 8 4\n" + fixed5.map(i=>i.join(" ")).join("\n") + "\n", output: knapsack2D(10, 8, fixed5) + "\n" });
  cases.push({ input: "50 50 1\n30 20 99\n", output: knapsack2D(50,50,[[30,20,99]]) + "\n" });
  cases.push({ input: "50 50 1\n51 20 99\n", output: knapsack2D(50,50,[[51,20,99]]) + "\n" });
  for (const [seed, V, U, N] of [[401,10,10,5],[402,30,30,10],[403,50,50,20],[404,100,100,50],[405,200,200,100],[406,200,200,100],[407,200,200,100],[408,150,120,80],[409,200,200,100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd,1,V), ri(rnd,1,U), ri(rnd,1,1000)]);
    const input = V + " " + U + " " + N + "\n" + items.map(i=>i.join(" ")).join("\n") + "\n";
    cases.push({ input, output: knapsack2D(V, U, items) + "\n" });
  }
  writeCases(join(root, "data/problems/a5/cases"), cases);
}

// ================= A6 通天之分组背包 =================
{
  const cases = [];
  const fixed6 = [[2,5,1],[3,6,1],[4,7,2],[5,8,2],[1,2,3],[6,9,3]];
  {
    const groups = [[[2,5],[3,6]],[[4,7],[5,8]],[[1,2],[6,9]]];
    cases.push({ input: "10 6 3\n" + fixed6.map(i=>i.join(" ")).join("\n") + "\n", output: knapsackGrouped(10, groups) + "\n" });
  }
  for (const [seed, V, N, K] of [[501,20,10,3],[502,50,20,5],[503,100,50,10],[504,300,200,20],[505,500,500,50],[506,1000,1000,100],[507,1000,1000,100],[508,1000,1000,100],[509,800,800,60],[510,1000,1000,100],[511,600,400,30]]) {
    const rnd = mulberry32(seed);
    const groups = Array.from({ length: K }, () => []);
    const rows = [];
    for (let i = 0; i < N; i++) {
      const g = ri(rnd,1,K);
      const c = ri(rnd,1,V), w = ri(rnd,1,100);
      groups[g-1].push([c,w]);
      rows.push([c,w,g]);
    }
    const input = V + " " + N + " " + K + "\n" + rows.map(r=>r.join(" ")).join("\n") + "\n";
    cases.push({ input, output: knapsackGrouped(V, groups) + "\n" });
  }
  writeCases(join(root, "data/problems/a6/cases"), cases);
}
