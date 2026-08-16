import { VERDICT_CLASS, type JudgeResult } from "../types";

interface Props {
  verdict: string;
  result: JudgeResult;
}

/** 判题结果展示（提交面板与提交记录页共用）：verdict 徽章 + CE/SE 全文 + 逐组明细 + WA 对比 + RE stderr */
export default function SubmissionResultView({ verdict, result }: Props) {
  return (
    <div className="result-panel">
      <div className="result-head">
        <span className={"verdict " + (VERDICT_CLASS[verdict] ?? "v-se")}>{verdict}</span>
        <span className="result-meta">
          {result.totalTimeMs != null && <>总耗时 {result.totalTimeMs} ms</>}
          {verdict === "AC" && <> · {result.cases.length} 组全部通过</>}
          {verdict !== "AC" && result.cases.length > 0 && <> · 止步于第 {result.cases[result.cases.length - 1].groupNo} 组</>}
        </span>
      </div>

      {verdict === "CE" && result.compileOutput && (
        <div className="compile-output">
          <div className="result-label">编译器输出</div>
          <pre>{result.compileOutput}</pre>
        </div>
      )}

      {verdict === "SE" && result.error && (
        <div className="compile-output">
          <div className="result-label">系统错误</div>
          <pre>{result.error}</pre>
        </div>
      )}

      {result.cases.length > 0 && (
        <table className="case-table">
          <thead>
            <tr>
              <th>测试组</th>
              <th>结果</th>
              <th>耗时</th>
            </tr>
          </thead>
          <tbody>
            {result.cases.map((c) => (
              <tr key={c.groupNo} className={c.verdict !== "AC" ? "row-fail" : ""}>
                <td>#{c.groupNo}</td>
                <td>
                  <span className={"verdict small " + (VERDICT_CLASS[c.verdict] ?? "v-se")}>{c.verdict}</span>
                </td>
                <td>{c.timeMs} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {verdict === "WA" &&
        result.cases.some((c) => c.actualOutput !== null) &&
        (() => {
          const failed = result.cases.find((c) => c.actualOutput !== null)!;
          return (
            <div className="wa-compare">
              <div className="wa-col">
                <div className="result-label">你的输出</div>
                <pre>{failed.actualOutput}</pre>
              </div>
              <div className="wa-col">
                <div className="result-label">期望输出</div>
                <pre>{failed.expectedOutput}</pre>
              </div>
            </div>
          );
        })()}

      {verdict === "RE" &&
        result.cases.some((c) => c.stderr !== null) &&
        (() => {
          const failed = result.cases.find((c) => c.stderr !== null)!;
          return (
            <div className="compile-output">
              <div className="result-label">运行时错误（stderr）</div>
              <pre>{failed.stderr}</pre>
            </div>
          );
        })()}
    </div>
  );
}
