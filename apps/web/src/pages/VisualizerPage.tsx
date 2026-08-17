import { useEffect, useMemo, useRef, useState } from "react";
import { buildScript, PRESETS, type VizItem, type VizModel, type VizScript } from "../visualizer/buildSteps";

const MODELS: { id: VizModel; label: string }[] = [
  { id: "01", label: "01 背包" },
  { id: "full", label: "完全背包" },
  { id: "multi", label: "多重背包" },
];

/** 填表速度档位（ms） */
const SPEEDS = [350, 700, 1400];

/** 当前块的行标签（多重显示拆分信息） */
function blockLabel(script: VizScript, bi: number): string {
  const b = script.blocks[bi];
  if (script.model === "multi") {
    return "物品" + (b.itemIdx + 1) + " · " + b.count + "件块";
  }
  return "物品" + (b.itemIdx + 1);
}

export default function VisualizerPage() {
  const [model, setModel] = useState<VizModel>("01");
  const [V, setV] = useState(10);
  const [items, setItems] = useState<VizItem[]>(PRESETS[0].items);

  const script = useMemo(() => buildScript(model, V, items), [model, V, items]);

  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [view, setView] = useState<"flat" | "grid">("flat");
  const playTimer = useRef<number | null>(null);

  // 输入/模型变化时重置播放
  useEffect(() => {
    setStepIdx(0);
    setPlaying(false);
  }, [script]);

  // 自动播放
  useEffect(() => {
    if (!playing) return;
    playTimer.current = window.setInterval(() => {
      setStepIdx((s) => {
        if (s >= script.steps.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, SPEEDS[speedIdx]);
    return () => {
      if (playTimer.current !== null) window.clearInterval(playTimer.current);
    };
  }, [playing, speedIdx, script]);

  const step = stepIdx < script.steps.length ? script.steps[stepIdx] : null;
  const curBlock = step ? script.blocks[step.blockIdx] : null;

  // 当前一维快照（step 0 之前 = 初始全 0）
  const flat = step ? step.f : new Array(script.V + 1).fill(0);

  // 已完成的块行（二维表用）：第 i 块完成后的快照
  const doneRows: number[][] = [new Array(script.V + 1).fill(0)];
  script.blocks.forEach((_, i) => {
    const end = script.blockEnds[i] - 1;
    if (end >= 0 && end < stepIdx) {
      doneRows.push(script.steps[end].f);
    } else {
      doneRows.push(null as unknown as number[]);
    }
  });

  const updateItem = (i: number, key: "w" | "v" | "m", value: number) => {
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, [key]: Math.max(1, Math.min(key === "v" ? 100 : key === "m" ? 20 : 40, Math.floor(value) || 1)) } : it)));
  };

  const addItem = () => setItems((cur) => [...cur, { w: 1, v: 1, m: 1 }]);
  const removeItem = (i: number) => setItems((cur) => (cur.length > 1 ? cur.filter((_, idx) => idx !== i) : cur));

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setModel(p.model);
    setV(p.V);
    setItems(p.items.map((it) => ({ ...it })));
  };

  // 当前进行中块内的已完成 step 数
  const curBlockStart = step ? (step.blockIdx === 0 ? 0 : script.blockEnds[step.blockIdx - 1]) : 0;
  const stepsInBlock = step ? stepIdx - curBlockStart + 1 : 0;

  return (
    <div className="page">
      <header className="page-head">
        <h1>DP 填表可视化</h1>
        <p className="subtitle">逐步回放背包算法如何填 dp 表：高亮当前格与转移来源，看懂 01 倒序 / 完全正序 / 多重拆分</p>
      </header>

      {/* 模型与预设 */}
      <div className="viz-models">
        {MODELS.map((m) => (
          <button key={m.id} type="button" className={"viz-model-btn" + (model === m.id ? " active" : "")} onClick={() => setModel(m.id)}>
            {m.label}
          </button>
        ))}
        <span className="viz-presets-label">示例：</span>
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="btn ghost small" onClick={() => applyPreset(p)}>
            {p.label}
          </button>
        ))}
      </div>

      {/* 输入面板 */}
      <section className="card viz-input">
        <label className="viz-field">
          容量 V
          <input type="number" min={1} max={40} value={V} onChange={(e) => setV(Math.max(1, Math.min(40, Math.floor(Number(e.target.value)) || 1)))} />
        </label>
        <div className="viz-items">
          {items.map((it, i) => (
            <div key={i} className="viz-item-row">
              <span className="viz-item-no">物品 {i + 1}</span>
              <label>重量 <input type="number" min={1} max={40} value={it.w} onChange={(e) => updateItem(i, "w", Number(e.target.value))} /></label>
              <label>价值 <input type="number" min={1} max={100} value={it.v} onChange={(e) => updateItem(i, "v", Number(e.target.value))} /></label>
              {model === "multi" && <label>数量 <input type="number" min={1} max={20} value={it.m} onChange={(e) => updateItem(i, "m", Number(e.target.value))} /></label>}
              <button type="button" className="btn danger small" onClick={() => removeItem(i)}>删</button>
            </div>
          ))}
        </div>
        <button type="button" className="btn ghost small" onClick={addItem}>+ 添加物品</button>
      </section>

      {/* 演示区 */}
      <section className="card viz-stage">
        {/* 当前步说明 */}
        <div className="viz-status">
          {step && curBlock ? (
            <>
              <span className="viz-chip">处理：{blockLabel(script, step.blockIdx)}（w={curBlock.w} v={curBlock.v}）</span>
              <span className="viz-chip src">来源 f[{step.from}] = {flat[step.from] ?? 0}</span>
              <span className="viz-formula">f[{step.j}] = max({step.old}, {step.from >= 0 ? flat[step.from] : 0} + {curBlock.v}) = {step.val}</span>
              <span className={"viz-verdict" + (step.updated ? " updated" : "")}>{step.updated ? "✓ 更新" : "不更新"}</span>
            </>
          ) : (
            <span className="viz-chip">点击「下一步」开始填表（最终答案 {script.answer}）</span>
          )}
        </div>

        {/* 视图切换 */}
        <div className="viz-view-switch">
          <button type="button" className={"btn ghost small" + (view === "flat" ? " active" : "")} onClick={() => setView("flat")}>一维数组</button>
          <button type="button" className={"btn ghost small" + (view === "grid" ? " active" : "")} onClick={() => setView("grid")}>二维表格</button>
        </div>

        {/* 一维视图 */}
        {view === "flat" && (
          <div className="viz-flat">
            <div className="viz-flat-label">f[容量]（当前值）</div>
            <div className="viz-flat-cells">
              {flat.map((val, j) => {
                const isCur = step !== null && step.j === j;
                const isFrom = step !== null && step.from === j;
                const justUpdated = step !== null && step.j === j && step.updated;
                return (
                  <div key={j} className={"viz-cell" + (isCur ? " cur" : "") + (isFrom ? " from" : "") + (justUpdated ? " updated" : "")}>
                    <div className="viz-cell-j">{j}</div>
                    <div className="viz-cell-val">{val}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 二维视图 */}
        {view === "grid" && (
          <div className="viz-grid-wrap">
            <table className="viz-grid">
              <thead>
                <tr>
                  <th className="viz-grid-item">物品 / 容量</th>
                  {flat.map((_, j) => (<th key={j}>{j}</th>))}
                </tr>
              </thead>
              <tbody>
                {/* 初始行 */}
                <tr>
                  <td className="viz-grid-item">初始</td>
                  {doneRows[0].map((val, j) => (<td key={j} className="viz-grid-cell base">{val}</td>))}
                </tr>
                {script.blocks.map((b, bi) => {
                  const isCurBlock = step !== null && step.blockIdx === bi;
                  const isDoneBlock = doneRows[bi + 1] !== null;
                  const rowVals = isCurBlock ? flat : isDoneBlock ? doneRows[bi + 1] : null;
                  return (
                    <tr key={bi} className={isCurBlock ? "row-active" : ""}>
                      <td className="viz-grid-item">{blockLabel(script, bi)}</td>
                      {rowVals === null ? (
                        <td colSpan={script.V + 1} className="viz-grid-pending">…待处理</td>
                      ) : (
                        (rowVals as number[]).map((val, j) => {
                          const isCur = isCurBlock && step !== null && step.j === j;
                          const isFrom = isCurBlock && step !== null && step.from === j;
                          return (
                            <td key={j} className={"viz-grid-cell" + (isCur ? " cur" : "") + (isFrom ? " from" : "") + (isCurBlock && step !== null && step.updated && step.j === j ? " updated" : "")}>{val}</td>
                          );
                        })
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 控制条 */}
        <div className="viz-controls">
          <button type="button" className="btn ghost" onClick={() => { setStepIdx(0); setPlaying(false); }}>⏮ 重置</button>
          <button type="button" className="btn ghost" disabled={stepIdx === 0} onClick={() => { setPlaying(false); setStepIdx((s) => Math.max(0, s - 1)); }}>◀ 上一步</button>
          <button type="button" className="btn primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? "⏸ 暂停" : "▶ 自动播放"}
          </button>
          <button type="button" className="btn ghost" disabled={stepIdx >= script.steps.length - 1} onClick={() => { setPlaying(false); setStepIdx((s) => Math.min(script.steps.length - 1, s + 1)); }}>下一步 ▶</button>
          <button type="button" className="btn ghost" onClick={() => { setPlaying(false); setStepIdx(script.steps.length - 1); }}>⏭ 到结尾</button>
          <label className="viz-speed">速度
            <select value={speedIdx} onChange={(e) => setSpeedIdx(Number(e.target.value))}>
              <option value={0}>快</option>
              <option value={1}>中</option>
              <option value={2}>慢</option>
            </select>
          </label>
        </div>
        <input className="viz-slider" type="range" min={0} max={Math.max(0, script.steps.length - 1)} value={stepIdx} onChange={(e) => { setPlaying(false); setStepIdx(Number(e.target.value)); }} />
        <div className="viz-progress-text">第 {stepIdx} / {script.steps.length} 步 · 本块已填 {stepsInBlock} 格 · 最终答案 f[{script.V}] = {script.answer}</div>
      </section>

      <section className="card">
        <h2>怎么读这张表</h2>
        <ul className="viz-legend">
          <li><span className="viz-cell cur mini" /> 当前正在更新的格子（f[j]）</li>
          <li><span className="viz-cell from mini" /> 转移来源（f[j-w]）：01 看上一行旧值，完全看本行新值</li>
          <li><span className="viz-cell updated mini" /> 本步数值变大（候选值更优）</li>
          <li>01 背包倒序 → 每件物品只用一次；完全背包正序 → 同一物品可反复取；多重背包先按 1,2,4… 拆块再倒序</li>
        </ul>
      </section>
    </div>
  );
}
