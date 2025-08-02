// Configuração central do conversor MIDI → MusicXML
// Edite este arquivo para ajustar opções do pipeline

module.exports = {
  quantization: {
    divisions: 480, // Pulsos por semínima
    granularity: 4, // 1=semibreve, 2=mínima, 4=semínima, 8=colcheia, etc.
    snapToGrid: true // Se true, força notas para grid
  },
  output: {
    musicFont: 'MuseJazz',
    partName: 'Piano',
    format: 'musicxml', // musicxml, xml, json
    prettyPrint: true
  },
  logging: {
    enabled: true,
    level: 'info', // info, debug, warn, error
    logFile: 'converter.log'
  }
};
