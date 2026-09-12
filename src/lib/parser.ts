import type { MetadataHeader, ParsedMetadataFile, StringEntry } from './types';

export const MAGIC = 0xfab11baf;
export const MAX_FILE_SIZE = 512 * 1024 * 1024;

export class MetadataFileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetadataFileParseError';
  }
}

function rangeEnd(offset: number, length: number): number {
  const end = offset + length;
  if (!Number.isSafeInteger(end)) throw new MetadataFileParseError('Invalid integer range in metadata header.');
  return end;
}

function validateRange(name: string, offset: number, length: number, fileSize: number): void {
  if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0) {
    throw new MetadataFileParseError(`Invalid ${name} offset or length.`);
  }
  const end = rangeEnd(offset, length);
  if (end > fileSize) {
    throw new MetadataFileParseError(`${name} extends past the end of the file.`);
  }
}

function readHeader(view: DataView): MetadataHeader {
  if (view.byteLength < 24) {
    throw new MetadataFileParseError('File is too small to contain an IL2CPP metadata header.');
  }

  const magic = view.getUint32(0, true);
  if (magic !== MAGIC) {
    throw new MetadataFileParseError('Invalid metadata magic. Expected 0xFAB11BAF.');
  }

  const version = view.getUint32(4, true);
  const literalTableOffset = view.getUint32(8, true);
  const literalTableByteLength = view.getUint32(12, true);
  const dataOffset = view.getUint32(16, true);
  const dataByteLength = view.getUint32(20, true);

  if (version === 0 || version > 1000) {
    throw new MetadataFileParseError(`Unsupported or invalid metadata version: ${version}.`);
  }
  if (literalTableByteLength % 8 !== 0) {
    throw new MetadataFileParseError('String-literal table size is not divisible by 8.');
  }
  if (literalTableByteLength === 0) {
    throw new MetadataFileParseError('String-literal table is empty.');
  }

  validateRange('string-literal table', literalTableOffset, literalTableByteLength, view.byteLength);
  validateRange('string-literal data', dataOffset, dataByteLength, view.byteLength);

  if (dataOffset < 24 || literalTableOffset < 24) {
    throw new MetadataFileParseError('Metadata table offsets point inside the header.');
  }

  return { magic, version, literalTableOffset, literalTableByteLength, dataOffset, dataByteLength };
}

interface LiteralTableEntry {
  length: number;
  relativeOffset: number;
}

function readLiteralTable(view: DataView, header: MetadataHeader): LiteralTableEntry[] {
  const count = header.literalTableByteLength / 8;
  const entries = new Array<LiteralTableEntry>(count);

  for (let i = 0; i < count; i++) {
    const pos = header.literalTableOffset + i * 8;
    const length = view.getUint32(pos, true);
    const relativeOffset = view.getUint32(pos + 4, true);

    if (relativeOffset > header.dataByteLength || length > header.dataByteLength - relativeOffset) {
      throw new MetadataFileParseError(
        `String literal ${i} points outside the string-literal data section (offset ${relativeOffset}, length ${length}).`,
      );
    }
    entries[i] = { length, relativeOffset };
  }

  return entries;
}

function readStringBytes(data: Uint8Array, header: MetadataHeader, entry: LiteralTableEntry): Uint8Array {
  const start = header.dataOffset + entry.relativeOffset;
  const end = start + entry.length;
  return data.slice(start, end);
}

export function parseMetadataFile(fileName: string, data: Uint8Array): ParsedMetadataFile {
  if (data.byteLength > MAX_FILE_SIZE) {
    throw new MetadataFileParseError(`File is too large. Maximum supported size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`);
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const header = readHeader(view);
  const literalTable = readLiteralTable(view, header);

  const entries: StringEntry[] = literalTable.map((entry, id) => {
    const bytes = readStringBytes(data, header, entry);
    return {
      id,
      offset: header.dataOffset + entry.relativeOffset,
      relativeOffset: entry.relativeOffset,
      originalBytes: bytes,
      currentBytes: bytes,
    };
  });

  return { fileName, originalData: data, header, entries };
}
