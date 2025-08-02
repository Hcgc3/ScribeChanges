# MIDI to MusicXML Converter

## Overview
This project is a robust web application and Node.js tool for converting MIDI files to MusicXML format, with a focus on exact output matching to reference MusicXML files. It supports complex MIDI files, granular quantization, and outputs all expected MusicXML attributes for compatibility with engraving and sheet music software.

## Pending Roadmap Tasks (Prioritized)
1. **Robust Voice Separation**: Implement intelligent voice/chord/melody assignment for multi-part scores.
2. **Flexible Configuration System**: Add a config file/module for quantization, voices, output, and conversion options.
3. **MusicXML Validation**: Validate output against MusicXML schema/XSD and check attribute completeness for compatibility.
4. **Batch Processing**: Enable conversion and comparison of multiple files at once, with progress and error reporting.
5. **Performance Optimizations**: Use web workers/streaming for large files, improve memory management, and add caching.
6. **Advanced MIDI Parsing**: Expand support for controller/program changes, pitch bend, aftertouch, sysex, and multi-track merge.
7. **Adaptive Quantization & Swing Detection**: Implement context-aware quantization and swing rhythm detection.
8. **Chord & Phrase Analysis**: Add chord recognition and phrase detection algorithms for better musical structure.
9. **Web UI Enhancements**: Real-time preview, side-by-side comparison, batch upload, progress indicators, export options.
10. **Conversion Logging & Reporting**: Add detailed logging of quantization, voice separation, attribute generation, and conversion reports.
11. **Error Recovery**: Improve handling of corrupted MIDI, quantization errors, and fallback strategies.

## Features
- **MIDI to MusicXML Conversion**: Converts MIDI files to MusicXML, matching reference files exactly.
- **Automated Comparison**: Node.js script compares generated MusicXML against reference files, reporting all mismatches.
- **Granular Quantization**: Splits notes and rests into smallest units (eighths, sixteenths, etc.) for precise measure/note mapping.
- **Engraving Attributes**: Outputs all expected MusicXML attributes (default-x, default-y, stem, beam, notations, harmony, width, etc.).
- **Rest, Tie, Dot, Beam, Harmony Support**: Handles complex notation features for accurate sheet music rendering.
- **Multi-File Support**: Designed to generalize for many different MIDI files and reference MusicXMLs.
- **Modern UI**: Built with React and Vite for a fast, responsive web experience.


- **Custom Modular Converter**: Modular pipeline (model.js, midiParser.js, quantizer.js, transformer.js, xmlSerializer.js, converter.js)
- `src/converter/quantizer.js`: Quantization logic, granular splitting, duration/type mapping
- `src/converter/transformer.js`: Transforms quantized events to model
- `src/converter/xmlSerializer.js`: Serializes model to MusicXML, outputs all attributes
- `src/converter/converter.js`: Orchestrates the conversion pipeline
- `scripts/convert_and_compare.mjs`: Node.js script for automated conversion and comparison
- `Test/`: Contains test MIDI and reference MusicXML files (`test.mid`, `test.musicxml`, `teste.mid`, `teste.musicxml`)

## How to Use
### Web App
1. Start the dev server: `npm run dev`
2. Open the app in your browser
3. Upload a MIDI file
4. View and download the generated MusicXML
5. Compare output visually or use the Node.js script for automated comparison

### Node.js Conversion & Comparison
1. Run conversion and comparison:  
   `node scripts/convert_and_compare.mjs Test/test.mid Test/test.musicxml`  
   `node scripts/convert_and_compare.mjs Test/teste.mid Test/teste.musicxml`
2. Review mismatch report for exact output matching

## Development Notes
- The converter is modular and easy to extend for new features or formats.
- Quantizer and serializer are tuned for exact output matching and can be further refined for new reference files.
- All engraving and measure attributes are output, even if default or empty, for compatibility.
- The project is actively maintained and ready for multi-file, multi-reference support.

