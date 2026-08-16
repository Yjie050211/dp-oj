// A1/A2 测试数据生成器：固定种子可复现，答案由参考 DP 解生成
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// mulberry32 伪随机（固定种子可复现）
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 01 背包参考解（一维逆序）
function knapsack01(V, items) {
  const f = new Array(V + 1).fill(0);
  for (const [c, w] of items) {
    for (let v = V; v >= c; v--) {
      const val = f[v - c] + w;
      if (val > f[v]) f[v] = val;
    }
  }
  return f[V];
}

// 完全背包参考解（一维顺序）
function knapsackComplete(V, items) {
  const f = new Array(V + 1).fill(0);
  for (const [c, w] of items) {
    for (let v = c; v <= V; v++) {
      const val = f[v - c] + w;
      if (val > f[v]) f[v] = val;
    }
  }
  return f[V];
}

function makeCase({ seed, V, N, cMin, cMax, wMin, wMax, special }) {
  const rnd = mulberry32(seed);
  const items = [];
  if (special === "all-over") {
    // 全部装不下：Ci > V
    for (let i = 0; i < N; i++) {
      items.push([V + 1 + Math.floor(rnd() * 50), 1 + Math.floor(rnd() * (wMax - 1))]);
    }
  } else if (special === "dense") {
    // 小费用密集：卡逆序/顺序方向
    for (let i = 0; i < N; i++) {
      items.push([cMin + Math.floor(rnd() * Math.min(10, cMax - cMin + 1)), wMin + Math.floor(rnd() * (wMax - wMin + 1))]);
    }
  } else if (special === "with-junk") {
    // 含 1 费垃圾物品 + 大件，测试完全背包枚举正确性
    items.push([1, 1]);
    for (let i = 1; i < N; i++) {
      items.push([cMin + Math.floor(rnd() * (cMax - cMin + 1)), wMin + Math.floor(rnd() * (wMax - wMin + 1))]);
    }
  } else {
    for (let i = 0; i < N; i++) {
      items.push([cMin + Math.floor(rnd() * (cMax - cMin + 1)), wMin + Math.floor(rnd() * (wMax - wMin + 1))]);
    }
  }
  const ans = special === undefined ? null : null; // unused
  return { V, items, ans };
}

function renderCase(V, items, ans) {
  const lines = [V + " " + items.length];
  for (const [c, w] of items) lines.push(c + " " + w);
  return lines.join("\n") + "\n";
}

function writeCases(dir, cases, solver) {
  mkdirSync(dir, { recursive: true });
  cases.forEach((c, idx) => {
    const no = String(idx + 1).padStart(2, "0");
    const ans = solver(c.V, c.items);
    writeFileSync(join(dir, no + ".in"), renderCase(c.V, c.items, ans), "utf8");
    writeFileSync(join(dir, no + ".out"), String(ans) + "\n", "utf8");
  });
  console.log(dir + " : " + cases.length + " 组生成完成");
}

const root = new URL("../../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

// ---------- A1 采药（01 背包）----------
const a1Fixed = { V: 70, items: [[71, 100], [69, 1], [1, 2]] };
const a1Cases = [
  a1Fixed, // 01 样例组
  { V: 50, items: [[30, 99]] }, // 02 单物品可装
  { V: 50, items: [[51, 99]] }, // 03 单物品装不下
  makeCase({ seed: 101, V: 100, N: 10, cMin: 101, cMax: 150, wMin: 1, wMax: 100, special: "all-over" }), // 04 全部装不下
  makeCase({ seed: 202, V: 10, N: 5, cMin: 1, cMax: 10, wMin: 1, wMax: 20 }), // 05
  makeCase({ seed: 303, V: 30, N: 10, cMin: 1, cMax: 30, wMin: 1, wMax: 50 }), // 06
  makeCase({ seed: 404, V: 100, N: 20, cMin: 1, cMax: 100, wMin: 1, wMax: 500 }), // 07
  makeCase({ seed: 505, V: 300, N: 50, cMin: 1, cMax: 300, wMin: 1, wMax: 2000 }), // 08
  makeCase({ seed: 606, V: 500, N: 100, cMin: 1, cMax: 500, wMin: 1, wMax: 5000 }), // 09
  makeCase({ seed: 707, V: 1000, N: 100, cMin: 1, cMax: 1000, wMin: 1, wMax: 10000 }), // 10 满规模
  makeCase({ seed: 808, V: 1000, N: 100, cMin: 1, cMax: 1000, wMin: 1, wMax: 10000 }), // 11 满规模(不同种子)
  makeCase({ seed: 909, V: 1000, N: 100, cMin: 1, cMax: 10, wMin: 1, wMax: 10000, special: "dense" }), // 12 小费用密集
];
writeCases(join(root, "data/problems/a1/cases"), a1Cases, knapsack01);

// ---------- A2 疯狂的采药（完全背包）----------
const a2Fixed = { V: 24, items: [[4, 5], [7, 9], [10, 15]] };
const a2Cases = [
  a2Fixed, // 01 样例组
  { V: 100, items: [[25, 40]] }, // 02 单种无限
  { V: 100, items: [[101, 40]] }, // 03 单种装不下
  makeCase({ seed: 111, V: 20, N: 3, cMin: 1, cMax: 20, wMin: 1, wMax: 50 }), // 04
  makeCase({ seed: 222, V: 100, N: 5, cMin: 1, cMax: 100, wMin: 1, wMax: 200 }), // 05
  makeCase({ seed: 333, V: 1000, N: 10, cMin: 1, cMax: 1000, wMin: 1, wMax: 5000 }), // 06
  makeCase({ seed: 444, V: 5000, N: 50, cMin: 1, cMax: 5000, wMin: 1, wMax: 20000 }), // 07
  makeCase({ seed: 555, V: 20000, N: 100, cMin: 1, cMax: 10000, wMin: 1, wMax: 100000 }), // 08
  makeCase({ seed: 666, V: 50000, N: 100, cMin: 1, cMax: 10000, wMin: 1, wMax: 100000 }), // 09 满规模
  makeCase({ seed: 777, V: 50000, N: 100, cMin: 1, cMax: 10000, wMin: 1, wMax: 100000 }), // 10 满规模(不同种子)
  makeCase({ seed: 888, V: 50000, N: 100, cMin: 2, cMax: 10000, wMin: 1, wMax: 100000, special: "with-junk" }), // 11 含垃圾物品
  makeCase({ seed: 999, V: 50000, N: 100, cMin: 8000, cMax: 10000, wMin: 1, wMax: 100000 }), // 12 大费用
];
writeCases(join(root, "data/problems/a2/cases"), a2Cases, knapsackComplete);

// 校验样例组答案
console.log("A1 sample answer =", knapsack01(a1Fixed.V, a1Fixed.items));
console.log("A2 sample answer =", knapsackComplete(a2Fixed.V, a2Fixed.items));
