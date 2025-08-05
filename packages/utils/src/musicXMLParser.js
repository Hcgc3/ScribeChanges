/**
 * @fileoverview Parser de MusicXML para aplicação de partitura musical
 * @description Implementa parsing de MusicXML seguindo as diretrizes do CUSTOM_PROMPT.md
 * @version 1.0.0
 * @created 4 de agosto de 2025
 */

/**
 * Função para parsear uma string XML de MusicXML em um objeto JavaScript.
 * Utiliza DOMParser para parsing de XML e extrai informações musicais relevantes.
 * 
 * @param {string} xmlString - A string contendo o conteúdo MusicXML
 * @returns {Object} O objeto JavaScript com dados estruturados da partitura
 * @throws {Error} Quando o XML é inválido ou elementos obrigatórios estão ausentes
 */
export function parseMusicXML(xmlString) {
  try {
    // Criar parser DOM
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    // Verificar se houve erro no parsing
    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error(`Erro de parsing XML: ${parserError.textContent}`)
    }

    // Validar estrutura MusicXML
    if (!validateMusicXML(xmlDoc)) {
      throw new Error('Arquivo não é um MusicXML válido')
    }

    // Extrair metadata
    const metadata = extractMetadata(xmlDoc)
    
    // Extrair informações musicais
    const musicData = extractMusicData(xmlDoc)

    return {
      metadata,
      ...musicData,
      isValid: true,
      parsedAt: new Date().toISOString()
    }

  } catch (error) {
    throw new Error(`Erro ao parsear MusicXML: ${error.message}`)
  }
}

/**
 * Função para validar se o XML é um MusicXML válido.
 * Verifica elementos raiz e estrutura essencial.
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {boolean} True se é um MusicXML válido
 */
export function validateMusicXML(xmlDoc) {
  if (!xmlDoc) return false

  // Verificar elemento raiz
  const rootElement = xmlDoc.documentElement
  if (!rootElement) return false

  const validRoots = ['score-partwise', 'score-timewise']
  if (!validRoots.includes(rootElement.tagName)) {
    return false
  }

  // Verificar elementos essenciais
  const partList = xmlDoc.querySelector('part-list')
  if (!partList) return false

  const parts = xmlDoc.querySelectorAll('part')
  if (parts.length === 0) return false

  // Verificar se existe pelo menos uma medida
  const measures = xmlDoc.querySelectorAll('measure')
  if (measures.length === 0) return false

  return true
}

/**
 * Extrai metadata do documento MusicXML
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {Object} Objeto com metadata da partitura
 */
function extractMetadata(xmlDoc) {
  const metadata = {
    title: '',
    composer: '',
    lyricist: '',
    copyright: '',
    software: '',
    encoding: ''
  }

  // Extrair título
  const workTitle = xmlDoc.querySelector('work work-title')
  if (workTitle) {
    metadata.title = workTitle.textContent.trim()
  }

  // Extrair informações de identificação
  const identification = xmlDoc.querySelector('identification')
  if (identification) {
    // Compositor
    const composer = identification.querySelector('creator[type="composer"]')
    if (composer) {
      metadata.composer = composer.textContent.trim()
    }

    // Letrista
    const lyricist = identification.querySelector('creator[type="lyricist"]')
    if (lyricist) {
      metadata.lyricist = lyricist.textContent.trim()
    }

    // Copyright
    const rights = identification.querySelector('rights')
    if (rights) {
      metadata.copyright = rights.textContent.trim()
    }

    // Software
    const encoding = identification.querySelector('encoding software')
    if (encoding) {
      metadata.software = encoding.textContent.trim()
    }
  }

  return metadata
}

/**
 * Extrai dados musicais do documento MusicXML
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {Object} Objeto com dados musicais estruturados
 */
