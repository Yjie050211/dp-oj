/**
 * 输出比对：去行尾空白 + 忽略末尾空行 + 统一换行（CRLF -> LF）。
 * 该策略与主流 OJ 一致，可容忍「行末多余空格」但不容忍行内差异。
 */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

export function compareOutput(expected: string, actual: string): boolean {
  return normalizeOutput(expected) === normalizeOutput(actual);
}
