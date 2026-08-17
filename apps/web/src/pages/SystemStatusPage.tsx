import { useEffect, useState } from "react";

interface EngineStatus {
  id: string;
  label: string;
  available: boolean;
  version: string | null;
  error: string | null;
}

interface SystemHealth {
  status: "ok" | "degraded";
  checkedAt: string;
  engines: EngineStatus[];
  docker: { available: boolean; version: string | null; error: string | null };
}

const LANG_ICONS: Record<string, string> = {
  cpp: "C++",
  python: "Py",
  go: "Go",
  java: "Jv",
};

export default function SystemStatusPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/system/health");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as SystemHealth;
        if (!data || !Array.isArray(data.engines)) throw new Error("响应格式异常");
        if (alive) {
          setHealth(data);
          setError(null);
        }
      } catch (e) {
        if (alive) setError(String(e));
      }
    };
    load();
    const timer = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <h1>判题机环境自检</h1>
      </header>

      {error && <div className="banner error">无法连接后端（http://localhost:3000）：{error}</div>}

      {health && (
        <section className="card">
          <div className="card-head">
            <span className={health.status === "ok" ? "pill ok" : "pill warn"}>
              {health.status === "ok" ? "全部就绪" : "部分缺失"}
            </span>
            <span className="time">检测时间 {new Date(health.checkedAt).toLocaleString()}</span>
          </div>

          <div className="grid">
            {health.engines.map((e) => (
              <div key={e.id} className={e.available ? "engine on" : "engine off"}>
                <div className="engine-badge">{LANG_ICONS[e.id] ?? e.id}</div>
                <div className="engine-info">
                  <div className="engine-label">{e.label}</div>
                  <div className="engine-version" title={e.version ?? e.error ?? ""}>
                    {e.available ? e.version : "未检测到工具链"}
                  </div>
                </div>
                <span className={e.available ? "dot on" : "dot off"} />
              </div>
            ))}

            <div className={health.docker.available ? "engine on" : "engine off"}>
              <div className="engine-badge">Dk</div>
              <div className="engine-info">
                <div className="engine-label">Docker（可选沙箱）</div>
                <div className="engine-version" title={health.docker.version ?? health.docker.error ?? ""}>
                  {health.docker.available ? health.docker.version : "未检测到"}
                </div>
              </div>
              <span className={health.docker.available ? "dot on" : "dot off"} />
            </div>
          </div>
        </section>
      )}

      {!health && !error && <div className="banner">正在自检判题环境…</div>}
    </div>
  );
}