function extractMusicData(xmlDoc) {
  const parts = []
  const partElements = xmlDoc.querySelectorAll('part')

  partElements.forEach((partElement, index) => {
    const partId = partElement.getAttribute('id') || `P${index + 1}`
    
    // Encontrar informações da parte na part-list
    const scorePartSelector = `score-part[id="${partId}"]`
    const scorePart = xmlDoc.querySelector(scorePartSelector)
    
    const partName = scorePart?.querySelector('part-name')?.textContent.trim() || `Parte ${index + 1}`

    // Extrair compassos
    const measures = extractMeasures(partElement)

    parts.push({
      id: partId,
      name: partName,
      measures,
      noteCount: measures.reduce((total, measure) => total + measure.notes.length, 0)
    })
  })

  // Calcular estatísticas gerais
  const totalMeasures = parts.length > 0 ? parts[0].measures.length : 0
  const totalNotes = parts.reduce((total, part) => total + part.noteCount, 0)

  return {
    parts,
    totalMeasures,
    totalNotes,
    partCount: parts.length
  }
}

/**
 * Extrai compassos de uma parte
 * 
 * @param {Element} partElement - Elemento XML da parte
 * @returns {Array} Array de objetos de compasso
 */
function extractMeasures(partElement) {
  const measures = []
  const measureElements = partElement.querySelectorAll('measure')

  measureElements.forEach((measureElement) => {
    const measureNumber = parseInt(measureElement.getAttribute('number')) || 1
    
    // Extrair atributos do compasso (clave, armadura, tempo)
    const attributes = extractMeasureAttributes(measureElement)
    
    // Extrair notas
    const notes = extractNotes(measureElement)

    measures.push({
      number: measureNumber,
      attributes,
      notes,
      noteCount: notes.length
    })
  })

  return measures
}

/**
 * Extrai atributos de um compasso
 * 
 * @param {Element} measureElement - Elemento XML do compasso
 * @returns {Object} Objeto com atributos do compasso
 */
function extractMeasureAttributes(measureElement) {
  const attributes = {}
  const attributesElement = measureElement.querySelector('attributes')

  if (attributesElement) {
    // Divisões
    const divisions = attributesElement.querySelector('divisions')
    if (divisions) {
      attributes.divisions = parseInt(divisions.textContent)
    }

    // Armadura de clave
    const key = attributesElement.querySelector('key fifths')
    if (key) {
      attributes.keySignature = parseInt(key.textContent)
    }

    // Fórmula de compasso
    const time = attributesElement.querySelector('time')
    if (time) {
      const beats = time.querySelector('beats')?.textContent
      const beatType = time.querySelector('beat-type')?.textContent
      if (beats && beatType) {
        attributes.timeSignature = `${beats}/${beatType}`
      }
    }

    // Clave
    const clef = attributesElement.querySelector('clef')
    if (clef) {
      const sign = clef.querySelector('sign')?.textContent
      const line = clef.querySelector('line')?.textContent
      if (sign) {
        attributes.clef = { sign, line: line ? parseInt(line) : undefined }
      }
    }
  }

  return attributes
}

/**
 * Extrai notas de um compasso
 * 
 * @param {Element} measureElement - Elemento XML do compasso
 * @returns {Array} Array de objetos de nota
 */
function extractNotes(measureElement) {
  const notes = []
  const noteElements = measureElement.querySelectorAll('note')

  noteElements.forEach((noteElement) => {
    const note = {}

    // Altura da nota
    const pitch = noteElement.querySelector('pitch')
    if (pitch) {
      const step = pitch.querySelector('step')?.textContent
      const octave = pitch.querySelector('octave')?.textContent
      const alter = pitch.querySelector('alter')?.textContent

      note.pitch = {
        step,
        octave: octave ? parseInt(octave) : undefined,
        alter: alter ? parseInt(alter) : 0
      }
    } else {
      // Pode ser uma pausa
      const rest = noteElement.querySelector('rest')
      if (rest) {
        note.isRest = true
      }
    }

    // Duração
    const duration = noteElement.querySelector('duration')
    if (duration) {
      note.duration = parseInt(duration.textContent)
    }

    // Tipo de nota
    const type = noteElement.querySelector('type')
    if (type) {
      note.type = type.textContent
    }

    notes.push(note)
  })

  return notes
}
