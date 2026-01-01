"use client";

export default function ContainersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Failed to load containers</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>

      <button
        onClick={reset}
        className="text-sm underline"
      >
        Try again
      </button>
    </div>
  );
}
