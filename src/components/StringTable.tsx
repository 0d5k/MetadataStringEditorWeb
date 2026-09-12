import { useCallback, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { StringEntry } from '../lib/types';
import { decodeUtf8 } from '../lib/textCodec';
import { isModified } from '../lib/useMetadataEditor';

interface StringTableProps {
  entries: StringEntry[];
  onEdit: (id: number, newText: string) => void;
  onRevert: (id: number) => void;
}

const ROW_HEIGHT = 32;
// Render a little more than the viewport so fast scrolling doesn't flash blank rows.
const OVERSCAN = 8;

export function StringTable({ entries, onEdit, onRevert }: StringTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) setViewportHeight(el.clientHeight);
  }, []);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');

  const total = entries.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(total, startIndex + visibleCount);
  const visibleEntries = entries.slice(startIndex, endIndex);

  function startEdit(entry: StringEntry) {
    setEditingId(entry.id);
    setDraftText(decodeUtf8(entry.currentBytes));
  }

  function commitEdit(id: number) {
    onEdit(id, draftText);
    setEditingId(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, id: number) {
    if (e.key === 'Enter') {
      commitEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-[120px_1fr_1fr] border-b border-gray-300 bg-gray-100 text-xs font-semibold text-gray-600">
        <div className="border-r border-gray-300 px-2 py-1.5">Offset</div>
        <div className="border-r border-gray-300 px-2 py-1.5">Original String</div>
        <div className="px-2 py-1.5">Current String</div>
      </div>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        {total === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-gray-400">No strings to display</div>
        ) : (
          <div style={{ height: total * ROW_HEIGHT, position: 'relative' } as CSSProperties}>
            {visibleEntries.map((entry, i) => {
              const index = startIndex + i;
              const top = index * ROW_HEIGHT;
              const modified = isModified(entry);
              const isEditing = editingId === entry.id;

              return (
                <div
                  key={entry.id}
                  style={{ position: 'absolute', top, left: 0, right: 0, height: ROW_HEIGHT }}
                  className={`grid grid-cols-[120px_1fr_1fr] items-center border-b border-gray-100 text-sm ${
                    modified ? 'bg-amber-50' : index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="truncate border-r border-gray-100 px-2 font-mono text-xs text-gray-500">
                    {entry.offset}
                  </div>
                  <div className="truncate border-r border-gray-100 px-2 text-gray-700">
                    {decodeUtf8(entry.originalBytes)}
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    {isEditing ? (
                      <input
                        autoFocus
                        className="w-full rounded border border-blue-400 px-1 py-0.5 text-sm outline-none"
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        onBlur={() => commitEdit(entry.id)}
                        onKeyDown={(e) => handleKeyDown(e, entry.id)}
                      />
                    ) : (
                      <button
                        className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-left hover:bg-gray-200/60"
                        title="Click to edit"
                        onClick={() => startEdit(entry)}
                      >
                        {decodeUtf8(entry.currentBytes)}
                      </button>
                    )}
                    {modified && !isEditing && (
                      <button
                        title="Revert this string to its original value"
                        onClick={() => onRevert(entry.id)}
                        className="shrink-0 rounded px-1 text-xs text-amber-700 hover:bg-amber-100"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