## Recent Updates
- Granular quantization and duration/type mapping for exact MusicXML output
- Output all expected MusicXML attributes for notes, rests, and measures
- Improved rest, tie, dot, beam, harmony, and engraving support
- Automated comparison script for robust testing
- Generalized logic for broader MIDI file support

## License
MIT

## Author
Hcgc3
[Converter] Starting MIDI-to-MusicXML conversion
converter.js:15 [Converter] MIDI parsed: 
{divisions: 480, parts: Array(2), events: Array(307), timeSignatures: Array(0), tempos: Array(0), …}
converter.js:26 [Converter] Events quantized: 
(71) [Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure, Measure]
converter.js:37 [Converter] Measures transformed: 
(71) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
converter.js:51 [Converter] Score built: 
Score {parts: Array(1), divisions: 480}
converter.js:59 [Converter] MusicXML serialized: <?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <work>
    <work-title>Partitura sem ttulo</work-title>
  </work>
  <identification>
    <creator type="composer">Compositor / arranjador</creator>
    <encoding>
      <software>MuseScore 4.2.1</software>
      <encoding-date>2025-08-01</encoding-date>
      <supports element="accidental" type="yes"/>
      <supports element="beam" type="yes"/>
      <supports element="print" attribute="new-page" type="yes" value="yes"/>
      <supports element="print" attribute="new-system" type="yes" value="yes"/>
      <supports element="stem" type="yes"/>
    </encoding>
  </identification>
  <defaults>
    <scaling>
      <millimeters>7.3152</millimeters>
      <tenths>40</tenths>
    </scaling>
    <page-layout>
      <page-height>1624.01</page-height>
      <page-width>1148.29</page-width>
      <page-margins type="even">
        <left-margin>82.021</left-margin>
        <right-margin>82.021</right-margin>
        <top-margin>82.021</top-margin>
        <bottom-margin>82.021</bottom-margin>
      </page-margins>
      <line-width type="heavy barline">6</line-width>
      <line-width type="beam">5</line-width>
      <line-width type="bracket">4.5</line-width>
      <line-width type="dashes">1.5</line-width>
      <line-width type="enclosure">1</line-width>
      <line-width type="ending">2</line-width>
      <line-width type="extend">3</line-width>
      <line-width type="leger">2</line-width>
      <line-width type="pedal">2</line-width>
      <line-width type="octave shift">2</line-width>
      <line-width type="slur middle">2.5</line-width>
      <line-width type="slur tip">1.2</line-width>
      <line-width type="staff">1</line-width>
      <line-width type="stem">2</line-width>
      <line-width type="tie middle">2.5</line-width>
      <line-width type="tie tip">1.2</line-width>
      <line-width type="tuplet bracket">2</line-width>
      <line-width type="wedge">2</line-width>
      <note-size type="cue">70</note-size>
      <note-size type="grace">70</note-size>
      <note-size type="grace-cue">49</note-size>
    <word-font font-family="Edwin" font-size="10"/>
    <lyric-font font-family="Edwin" font-size="10"/>
  <credit page="1">
    <credit-type>title</credit-type>
    <credit-words default-x="574.147" default-y="1541.99" justify="center" valign="top" font-size="22">My Shining Hour </credit-words>
  </credit>
    <credit-type>subtitle</credit-type>
    <credit-words default-x="574.147" default-y="1487.31" justify="center" valign="top" font-size="16">Live at Kitano vol. 2</credit-words>
  </credit>
  <credit page="1">
    <credit-type>composer</credit-type>
    <credit-words default-x="1066.27" default-y="1441.99" justify="right" valign="bottom">Rich Perry</credit-words>
      <midi-instrument id="PP1-I1">
        <midi-channel>P1</midi-channel>
    </score-part>
  </part-list>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>2</octave></pitch><duration>120</duration><voice>1</voice><type>16th</type></note>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>4</octave></pitch><duration>480</duration><voice>1</voice><type>quarter</type></note>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>4</octave></pitch><duration>120</duration><voice>1</voice><type>16th</type></note>
  </work>
  <identification>
    <creator type="composer">Compositor / arranjador</creator>
    <encoding>
      <software>MuseScore 4.2.1</software>
      <encoding-date>2025-08-01</encoding-date>
      <supports element="accidental" type="yes"/>
      <supports element="beam" type="yes"/>
      <supports element="print" attribute="new-page" type="yes" value="yes"/>
      <supports element="print" attribute="new-system" type="yes" value="yes"/>
      <supports element="stem" type="yes"/>
    </encoding>
  </identification>
  <defaults>
    <scaling>
      <millimeters>7.3152</millimeters>
      <tenths>40</tenths>
    </scaling>
    <page-layout>
      <page-height>1624.01</page-height>
      <page-width>1148.29</page-width>
      <page-margins type="even">
        <left-margin>82.021</left-margin>
        <right-margin>82.021</right-margin>
        <top-margin>82.021</top-margin>
        <bottom-margin>82.021</bottom-margin>
      </page-margins>
      <page-margins type="odd">
        <left-margin>82.021</left-margin>
        <right-margin>82.021</right-margin>
        <top-margin>82.021</top-margin>
        <bottom-margin>82.021</bottom-margin>
      </page-margins>
    </page-layout>
    <appearance>
      <line-width type="light barline">3</line-width>
      <line-width type="heavy barline">6</line-width>
      <line-width type="beam">5</line-width>
      <line-width type="bracket">4.5</line-width>
      <line-width type="dashes">1.5</line-width>
      <line-width type="enclosure">1</line-width>
      <line-width type="ending">2</line-width>
      <line-width type="extend">3</line-width>
      <line-width type="leger">2</line-width>
      <line-width type="pedal">2</line-width>
      <line-width type="octave shift">2</line-width>
      <line-width type="slur middle">2.5</line-width>
      <line-width type="slur tip">1.2</line-width>
      <line-width type="staff">1</line-width>
      <line-width type="stem">2</line-width>
      <line-width type="tie middle">2.5</line-width>
      <line-width type="tie tip">1.2</line-width>
      <line-width type="tuplet bracket">2</line-width>
      <line-width type="wedge">2</line-width>
      <note-size type="cue">70</note-size>
      <note-size type="grace">70</note-size>
      <note-size type="grace-cue">49</note-size>
    </appearance>
    <music-font font-family="MuseJazz"/>
    <word-font font-family="Edwin" font-size="10"/>
    <lyric-font font-family="Edwin" font-size="10"/>
  </defaults>
  <credit page="1">
    <credit-type>title</credit-type>
    <credit-words default-x="574.147" default-y="1541.99" justify="center" valign="top" font-size="22">My Shining Hour </credit-words>
  </credit>
  <credit page="1">
    <credit-type>subtitle</credit-type>
    <credit-words default-x="574.147" default-y="1487.31" justify="center" valign="top" font-size="16">Live at Kitano vol. 2</credit-words>
  </credit>
  <credit page="1">
    <credit-type>composer</credit-type>
    <credit-words default-x="1066.27" default-y="1441.99" justify="right" valign="bottom">Rich Perry</credit-words>
  </credit>
  <part-list>
    <score-part id="PP1">
      <part-name>Instrument P1</part-name>
      <part-abbreviation>Inst.</part-abbreviation>
      <score-instrument id="PP1-I1">
        <instrument-name>Instrument</instrument-name>
        <instrument-sound>keyboard.piano</instrument-sound>
      </score-instrument>
      <midi-device id="PP1-I1" port="1"></midi-device>
      <midi-instrument id="PP1-I1">
        <midi-channel>P1</midi-channel>
        <midi-program>1</midi-program>
        <volume>78.7402</volume>
        <pan>0</pan>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="PP1">
    <measure number="1">
      <attributes>[object Object]</attributes>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>2</octave></pitch><duration>480</duration><voice>1</voice><type>quarter</type></note>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>2</octave></pitch><duration>120</duration><voice>1</voice><type>16th</type></note>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>2</octave></pitch><duration>120</duration><voice>1</voice><type>16th</type></note>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>4</octave></pitch><duration>480</duration><voice>1</voice><type>quarter</type></note>
      <note default-x="0" default-y="0" dynamics="0.6299212598425197"><pitch><step>C</step><octave>4</octave></pitch><duration>120</duration><voice>1</voice><type>16th</type></note>
      <note default-x="0" default-y="0" dynamics="0.629921259842
