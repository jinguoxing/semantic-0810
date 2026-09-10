/** 极简 className 拼接（无第三方依赖） */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
