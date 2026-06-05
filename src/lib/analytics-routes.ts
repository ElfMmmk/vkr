export function isPublicAnalyticsPath(path: string): boolean {
  return (
    path.startsWith("/") &&
    !path.startsWith("/admin") &&
    !path.startsWith("/account") &&
    !path.startsWith("/api") &&
    !path.startsWith("/_next")
  );
}