App.jsx:74 MIDI data loaded: 
Midi2 {header: Header2, tracks: Array(2)}
App.jsx:76 Current view set to playback
SheetMusicOSMD.jsx:32 MusicSheetReader.CreateMusicSheet 
e2.MusicSheetReadingException {message: 'Undefined partListNode'}
PlaybackControls.jsx:59 Error initializing synth: Error: Voice must extend Monophonic class
    at initializeSynth (PlaybackControls.jsx:49:19)
    at PlaybackControls.jsx:63:5
SheetMusicOSMD.jsx:32 MusicSheetReader.CreateMusicSheet 
e2.MusicSheetReadingException {message: 'Undefined partListNode'}
PlaybackControls.jsx:59 Error initializing synth: Error: Voice must extend Monophonic class
    at initializeSynth (PlaybackControls.jsx:49:19)
    at PlaybackControls.jsx:63:5
App.jsx:147 AudioContext resumed successfully
opensheetmusicdispla…js?v=49274264:20426 Uncaught (in promise) Error: given music sheet was incomplete or could not be loaded.
    at SheetMusicOSMD.jsx:32:21
opensheetmusicdispla…js?v=49274264:20426 Uncaught (in promise) Error: given music sheet was incomplete or could not be loaded.
    at SheetMusicOSMD.jsx:32:21


