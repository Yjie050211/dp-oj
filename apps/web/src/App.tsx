import { Link, Route, Routes } from "react-router-dom";
import SettingsPanel from "./components/SettingsPanel";
import ThemeSwitcher from "./components/ThemeSwitcher";
import ProblemListPage from "./pages/ProblemListPage";
import ProblemDetailPage from "./pages/ProblemDetailPage";
import ReviewPage from "./pages/ReviewPage";
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
            <Link to="/review">复习计划</Link>
            <Link to="/submissions">提交记录</Link>
            <Link to="/system">系统状态</Link>
          </div>
          <ThemeSwitcher />
          <SettingsPanel />
        </div>
      </nav>
      <main className="content">
        <Routes>
          <Route path="/" element={<ProblemListPage />} />
          <Route path="/problems/:slug" element={<ProblemDetailPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/system" element={<SystemStatusPage />} />
          <Route
            path="*"
            element={
              <div className="page">
                <div className="banner error">
                  页面不存在。{" "}
                  <Link to="/" className="back-link">
                    返回题目列表
                  </Link>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
