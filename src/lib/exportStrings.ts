import type { StringEntry } from './types';
import { decodeUtf8 } from './textCodec';

/** Plain-text export: one current string per line. */
export function toTxt(entries: StringEntry[]): string {
  return entries.map((e) => decodeUtf8(e.currentBytes)).join('\n');
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** CSV export with offset, original string, and current string columns. */
export function toCsv(entries: StringEntry[]): string {
  const header = ['Offset', 'Original String', 'Current String'].join(',');
  const rows = entries.map((e) =>
    [
      e.offset.toString(),
      csvEscape(decodeUtf8(e.originalBytes)),
      csvEscape(decodeUtf8(e.currentBytes)),
    ].join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadTextFile(content: string, fileName: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  triggerDownload(blob, fileName);
}

export function downloadBinaryFile(data: Uint8Array, fileName: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
  triggerDownload(blob, fileName);
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