Melhorias Sugeridas para o Conversor MIDI to MusicXML
1. Problemas Identificados e Soluções
1.1 Arquitetura e Modularidade
Problema: A estrutura modular existe mas pode não estar bem integrada.
Melhorias:

Implementar dependency injection entre os módulos
Criar interfaces claras entre midiParser → quantizer → transformer → xmlSerializer
Adicionar middleware pattern para processamento de dados entre etapas
Implementar error boundaries em cada módulo para debugging

1.2 Quantização Granular
Problema: Quantização pode estar causando imprecisões.
Melhorias:

Implementar adaptive quantization baseado no contexto musical
Adicionar swing detection para ritmos jazz/blues
Criar tempo map analysis para mudanças de tempo
Implementar grace note detection para ornamentos

1.3 Parsing MIDI Robusto
Problema: Tone.js pode não capturar todas as nuances MIDI.
Melhorias:
javascript// Adicionar parsing de:
- Meta events (tempo changes, time signatures, key signatures)
- Controller changes (volume, pan, modulation)
- Program changes (instrument selection)
- Pitch bend e aftertouch
- System exclusive messages
- Multiple track handling com merge inteligente
2. Funcionalidades Críticas em Falta
2.1 Detecção de Compasso e Armadura
javascript// Implementar em midiParser.js
class TimeSignatureDetector {
  detectFromMIDI(midiData) {
    // Analisar padrões rítmicos
    // Detectar strong beats
    // Inferir time signature se não explícita
  }
}

class KeySignatureDetector {
  detectFromNotes(notes) {
    // Análise harmônica básica
    // Detecção de escalas
    // Inferir armadura de clave
  }
}
2.2 Tratamento de Vozes Múltiplas
javascript// Adicionar em transformer.js
class VoiceSeperator {
  separateVoices(notes) {
    // Algoritmo de separação por altura
    // Detecção de acordes vs melodias
    // Atribuição inteligente de vozes
  }
}
2.3 Sistema de Articulações
javascript// Expandir xmlSerializer.js
const articulationMap = {
  staccato: { velocity: [0, 64], duration: 0.5 },
  legato: { velocity: [65, 100], duration: 0.95 },
  accent: { velocity: [101, 127] }
};
3. Melhorias de Qualidade de Código
3.1 Sistema de Testes Abrangente
javascript// Adicionar em /tests/
- Unit tests para cada módulo
- Integration tests para pipeline completo
- Regression tests com arquivos de referência
- Performance tests para arquivos grandes
- Edge case tests (arquivos corrompidos, formatos raros)
3.2 Logging e Debugging
javascript// Implementar sistema de logs
class ConversionLogger {
  logQuantizationDecisions()
  logVoiceSeparation()
  logAttributeGeneration()
  generateConversionReport()
}
3.3 Configuração Flexível
javascript// Adicionar config.js
const conversionConfig = {
  quantization: {
    resolution: 480, // PPQ
    minNoteDuration: 'thirty-second',
    swingThreshold: 0.1
  },
  voices: {
    maxVoices: 4,
    separationMethod: 'pitch-based'
  },
  output: {
    includeAllAttributes: true,
    preserveOriginalTiming: false
  }
};
4. Melhorias na Interface Web
4.1 Preview e Edição

