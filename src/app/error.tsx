"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Try again
      </button>
    </div>
  );
}
