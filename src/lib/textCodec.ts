const decoder = new TextDecoder('utf-8', { fatal: false });
const encoder = new TextEncoder();

export function decodeUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

export function encodeUtf8(text: string): Uint8Array {
  // MetadataStringEditor edits are single-line values.
  return encoder.encode(text.replace(/\r\n/g, '').replace(/[\r\n]/g, ''));
}
