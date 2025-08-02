// Script to compare two MusicXML files and print differences
const fs = require('fs');
const xml2js = require('xml2js');

const fileA = process.argv[2];
const fileB = process.argv[3];

if (!fileA || !fileB) {
  console.error('Usage: node compare_xml.cjs <fileA.xml> <fileB.xml>');
  process.exit(1);
}

const parseXml = async (file) => {
  const data = fs.readFileSync(file, 'utf8');
  return await xml2js.parseStringPromise(data, { mergeAttrs: true });
};

(async () => {
  const xmlA = await parseXml(fileA);
  const xmlB = await parseXml(fileB);
  // Simple deep diff
  const diff = (a, b, path = '') => {
    if (typeof a !== typeof b) return [`Type mismatch at ${path}`];
    if (typeof a !== 'object' || a === null || b === null) {
      if (a !== b) return [`Value mismatch at ${path}: ${a} !== ${b}`];
      return [];
    }
    let out = [];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      if (!(k in a)) out.push(`Missing in A at ${path}.${k}`);
      else if (!(k in b)) out.push(`Missing in B at ${path}.${k}`);
      else out = out.concat(diff(a[k], b[k], path ? `${path}.${k}` : k));
    }
    return out;
  };
  const differences = diff(xmlA, xmlB);
  if (differences.length === 0) {
    console.log('Files are identical.');
  } else {
    console.log('Differences found:');
    differences.forEach(d => console.log(d));
  }
})();