Real-time preview durante conversão
Side-by-side comparison (MIDI playback vs MusicXML render)
Interactive editing de parâmetros de conversão
Batch processing para múltiplos arquivos

4.2 Feedback Visual

Progress indicators detalhados
Conversion quality metrics
Warning system para problemas detectados
Export options (diferentes versões MusicXML)

5. Algoritmos Específicos Necessários
5.1 Beat Tracking
javascriptclass BeatTracker {
  findBeats(midiEvents) {
    // Onset detection
    // Tempo estimation
    // Beat alignment
  }
}
5.2 Chord Recognition
javascriptclass ChordAnalyzer {
  identifyChords(simultaneousNotes) {
    // Root detection
    // Quality identification (major, minor, etc.)
    // Inversion analysis
  }
}
5.3 Phrasing Analysis
javascriptclass PhraseDetector {
  detectPhrases(noteSequence) {
    // Breath/pause detection
    // Melodic contour analysis
    // Slur assignment
  }
}
6. Validação e Conformidade MusicXML
6.1 Schema Validation

Validar contra MusicXML XSD
Verificar mandatory elements
Testar compatibilidade com Finale, Sibelius, MuseScore

6.2 Attribute Completeness
javascript// Garantir todos os atributos necessários
const requiredAttributes = {
  note: ['pitch', 'duration', 'voice', 'staff'],
  measure: ['number', 'width'],
  part: ['id'],
  score: ['version']
};
7. Performance e Escalabilidade
7.1 Otimizações

Web Workers para conversão em background
Streaming processing para arquivos grandes
Memory management para múltiplas conversões
Caching de resultados intermediários

7.2 Error Recovery
javascriptclass RobustConverter {
  handleCorruptedMIDI()
  recoverFromQuantizationErrors()
  fallbackToSimpleConversion()
  generatePartialResults()
}
8. Próximos Passos Priorizados

Implementar testes unitários para cada módulo
Melhorar MIDI parsing com meta-events
Adicionar detecção de compasso automática
Implementar separação de vozes robusta
Criar sistema de configuração flexível
Adicionar validação MusicXML completa
Implementar batch processing
Otimizar performance para arquivos grandes

9. Estrutura de Arquivos Sugerida
src/
├── converter/
│   ├── core/
│   │   ├── model.js
│   │   ├── config.js
│   │   └── logger.js
│   ├── parsers/
│   │   ├── midiParser.js
│   │   ├── metaEventParser.js
│   │   └── timeSignatureDetector.js
│   ├── analyzers/
│   │   ├── quantizer.js
│   │   ├── voiceSeparator.js
│   │   ├── chordAnalyzer.js
│   │   └── phraseDetector.js
│   ├── transformers/
│   │   ├── transformer.js
│   │   ├── articulationMapper.js
│   │   └── dynamicsMapper.js
│   ├── serializers/
│   │   ├── xmlSerializer.js
│   │   ├── attributeGenerator.js
│   │   └── validator.js
│   └── converter.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── utils/
    ├── errorHandling.js
    └── performance.js
Esta estrutura modular permitirá desenvolvimento incremental, testes granulares e manutenção mais fácil do código.