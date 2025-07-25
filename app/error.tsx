'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center text-center p-4">
      <h2 className="text-2xl font-semibold text-red-600">Something went wrong!</h2>
      <p className="text-sm mt-2 text-gray-500">Please try again or return to the homepage.</p>

      <div className="mt-6 flex space-x-4">
        <button
          className="rounded-md bg-blue-500 px-4 py-2 text-white text-sm transition hover:bg-blue-400"
          onClick={() => reset()}
        >
          Try Again
        </button>
        <button
          className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:bg-gray-400"
          onClick={() => router.push('/')}
        >
          Go to Home
        </button>
      </div>
    </main>
  );
}
