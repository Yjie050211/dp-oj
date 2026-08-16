import { Link, Route, Routes } from "react-router-dom";
import ProblemListPage from "./pages/ProblemListPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import SubmissionsPage from "./pages/SubmissionsPage";
import SystemStatusPage from "./pages/SystemStatusPage";

export default function App() {
  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand">
            DP 背包 OJ
          </Link>
          <div className="nav-links">
            <Link to="/">题目</Link>
            <Link to="/submissions">提交记录</Link>
            <Link to="/system">系统状态</Link>
          </div>
        </div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<ProblemListPage />} />
          <Route path="/problems/:slug" element={<ProblemDetailPage />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/system" element={<SystemStatusPage />} />
        </Routes>
      </main>
    </div>
  );
}
