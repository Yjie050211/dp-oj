/**
 * DP 填表演示脚本生成：把背包算法的一次次数组更新转成可逐步回放的 step 序列
 * - 01 背包：容量倒序，来源是上一行（旧值）
 * - 完全背包：容量正序，来源是当前行（已更新值）
 * - 多重背包：二进制拆分后按 01 处理
 */

export type VizModel = "01" | "full" | "multi";

export interface VizItem {
  w: number;
  v: number;
  /** 多重背包的数量（01/完全忽略） */
  m: number;
}

export interface VizBlock {
  /** 所属原始物品下标 */
  itemIdx: number;
  /** 块代表的数量（二进制拆分 1,2,4...） */
  count: number;
  w: number;
  v: number;
}

export interface VizStep {
  /** 处理中的块序号 */
  blockIdx: number;
  j: number;
  /** 转移来源格（容量 j-w） */
  from: number;
  /** 更新前的 f[j] */
  old: number;
  /** 候选值 f[j-w] + v */
  cand: number;
  /** 更新后的 f[j] */
  val: number;
  /** 本步是否真正更新了值 */
  updated: boolean;
  /** 本步之后的一维数组快照 */
  f: number[];
}

export interface VizScript {
  model: VizModel;
  V: number;
  items: VizItem[];
  /** 多重背包的拆分块（01/完全 = 每物品一块） */
  blocks: VizBlock[];
  steps: VizStep[];
  /** 每块处理完的 step 末尾索引（blocks.length 个） */
  blockEnds: number[];
  /** 最终答案 */
  answer: number;
}

/** 多重背包二进制拆分 */
function splitBlocks(items: VizItem[]): VizBlock[] {
  const blocks: VizBlock[] = [];
  items.forEach((it, i) => {
    let rem = it.m;
    let k = 1;
    while (rem > 0) {
      const take = Math.min(k, rem);
      blocks.push({ itemIdx: i, count: take, w: it.w * take, v: it.v * take });
      rem -= take;
      k <<= 1;
    }
  });
  return blocks;
}

/** 生成演示脚本 */
export function buildScript(model: VizModel, V: number, items: VizItem[]): VizScript {
  const f: number[] = new Array(V + 1).fill(0);
  const steps: VizStep[] = [];
  const blockEnds: number[] = [];

  const blocks: VizBlock[] =
    model === "multi" ? splitBlocks(items) : items.map((it, i) => ({ itemIdx: i, count: 1, w: it.w, v: it.v }));

  blocks.forEach((b, bi) => {
    if (model === "full") {
      // 完全背包：正序
      for (let j = b.w; j <= V; j++) {
        const old = f[j];
        const cand = f[j - b.w] + b.v;
        const val = Math.max(old, cand);
        f[j] = val;
        steps.push({ blockIdx: bi, j, from: j - b.w, old, cand, val, updated: val !== old, f: [...f] });
      }
    } else {
      // 01（含多重拆分块）：倒序
      for (let j = V; j >= b.w; j--) {
        const old = f[j];
        const cand = f[j - b.w] + b.v;
        const val = Math.max(old, cand);
        f[j] = val;
        steps.push({ blockIdx: bi, j, from: j - b.w, old, cand, val, updated: val !== old, f: [...f] });
      }
    }
    blockEnds.push(steps.length);
  });

  return { model, V, items, blocks, steps, blockEnds, answer: f[V] };
}

/** 预设示例 */
export const PRESETS: { model: VizModel; label: string; V: number; items: VizItem[] }[] = [
  { model: "01", label: "01 背包（倒序）", V: 10, items: [{ w: 2, v: 3, m: 1 }, { w: 3, v: 4, m: 1 }, { w: 4, v: 5, m: 1 }, { w: 7, v: 8, m: 1 }] },
  { model: "full", label: "完全背包（正序）", V: 10, items: [{ w: 2, v: 3, m: 1 }, { w: 4, v: 7, m: 1 }, { w: 5, v: 9, m: 1 }] },
  { model: "multi", label: "多重背包（二进制拆分）", V: 10, items: [{ w: 2, v: 3, m: 4 }, { w: 3, v: 4, m: 2 }, { w: 5, v: 8, m: 1 }] },
];
