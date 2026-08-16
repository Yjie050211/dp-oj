import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SubmissionResultView from "../components/SubmissionResultView";
import { VERDICT_CLASS, type SubmissionDetail } from "../types";

interface SubmissionSummary {
  id: number;
  problemSlug: string;
  problemDisplayId: string;
  problemTitle: string;
  languageId: string;
  status: string;
  verdict: string | null;
  createdAt: string;
}

const LANG_LABELS: Record<string, string> = {
  cpp: "C++14",
  python: "Python 3",
  go: "Go",
  java: "Java",
};

export default function SubmissionsPage() {
  const [items, setItems] = useState<SubmissionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/submissions")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data: SubmissionSummary[]) => {
        setItems(data);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const toggle = (id: number) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setLoadingDetail(true);
    fetch("/api/submissions/" + id)
      .then((r) => r.json())
      .then((d: SubmissionDetail) => {
        setDetail(d);
        setLoadingDetail(false);
      })
      .catch(() => setLoadingDetail(false));
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>提交记录</h1>
        <p className="subtitle">最近 50 条提交 · 点击行查看判题详情</p>
      </header>

      {error && <div className="banner error">加载失败：{error}</div>}

      {items && (
        <div className="sub-list">
          {items.length === 0 && <div className="banner">还没有提交记录，去<a href="/">题目列表</a>练一道吧。</div>}
          {items.map((s) => (
            <div key={s.id} className="sub-item">
              <button className="sub-row" onClick={() => toggle(s.id)}>
                <span className="sub-id">#{s.id}</span>
                <span className="sub-problem">
                  <Link
                    to={"/problems/" + s.problemSlug}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.problemDisplayId} {s.problemTitle}
                  </Link>
                </span>
                <span className="sub-lang">{LANG_LABELS[s.languageId] ?? s.languageId}</span>
                <span className="sub-time">{new Date(s.createdAt + "Z").toLocaleString()}</span>
                {s.verdict ? (
                  <span className={"verdict small " + (VERDICT_CLASS[s.verdict] ?? "v-se")}>{s.verdict}</span>
                ) : (
                  <span className="verdict small v-se">{s.status}</span>
                )}
              </button>
              {openId === s.id && (
                <div className="sub-detail">
                  {loadingDetail && <div className="banner">加载详情中…</div>}
                  {detail && detail.verdict && detail.result && (
                    <SubmissionResultView verdict={detail.verdict} result={detail.result} />
                  )}
                  {detail && !detail.verdict && <div className="banner">判题进行中…</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!items && !error && <div className="banner">加载提交记录中…</div>}
    </div>
  );
}
