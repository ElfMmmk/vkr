import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const classes =
    variant === "primary"
      ? "border-ink bg-ink text-white hover:bg-accent"
      : "border-line bg-white text-ink hover:border-ink";

  return (
    <Link
      className={`focus-ring inline-flex items-center justify-center border px-5 py-3 text-sm font-semibold transition ${classes}`}
      href={href}
    >
      {children}
    </Link>
  );
}
