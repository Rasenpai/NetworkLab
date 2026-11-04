export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[300px_1fr]">
      <div className="h-[34rem] animate-pulse rounded-2xl border border-line bg-card" />
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-card" />
      </div>
    </div>
  );
}
