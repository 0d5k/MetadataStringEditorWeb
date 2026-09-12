export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-white px-4 text-gray-900">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <h1 className="text-xl font-semibold">Credits</h1>

        <p className="mt-2 text-sm text-gray-600">
          Metadata String Editor
        </p>

        <div className="mt-5 flex flex-col gap-2 text-sm">
          <a
            className="text-blue-600 hover:underline"
            href="https://github.com/0d5k"
            target="_blank"
            rel="noreferrer"
          >
            wind1899 · github.com/0d5k
          </a>

          <a
            className="text-blue-600 hover:underline"
            href="https://github.com/bxt913"
            target="_blank"
            rel="noreferrer"
          >
            bxt · github.com/bxt913
          </a>
        </div>

        <div>
          <button
            className="mt-6 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
            onClick={onBack}
          >
            Back to Editor
          </button>
        </div>
      </div>
    </div>
  );
}