// Reading a score file picked or dropped by the user into { name, content } (MusicXML text).
// .mxl is a zip: its root MusicXML is unpacked here (DecompressionStream), so the rest of
// the app (viewer, editor, metadata) always works with plain XML text.

export const SCORE_FILE_PATTERN = /\.(xml|musicxml|mxl)$/i;

const u16 = (b, i) => b[i] | (b[i + 1] << 8);
const u32 = (b, i) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

// Entries of a zip from its central directory: name -> { method, offset, size }
function zipEntries(bytes) {
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(bytes, i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error('Ficheiro MXL inválido');
  const count = u16(bytes, end + 10);
  let p = u32(bytes, end + 16);
  const entries = new Map();
  const decoder = new TextDecoder();
  for (let n = 0; n < count && u32(bytes, p) === 0x02014b50; n++) {
    const method = u16(bytes, p + 10);
    const size = u32(bytes, p + 20);
    const nameLength = u16(bytes, p + 28);
    const extra = u16(bytes, p + 30);
    const comment = u16(bytes, p + 32);
    const offset = u32(bytes, p + 42);
    entries.set(decoder.decode(bytes.subarray(p + 46, p + 46 + nameLength)), { method, offset, size });
    p += 46 + nameLength + extra + comment;
  }
  return entries;
}

async function readEntry(bytes, { method, offset, size }) {
  const start = offset + 30 + u16(bytes, offset + 26) + u16(bytes, offset + 28);
  const data = bytes.subarray(start, start + size);
  if (method === 0) return new TextDecoder().decode(data);
  if (method !== 8) throw new Error('Compressão MXL não suportada');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
}

export async function unzipMxl(buffer) {
  const bytes = new Uint8Array(buffer);
  const entries = zipEntries(bytes);
  // META-INF/container.xml names the root score; otherwise the first MusicXML entry
  let root = null;
  const container = entries.get('META-INF/container.xml');
  if (container) {
    const xml = await readEntry(bytes, container);
    root = new DOMParser().parseFromString(xml, 'application/xml').querySelector('rootfile')?.getAttribute('full-path');
  }
  if (!root || !entries.has(root)) {
    root = [...entries.keys()].find((n) => !n.startsWith('META-INF/') && /\.(xml|musicxml)$/i.test(n));
  }
  if (!root) throw new Error('O ficheiro MXL não contém MusicXML');
  return readEntry(bytes, entries.get(root));
}

export async function readScoreFile(file) {
  if (!(typeof File !== 'undefined' && file instanceof File)) return file;
  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength));
  const zipped = head[0] === 0x50 && head[1] === 0x4b; // "PK"
  const content = zipped ? await unzipMxl(buffer) : new TextDecoder().decode(buffer);
  return { name: file.name, content };
}
