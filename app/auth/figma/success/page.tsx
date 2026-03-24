export default function FigmaAuthSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-7 w-7 text-emerald-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>
        <h1 className="mb-2 text-xl font-semibold text-zinc-900">You&apos;re signed in!</h1>
        <p className="text-sm text-zinc-500">
          Authentication successful. You can close this tab and return to Figma.
        </p>
      </div>
    </div>
  );
}
