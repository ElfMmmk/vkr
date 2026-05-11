import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const classes =
    variant === "primary"
      ? "border-ink bg-ink text-white hover:border-accent hover:bg-accent active:border-ink active:bg-ink"
      : "border-line bg-white text-ink hover:border-ink hover:bg-paper active:border-muted";

  return (
    <Link
      className={`focus-ring inline-flex min-h-12 items-center justify-center border px-5 py-3 text-sm font-semibold transition active:translate-y-px ${classes}`}
      href={href}
    >
      {children}
    </Link>
  );
}
