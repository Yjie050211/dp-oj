import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** 全局错误边界：任何子组件崩溃都不整站白屏，提供刷新/回列表出口 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[dp-oj] 页面渲染崩溃:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="card">
            <h2>页面出错了</h2>
            <p className="subtitle">渲染过程中发生异常：{String(this.state.error.message ?? this.state.error)}</p>
            <div className="row-actions" style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button className="btn primary" onClick={() => window.location.reload()}>
                刷新页面
              </button>
              <a className="btn ghost" href="/">
                返回题目列表
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
