import { useCallback, useMemo, useState } from 'react';
import type { ParsedMetadataFile, StringEntry } from './types';
import { parseMetadataFile, MetadataFileParseError } from './parser';
import { buildModifiedFile, deriveEditedFileName } from './writer';
import { encodeUtf8, decodeUtf8 } from './textCodec';
import { downloadBinaryFile, downloadTextFile, toCsv, toTxt } from './exportStrings';

export type Status =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'ready'; message: string }
  | { kind: 'error'; message: string };

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function isModified(entry: StringEntry): boolean {
  return !bytesEqual(entry.originalBytes, entry.currentBytes);
}

export function useMetadataEditor() {
  const [parsed, setParsed] = useState<ParsedMetadataFile | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [search, setSearch] = useState('');

  const loadFile = useCallback(async (file: File) => {
    setStatus({ kind: 'loading', message: `Reading ${file.name}...` });
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      const result = parseMetadataFile(file.name, data);
      setParsed(result);
      setSearch('');
      setStatus({
        kind: 'ready',
        message: `Loaded ${file.name} — ${result.entries.length} string${result.entries.length === 1 ? '' : 's'} found`,
      });
    } catch (err) {
      setParsed(null);
      const message = err instanceof MetadataFileParseError ? err.message : `Failed to parse file: ${String(err)}`;
      setStatus({ kind: 'error', message });
    }
  }, []);

  const closeFile = useCallback(() => {
    setParsed(null);
    setSearch('');
    setStatus({ kind: 'idle' });
  }, []);

  const editEntry = useCallback((id: number, newText: string) => {
    setParsed((prev) => {
      if (!prev) return prev;
      const entries = prev.entries.map((e) =>
        e.id === id ? { ...e, currentBytes: encodeUtf8(newText) } : e,
      );
      return { ...prev, entries };
    });
  }, []);

  const revertEntry = useCallback((id: number) => {
    setParsed((prev) => {
      if (!prev) return prev;
      const entries = prev.entries.map((e) =>
        e.id === id ? { ...e, currentBytes: e.originalBytes } : e,
      );
      return { ...prev, entries };
    });
  }, []);

  const revertAll = useCallback(() => {
    setParsed((prev) => {
      if (!prev) return prev;
      const entries = prev.entries.map((e) => ({ ...e, currentBytes: e.originalBytes }));
      return { ...prev, entries };
    });
    setStatus({ kind: 'ready', message: 'All changes reverted' });
  }, []);

  const saveFile = useCallback(
    (fileName?: string) => {
      if (!parsed) return;
      try {
        const output = buildModifiedFile(parsed);
        const verification = parseMetadataFile(parsed.fileName, output);
        if (verification.entries.length !== parsed.entries.length) {
          throw new Error('Export verification failed: string count changed.');
        }
        for (let i = 0; i < parsed.entries.length; i++) {
          const expected = parsed.entries[i].currentBytes;
          const actual = verification.entries[i].originalBytes;
          if (!bytesEqual(expected, actual)) {
            throw new Error(`Export verification failed for string ${i}.`);
          }
        }
        const name = fileName?.trim() || deriveEditedFileName(parsed.fileName);
        downloadBinaryFile(output, name);
        setStatus({ kind: 'ready', message: `Saved and verified ${name}` });
      } catch (err) {
        setStatus({ kind: 'error', message: `Failed to save file: ${String(err)}` });
      }
    },
    [parsed],
  );

  const exportTxt = useCallback(() => {
    if (!parsed) return;
    const name = deriveEditedFileName(parsed.fileName).replace(/\.[^.]+$/, '') + '.txt';
    downloadTextFile(toTxt(parsed.entries), name);
  }, [parsed]);

  const exportCsv = useCallback(() => {
    if (!parsed) return;
    const name = deriveEditedFileName(parsed.fileName).replace(/\.[^.]+$/, '') + '.csv';
    downloadTextFile(toCsv(parsed.entries), name, 'text/csv');
  }, [parsed]);

  const modifiedCount = useMemo(() => {
    if (!parsed) return 0;
    let count = 0;
    for (const e of parsed.entries) {
      if (isModified(e)) count++;
    }
    return count;
  }, [parsed]);

  const filteredEntries = useMemo(() => {
    if (!parsed) return [];
    const query = search.trim().toLowerCase();
    if (!query) return parsed.entries;
    return parsed.entries.filter((e) => {
      const original = decodeUtf8(e.originalBytes).toLowerCase();
      if (original.includes(query)) return true;
      const current = decodeUtf8(e.currentBytes).toLowerCase();
      return current.includes(query);
    });
  }, [parsed, search]);

  return {
    parsed,
    status,
    setStatus,
    search,
    setSearch,
    loadFile,
    closeFile,
    editEntry,
    revertEntry,
    revertAll,
    saveFile,
    exportTxt,
    exportCsv,
    modifiedCount,
    filteredEntries,
  };
}
