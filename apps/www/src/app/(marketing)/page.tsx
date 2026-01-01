export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center max-w-lg bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
        <h1 className="text-3xl font-semibold mb-4 text-[var(--text-heading)]">Welcome to Pantolingo</h1>
        <p className="text-base leading-relaxed text-[var(--text-muted)]">Website translation made simple</p>
        <p className="text-sm mt-6 text-[var(--text-subtle)]">Get started by signing up for an account</p>
      </div>
    </main>
  )
}
