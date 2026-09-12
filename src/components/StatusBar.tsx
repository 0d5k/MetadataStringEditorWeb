import type { Status } from '../lib/useMetadataEditor';

interface StatusBarProps {
  fileName: string | null;
  totalStrings: number;
  modifiedCount: number;
  version: number | null;
  status: Status;
}

export function StatusBar({ fileName, totalStrings, modifiedCount, version, status }: StatusBarProps) {
  const statusColor =
    status.kind === 'error' ? 'text-red-600' : status.kind === 'loading' ? 'text-blue-600' : 'text-gray-500';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
      <span>Loaded: {fileName ?? '—'}</span>
      <span>Version: {version ?? '—'}</span>
      <span>Strings: {totalStrings}</span>
      <span>Modified: {modifiedCount}</span>
      <span className={`ml-auto ${statusColor}`}>
        {status.kind !== 'idle' ? status.message : ''}
      </span>
    </div>
  );
}
