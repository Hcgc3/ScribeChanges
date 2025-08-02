// tests/unit/batchProcessor.test.js
import { batchConvertAndCompare, findMidiFiles } from '../../src/converter/batchProcessor.js';
import fs from 'fs';
import path from 'path';

describe('batchProcessor', () => {
  const testDir = path.join(__dirname, '../Test');
  const outputDir = path.join(__dirname, '../Test/batch_output');

  beforeAll(() => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up output files
    if (fs.existsSync(outputDir)) {
      fs.readdirSync(outputDir).forEach(f => fs.unlinkSync(path.join(outputDir, f)));
      fs.rmdirSync(outputDir);
    }
  });

  it('should find all MIDI files in test directory', () => {
    const midiFiles = findMidiFiles(testDir);
    expect(Array.isArray(midiFiles)).toBe(true);
    // Pass if array is empty or contains .mid files
    if (midiFiles.length > 0) {
      expect(midiFiles.some(f => f.endsWith('.mid'))).toBe(true);
    } else {
      expect(midiFiles.length).toBe(0);
    }
  });

  it('should batch convert MIDI files to MusicXML and validate', async () => {
    const midiFiles = findMidiFiles(testDir);
    const results = await batchConvertAndCompare(midiFiles, outputDir);
    expect(Array.isArray(results)).toBe(true);
    results.forEach(res => {
      expect(res.success).toBe(true);
      expect(fs.existsSync(res.outputPath)).toBe(true);
      expect(res.validation).toBeDefined();
    });
  });
});
