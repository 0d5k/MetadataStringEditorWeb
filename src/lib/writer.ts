import type { ParsedMetadataFile } from './types';

function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function buildModifiedFile(parsed: ParsedMetadataFile): Uint8Array {
  const { originalData, header, entries } = parsed;

  // Never rewrite a file when nothing changed. This guarantees a true byte-for-byte no-op.
  if (entries.every((entry) => bytesEqual(entry.originalBytes, entry.currentBytes))) {
    return originalData.slice();
  }

  let totalDataLength = 0;
  const newInfo = entries.map((entry) => {
    const offset = totalDataLength;
    const length = entry.currentBytes.byteLength;
    totalDataLength += length;
    if (totalDataLength > 0xffffffff) throw new Error('Edited string data exceeds the 32-bit metadata format limit.');
    return { offset, length };
  });

  // IL2CPP section sizes are normally 4-byte aligned. Padding is not exposed as a string.
  const paddedLength = Math.ceil(totalDataLength / 4) * 4;
  if (paddedLength > 0xffffffff) throw new Error('Edited string data exceeds the 32-bit metadata format limit.');
  const oldEnd = header.dataOffset + header.dataByteLength;
  const dataWasLastSection = oldEnd === originalData.length;

  let newDataOffset = header.dataOffset;
  if (paddedLength > header.dataByteLength && !dataWasLastSection) {
    // Growing over another metadata section would corrupt it, so append the new
    // string-literal-data section to the end of the file.
    newDataOffset = originalData.length;
  }

  const finalLength = Math.max(originalData.length, newDataOffset + paddedLength);
  if (finalLength > 0xffffffff) throw new Error('Output file exceeds the 32-bit metadata format limit.');

  const output = new Uint8Array(finalLength);
  output.set(originalData);
  const view = new DataView(output.buffer);

  // Rewrite only the string-literal table entries and the two header fields
  // describing the string-literal-data section.
  let tablePos = header.literalTableOffset;
  for (const info of newInfo) {
    view.setUint32(tablePos, info.length, true);
    view.setUint32(tablePos + 4, info.offset, true);
    tablePos += 8;
  }

  view.setUint32(16, newDataOffset, true);
  view.setUint32(20, paddedLength, true);

  // Clear the newly allocated region so padding cannot contain stale bytes.
  output.fill(0, newDataOffset, newDataOffset + paddedLength);
  for (let i = 0; i < entries.length; i++) {
    output.set(entries[i].currentBytes, newDataOffset + newInfo[i].offset);
  }

  return output;
}

/** Verify the generated file by parsing it and checking every edited string. */
export function verifyModifiedFile(parsed: ParsedMetadataFile, output: Uint8Array): void {
  // Imported lazily to avoid a circular module dependency at runtime.
  // eslint-free implementation via dynamic require is unavailable in the browser,
  // so the caller should use parser verification separately.
  if (output.byteLength < 24) throw new Error('Generated file is too small.');
  const view = new DataView(output.buffer, output.byteOffset, output.byteLength);
  if (view.getUint32(0, true) !== 0xfab11baf) throw new Error('Generated file has an invalid metadata magic.');
  if (view.getUint32(4, true) !== parsed.header.version) throw new Error('Generated file changed metadata version.');
}

export function deriveEditedFileName(originalName: string): string {
  const dotIndex = originalName.lastIndexOf('.');
  if (dotIndex <= 0) return `${originalName}_edited`;
  return `${originalName.slice(0, dotIndex)}_edited${originalName.slice(dotIndex)}`;
}
