// src/converter/batchProcessor.js
// Batch processing for MIDI-to-MusicXML conversion and comparison

import fs from 'fs';
import path from 'path';
import { convertMidiToMusicXML } from './converter.js';
import { validateMusicXML } from './MusicXMLValidator.js';

/**
 * Batch convert and compare multiple MIDI files to MusicXML.
 * @param {string[]} midiFilePaths - Array of MIDI file paths.
 * @param {string} outputDir - Directory to write MusicXML outputs.
 * @param {Object} options - Conversion options.
 * @returns {Promise<Array>} - Array of result objects per file.
 */
export async function batchConvertAndCompare(midiFilePaths, outputDir, options = {}) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const results = [];
  for (const midiPath of midiFilePaths) {
    try {
      const midiData = fs.readFileSync(midiPath);
      const musicXML = await convertMidiToMusicXML(midiData, options);
      const fileName = path.basename(midiPath, path.extname(midiPath)) + '.musicxml';
      const outputPath = path.join(outputDir, fileName);
      fs.writeFileSync(outputPath, musicXML);
      const validation = validateMusicXML(musicXML);
      results.push({ midiPath, outputPath, success: true, validation });
    } catch (err) {
      results.push({ midiPath, error: err.message, success: false });
    }
  }
  return results;
}

/**
 * Utility to find all MIDI files in a directory (recursively).
 * @param {string} dir - Directory to search.
 * @returns {string[]} - Array of MIDI file paths.
 */
export function findMidiFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findMidiFiles(filePath));
    } else if (filePath.toLowerCase().endsWith('.mid') || filePath.toLowerCase().endsWith('.midi')) {
      results.push(filePath);
    }
  }
  return results;
}
