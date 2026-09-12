export interface StringEntry {
  id: number;
  /** Original absolute byte offset of the literal data. */
  offset: number;
  /** Offset relative to the string-literal-data section. */
  relativeOffset: number;
  originalBytes: Uint8Array;
  currentBytes: Uint8Array;
}

export interface MetadataHeader {
  magic: number;
  version: number;
  literalTableOffset: number;
  literalTableByteLength: number;
  dataOffset: number;
  dataByteLength: number;
}

export interface ParsedMetadataFile {
  fileName: string;
  originalData: Uint8Array;
  header: MetadataHeader;
  entries: StringEntry[];
}
