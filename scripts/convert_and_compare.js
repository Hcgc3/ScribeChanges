// Script: Convert MIDI to MusicXML and compare to reference
const fs = require('fs');
const xml2js = require('xml2js');
const { Midi } = require('@tonejs/midi');
const { midiBufferToMusicXML } = require('../src/converter/converter.js');

const midiPath = 'Test/teste.mid';
const refXmlPath = 'Test/teste.musicxml';
const outXmlPath = 'Test/copilot_output.musicxml';

async function main() {
  // Read MIDI file
  const midiBuffer = fs.readFileSync(midiPath);
  // Convert to MusicXML
  const xml = await midiBufferToMusicXML(midiBuffer.buffer);
  fs.writeFileSync(outXmlPath, xml);
  console.log('Converted MIDI to MusicXML:', outXmlPath);
  // Compare to reference
  const refXml = fs.readFileSync(refXmlPath, 'utf8');
  const outXml = fs.readFileSync(outXmlPath, 'utf8');
  const refObj = await xml2js.parseStringPromise(refXml, { mergeAttrs: true });
  const outObj = await xml2js.parseStringPromise(outXml, { mergeAttrs: true });
  // Simple deep diff
  function diff(a, b, path = '') {
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
  }
  const differences = diff(outObj, refObj);
  if (differences.length === 0) {
    console.log('Files are identical.');
  } else {
    console.log('Differences found:');
    differences.forEach(d => console.log(d));
  }
}
main();
