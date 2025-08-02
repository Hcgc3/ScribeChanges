// Flexible configuration system for MIDI to MusicXML conversion
// Centralizes all tunable parameters for quantization, voices, output, etc.

const conversionConfig = {
  quantization: {
    divisions: 480, // PPQ
    minNoteDuration: 'thirty-second',
    swingThreshold: 0.1,
    adaptive: false
  },
  voices: {
    maxVoices: 4,
    separationMethod: 'pitch-based' // or 'interval', 'timing', etc.
  },
  output: {
    includeAllAttributes: true,
    preserveOriginalTiming: false,
    musicXMLVersion: '4.0'
  },
  logging: {
    enabled: true,
    level: 'info'
  }
};

export default conversionConfig;
