// C6-C10 测试数据生成器：固定种子可复现
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

// C6 多重背包可行性（BigInt bitset）
function c6Solve(V, items) {
  const mask = (1n << BigInt(V + 1)) - 1n;
  let bits = 1n;
  for (const [c, m] of items) {
    let rem = m, k = 1;
    while (rem > 0) {
      const take = Math.min(k, rem);
      bits |= (bits << BigInt(c * take)) & mask;
      rem -= take; k <<= 1;
    }
  }
  return ((bits >> BigInt(V)) & 1n) === 1n ? 1 : 0;
}

// C7 混合背包 恰好装满
function c7Solve(V, items) {
  const NEG = -Infinity;
  const f = new Array(V + 1).fill(NEG);
  f[0] = 0;
  for (const it of items) {
    const c = it[0], w = it[1], t = it[2];
    if (t === 1) {
      for (let v = V; v >= c; v--) if (f[v - c] !== NEG && f[v - c] + w > f[v]) f[v] = f[v - c] + w;
    } else if (t === 2) {
      for (let v = c; v <= V; v++) if (f[v - c] !== NEG && f[v - c] + w > f[v]) f[v] = f[v - c] + w;
    } else {
      let rem = it[3], k = 1;
      while (rem > 0) {
        const take = Math.min(k, rem);
        const cc = c * take, ww = w * take;
        for (let v = V; v >= cc; v--) if (f[v - cc] !== NEG && f[v - cc] + ww > f[v]) f[v] = f[v - cc] + ww;
        rem -= take; k <<= 1;
      }
    }
  }
  return f[V] === NEG ? -1 : f[V];
}

// C8 二维费用 恰好装满
function c8Solve(V, U, items) {
  const NEG = -Infinity;
  const f = Array.from({ length: V + 1 }, () => new Array(U + 1).fill(NEG));
  f[0][0] = 0;
  for (const [c, d, w] of items) {
    for (let v = V; v >= c; v--) {
      for (let u = U; u >= d; u--) {
        if (f[v - c][u - d] !== NEG && f[v - c][u - d] + w > f[v][u]) f[v][u] = f[v - c][u - d] + w;
      }
    }
  }
  return f[V][U] === NEG ? -1 : f[V][U];
}

// C9 分组背包 恰好装满
function c9Solve(V, groups) {
  const NEG = -Infinity;
  const f = new Array(V + 1).fill(NEG);
  f[0] = 0;
  for (const g of groups) {
    const cur = f.slice();
    for (let v = 0; v <= V; v++) {
      if (cur[v] === NEG) continue;
      for (const [c, w] of g) {
        const nv = v + c;
        if (nv <= V && cur[v] + w > f[nv]) f[nv] = cur[v] + w;
      }
    }
  }
  return f[V] === NEG ? -1 : f[V];
}

