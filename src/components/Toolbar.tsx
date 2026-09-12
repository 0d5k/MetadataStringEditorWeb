import { useRef, useState } from 'react';

interface ToolbarProps {
  hasFile: boolean;
  hasChanges: boolean;
  onOpenFile: (file: File) => void;
  onSave: (fileName?: string) => void;
  onRevertAll: () => void;
  onExportTxt: () => void;
  onExportCsv: () => void;
  onCredits: () => void;
}

const buttonBase =
  'px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed';

export function Toolbar({
  hasFile,
  hasChanges,
  onOpenFile,
  onSave,
  onRevertAll,
  onExportTxt,
  onExportCsv,
  onCredits,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onOpenFile(file);
          e.target.value = '';
        }}
      />
      <button className={buttonBase} onClick={() => inputRef.current?.click()}>
        Open File
      </button>
      <button
        className={buttonBase}
        disabled={!hasFile}
        onClick={() => {
          const name = window.prompt('Save as filename:');
          onSave(name ?? undefined);
        }}
      >
        Save / Export
      </button>
      <button
        className={buttonBase}
        disabled={!hasFile || !hasChanges}
        onClick={() => {
          if (window.confirm('Discard all changes and restore the original strings?')) {
            onRevertAll();
          }
        }}
      >
        Revert
      </button>

      <button className={buttonBase} onClick={onCredits}>
        Credits
      </button>

      <div className="relative">
        <button
          className={buttonBase}
          disabled={!hasFile}
          onClick={() => setExportMenuOpen((v) => !v)}
        >
          Export Strings ▾
        </button>
        {exportMenuOpen && (
          <div
            className="absolute right-0 z-10 mt-1 w-40 rounded border border-gray-300 bg-white shadow-md"
            onMouseLeave={() => setExportMenuOpen(false)}
          >
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                onExportTxt();
                setExportMenuOpen(false);
              }}
            >
              Export as TXT
            </button>
            <button
              className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
              onClick={() => {
                onExportCsv();
                setExportMenuOpen(false);
              }}
            >
              Export as CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
