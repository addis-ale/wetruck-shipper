"use client";

export default function ContainerDetailsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        Failed to load container
      </h2>

      <p className="text-sm text-muted-foreground">
        {error.message}
      </p>

      <button
        onClick={reset}
        className="text-sm underline"
      >
        Retry
      </button>
    </div>
  );
}