// C10 依赖背包（附件数量不限，先主件后附件 01 线性化）
function c10Solve(N, items) {
  const NEG = -Infinity;
  const mains = [];
  const map = new Map();
  items.forEach((it, i) => {
    if (it[2] === 0) {
      map.set(i + 1, { v: it[0], val: it[0] * it[1], atts: [] });
      mains.push(map.get(i + 1));
    }
  });
  for (const it of items) {
    if (it[2] !== 0) map.get(it[2]).atts.push([it[0], it[0] * it[1]]);
  }
  const f = new Array(N + 1).fill(0);
  for (const m of mains) {
    const best = new Array(N + 1).fill(NEG);
    for (let v = N; v >= m.v; v--) {
      best[v] = f[v - m.v] + m.val;
    }
    for (const [c, val] of m.atts) {
      for (let v = N; v >= c; v--) {
        if (best[v - c] !== NEG && best[v - c] + val > best[v]) best[v] = best[v - c] + val;
      }
    }
    for (let v = 0; v <= N; v++) {
      if (best[v] !== NEG && best[v] > f[v]) f[v] = best[v];
    }
  }
  return f[N];
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

// ================= C6 ================= 多重可行性
{
  const cases = [];
  cases.push({ input: "10 3\n2 4\n3 3\n5 2\n", output: c6Solve(10, [[2, 4], [3, 3], [5, 2]]) + "\n" });
  cases.push({ input: "13 2\n4 2\n6 2\n", output: c6Solve(13, [[4, 2], [6, 2]]) + "\n" });
  for (const [seed, V, N] of [[2501, 200, 5], [2502, 2000, 10], [2503, 5000, 20], [2504, 10000, 50], [2505, 20000, 100], [2506, 20000, 100], [2507, 20000, 100], [2508, 15000, 80], [2509, 20000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, V), ri(rnd, 1, 1000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: c6Solve(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c6/cases"), cases);
}

// ================= C7 ================= 混合恰好装满
{
  const cases = [];
  cases.push({ input: "10 3\n3 5 1\n4 6 2\n5 9 3 2\n", output: c7Solve(10, [[3, 5, 1], [4, 6, 2], [5, 9, 3, 2]]) + "\n" });
  cases.push({ input: "13 2\n4 5 1\n6 9 2\n", output: c7Solve(13, [[4, 5, 1], [6, 9, 2]]) + "\n" });
  for (const [seed, V, N] of [[2601, 50, 5], [2602, 200, 10], [2603, 500, 20], [2604, 1000, 50], [2605, 1000, 100], [2606, 1000, 100], [2607, 1000, 100], [2608, 800, 80], [2609, 1000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) {
      const t = ri(rnd, 1, 3);
      const it = [ri(rnd, 1, Math.min(V, 100)), ri(rnd, 1, 1000), t];
      if (t === 3) it.push(ri(rnd, 1, 100));
      items.push(it);
    }
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + "\n" + lines.join("\n") + "\n", output: c7Solve(V, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c7/cases"), cases);
}

// ================= C8 ================= 二维费用恰好装满
{
  const cases = [];
  cases.push({ input: "10 8 3\n3 2 5\n4 3 7\n6 5 10\n", output: c8Solve(10, 8, [[3, 2, 5], [4, 3, 7], [6, 5, 10]]) + "\n" });
  cases.push({ input: "8 6 2\n4 3 5\n5 4 8\n", output: c8Solve(8, 6, [[4, 3, 5], [5, 4, 8]]) + "\n" });
  for (const [seed, V, U, N] of [[2701, 20, 20, 5], [2702, 50, 50, 10], [2703, 100, 100, 20], [2704, 200, 200, 50], [2705, 200, 200, 100], [2706, 200, 200, 100], [2707, 200, 200, 100], [2708, 150, 150, 80], [2709, 200, 200, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, V), ri(rnd, 1, U), ri(rnd, 1, 1000)]);
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + U + " " + N + "\n" + lines.join("\n") + "\n", output: c8Solve(V, U, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c8/cases"), cases);
}

// ================= C9 ================= 分组恰好装满
{
  const cases = [];
  cases.push({ input: "10 6 3\n2 5 1\n3 6 1\n4 7 2\n5 8 2\n1 2 3\n6 9 3\n", output: c9Solve(10, [[[2, 5], [3, 6]], [[4, 7], [5, 8]], [[1, 2], [6, 9]]]) + "\n" });
  for (const [seed, V, N, K] of [[2801, 20, 10, 3], [2802, 100, 20, 5], [2803, 300, 50, 10], [2804, 1000, 200, 20], [2805, 1000, 1000, 100], [2806, 1000, 1000, 100], [2807, 1000, 1000, 100], [2808, 800, 800, 80], [2809, 1000, 1000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    for (let i = 0; i < N; i++) items.push([ri(rnd, 1, Math.min(V, 50)), ri(rnd, 1, 100), ri(rnd, 1, K)]);
    const groups = Array.from({ length: K }, () => []);
    items.forEach((it) => groups[it[2] - 1].push([it[0], it[1]]));
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: V + " " + N + " " + K + "\n" + lines.join("\n") + "\n", output: c9Solve(V, groups) + "\n" });
  }
  writeCases(join(root, "data/problems/c9/cases"), cases);
}

// ================= C10 ================= 依赖背包（附件不限）
{
  const cases = [];
  cases.push({ input: "1000 5\n800 2 0\n400 5 1\n300 5 1\n400 3 0\n500 2 0\n", output: c10Solve(1000, [[800, 2, 0], [400, 5, 1], [300, 5, 1], [400, 3, 0], [500, 2, 0]]) + "\n" });
  for (const [seed, Ncap, M] of [[2901, 1000, 10], [2902, 10000, 20], [2903, 20000, 30], [2904, 50000, 50], [2905, 50000, 100], [2906, 50000, 100], [2907, 50000, 100], [2908, 30000, 80], [2909, 50000, 100]]) {
    const rnd = mulberry32(seed);
    const items = [];
    let mainCount = 0;
    const mainLines = [];
    for (let i = 0; i < M; i++) {
      const isMain = mainCount === 0 || rnd() < 0.35;
      if (isMain) { mainCount++; items.push([ri(rnd, 1, 10000), ri(rnd, 1, 5), 0]); mainLines.push(i + 1); }
      else items.push([ri(rnd, 1, 10000), ri(rnd, 1, 5), mainLines[ri(rnd, 0, mainLines.length - 1)]]);
    }
    const lines = items.map((it) => it.join(" "));
    cases.push({ input: Ncap + " " + M + "\n" + lines.join("\n") + "\n", output: c10Solve(Ncap, items) + "\n" });
  }
  writeCases(join(root, "data/problems/c10/cases"), cases);
}
