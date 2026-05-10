type AdminCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AdminCard({ title, description, children }: AdminCardProps) {
  return (
    <section className="border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-line pb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
