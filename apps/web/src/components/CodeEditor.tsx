import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";

// cpp / python / go / java 均为内置 basic-languages（Monarch 语法高亮，主线程运行），
// 无需语言 worker（worker 仅服务于 TS/JSON/CSS/HTML 等语言智能）

interface Props {
  language: string;
  value: string;
  onChange: (v: string) => void;
  /** 是否暗色（决定 Monaco 内置主题 vs-dark / light） */
  isDark?: boolean;
}

/** Monaco 编辑器封装：主题随平台主题切换，自动布局，语言随 props 切换 */
export default function CodeEditor({ language, value, onChange, isDark = true }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 创建编辑器（仅一次）
  useEffect(() => {
    if (!hostRef.current) return;
    const editor = monaco.editor.create(hostRef.current, {
      value,
      language,
      theme: isDark ? "vs-dark" : "light",
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 13.5,
      tabSize: 4,
      scrollBeyondLastLine: false,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
      padding: { top: 12, bottom: 12 },
    });
    editorRef.current = editor;
    editor.onDidChangeModelContent(() => {
      onChangeRef.current(editor.getValue());
    });
    return () => {
      editor.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 语言切换
  useEffect(() => {
    const model = editorRef.current?.getModel();
    if (model) monaco.editor.setModelLanguage(model, language);
  }, [language]);

  // 亮暗主题切换
  useEffect(() => {
    monaco.editor.setTheme(isDark ? "vs-dark" : "light");
  }, [isDark]);

  // 外部值变化（加载草稿/模板）时同步，避免循环触发
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [value]);

  return <div ref={hostRef} className="monaco-host" />;
}
