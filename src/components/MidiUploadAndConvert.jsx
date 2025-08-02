import React, { useState } from 'react';
import { midiBufferToMusicXML } from '../converter/converter';

export default function MidiUploadAndConvert() {
  const [musicXml, setMusicXml] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e) => {
    setError('');
    setMusicXml('');
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name.replace(/\.mid$/i, '.musicxml'));
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Convert MIDI buffer to MusicXML
      const xml = await midiBufferToMusicXML(arrayBuffer);
      setMusicXml(xml);
    } catch (err) {
      setError('Conversion failed: ' + err.message);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([musicXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'output.musicxml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>MIDI to MusicXML Converter</h2>
      <input type="file" accept=".mid,.midi" onChange={handleFileChange} />
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {musicXml && (
        <div style={{ marginTop: 20 }}>
          <button onClick={handleDownload}>Download MusicXML</button>
          <pre style={{ maxHeight: 300, overflow: 'auto', background: '#f9f9f9', padding: 10 }}>{musicXml.slice(0, 2000)}</pre>
        </div>
      )}
    </div>
  );
}
