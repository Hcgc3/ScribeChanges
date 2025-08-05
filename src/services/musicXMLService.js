/**
 * @fileoverview Serviço principal para gerenciar importação de MusicXML
 * @description Coordena entre leitura de arquivo, parsing, conversão e validação
 * @version 1.0.0
 * @created 4 de agosto de 2025
 */

import { readFileContent, isValidMusicXMLFile, getFileInfo } from '../utils/fileUtils.js'
import { parseMusicXML, validateMusicXML } from '../parsers/musicXMLParser.js'

/**
 * Serviço principal para gerenciar importação de MusicXML.
 * Implementa o pipeline completo de importação seguindo as diretrizes do CUSTOM_PROMPT.md
 */
class MusicXMLService {
  constructor() {
    this.isProcessing = false
    this.currentProgress = 0
    this.progressCallbacks = new Set()
  }

  /**
   * Adiciona callback para monitorar progresso
   * 
   * @param {Function} callback - Função que recebe o progresso (0-100)
   */
  onProgress(callback) {
    this.progressCallbacks.add(callback)
    return () => this.progressCallbacks.delete(callback)
  }

  /**
   * Reporta progresso para todos os callbacks registrados
   * 
   * @param {number} progress - Progresso atual (0-100)
   * @param {string} message - Mensagem descritiva do progresso
   */
  reportProgress(progress, message = '') {
    this.currentProgress = progress
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ progress, message })
      } catch (error) {
        console.warn('Erro em callback de progresso:', error)
      }
    })
  }

  /**
   * Pipeline completo de importação de arquivo MusicXML
   * 
   * @param {File} file - Arquivo MusicXML a ser importado
   * @returns {Promise<Object>} Dados processados da partitura
   * @throws {Error} Em caso de erro na importação
   */
  async importFile(file) {
    if (this.isProcessing) {
      throw new Error('Já existe uma importação em andamento')
    }

    this.isProcessing = true
    this.reportProgress(0, 'Iniciando importação...')

    try {
      // Etapa 1: Validação pré-importação
      this.reportProgress(10, 'Validando arquivo...')
      await this.validateFile(file)

      // Etapa 2: Leitura do arquivo
      this.reportProgress(25, 'Lendo conteúdo do arquivo...')
      const xmlContent = await readFileContent(file)

      // Etapa 3: Parsing e conversão
      this.reportProgress(50, 'Processando MusicXML...')
      const processedData = await this.processFile(xmlContent)

      // Etapa 4: Validação final
      this.reportProgress(80, 'Validando dados processados...')
      const validatedData = this.validateProcessedData(processedData)

      // Etapa 5: Finalização
      this.reportProgress(100, 'Importação concluída com sucesso!')

      return {
        ...validatedData,
        fileInfo: getFileInfo(file),
        importedAt: new Date().toISOString(),
        success: true
      }

    } catch (error) {
      this.reportProgress(0, `Erro na importação: ${error.message}`)
      throw new Error(`Falha na importação: ${error.message}`)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Validação pré-importação do arquivo
   * 
   * @param {File} file - Arquivo a ser validado
   * @returns {Promise<boolean>} True se válido
   * @throws {Error} Se arquivo inválido
   */
  async validateFile(file) {
    // Verificar se o arquivo existe
    if (!file) {
      throw new Error('Nenhum arquivo fornecido')
    }

    // Verificar extensão
    if (!isValidMusicXMLFile(file)) {
      throw new Error('Tipo de arquivo inválido. Use arquivos .xml, .musicxml ou .mxl')
    }

    // Verificar tamanho
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      throw new Error(`Arquivo muito grande. Máximo: ${MAX_SIZE / (1024 * 1024)}MB`)
    }

    // Verificar se não está vazio
    if (file.size === 0) {
      throw new Error('Arquivo está vazio')
    }

    return true
  }

  /**
   * Processamento do conteúdo MusicXML
   * 
   * @param {string} xmlString - Conteúdo XML a ser processado
   * @returns {Promise<Object>} Dados parseados e convertidos
   * @throws {Error} Em caso de erro no processamento
   */
  async processFile(xmlString) {
    try {
      // Verificar se o conteúdo não está vazio
      if (!xmlString || xmlString.trim().length === 0) {
        throw new Error('Conteúdo do arquivo está vazio')
      }

      // Parsing do MusicXML
      this.reportProgress(60, 'Parseando estrutura musical...')
      const parsedData = parseMusicXML(xmlString)

      // Conversão para formato interno
      this.reportProgress(70, 'Convertendo para formato interno...')
      const convertedData = this.convertToInternalFormat(parsedData)

      return {
        ...parsedData,
        internalFormat: convertedData,
        rawXML: xmlString
      }

    } catch (error) {
      throw new Error(`Erro no processamento: ${error.message}`)
    }
  }

  /**
   * Converte dados parseados para formato interno da aplicação
   * 
   * @param {Object} musicXMLData - Dados parseados do MusicXML
   * @returns {Object} Dados no formato interno
   */
  convertToInternalFormat(musicXMLData) {
    const { metadata, parts, totalMeasures, totalNotes } = musicXMLData

    return {
      // Metadata para a aplicação
      title: metadata.title || 'Partitura Importada',
      composer: metadata.composer || 'Compositor Desconhecido',
      
      // Informações estruturais
      structure: {
        partCount: parts.length,
        measureCount: totalMeasures,
        noteCount: totalNotes
      },

      // Dados musicais simplificados para OSMD
      musicData: {
        parts: parts.map(part => ({
          id: part.id,
          name: part.name,
          measures: part.measures.map(measure => ({
            number: measure.number,
            notes: measure.notes.length,
            duration: this.calculateMeasureDuration(measure)
          }))
        }))
      },

      // Configurações para reprodução
      playbackConfig: {
        defaultTempo: 120,
        timeSignature: this.extractTimeSignature(parts[0]?.measures[0]),
        keySignature: this.extractKeySignature(parts[0]?.measures[0])
      }
    }
  }

  /**
   * Calcula duração estimada de um compasso
   * 
   * @param {Object} measure - Objeto de compasso
   * @returns {number} Duração em beats
   */
  calculateMeasureDuration(measure) {
    if (!measure.notes || measure.notes.length === 0) return 4 // Padrão 4/4

    const totalDuration = measure.notes.reduce((sum, note) => {
      return sum + (note.duration || 1)
    }, 0)

    return totalDuration / (measure.attributes?.divisions || 1)
  }

  /**
   * Extrai fórmula de compasso do primeiro compasso
   * 
   * @param {Object} measure - Primeiro compasso
   * @returns {string} Fórmula de compasso (ex: "4/4")
   */
  extractTimeSignature(measure) {
    return measure?.attributes?.timeSignature || '4/4'
  }

  /**
   * Extrai armadura de clave do primeiro compasso
   * 
   * @param {Object} measure - Primeiro compasso
   * @returns {number} Número de alterações (-7 a +7)
   */
  extractKeySignature(measure) {
    return measure?.attributes?.keySignature || 0
  }

  /**
   * Validação final dos dados processados
   * 
   * @param {Object} processedData - Dados processados
   * @returns {Object} Dados validados
   * @throws {Error} Se dados inválidos
   */
  validateProcessedData(processedData) {
    if (!processedData) {
      throw new Error('Dados processados estão vazios')
    }

    if (!processedData.parts || processedData.parts.length === 0) {
      throw new Error('Nenhuma parte musical encontrada')
    }

    if (!processedData.metadata) {
      throw new Error('Metadata ausente')
    }

    // Verificar se há pelo menos uma nota em alguma parte
    const hasNotes = processedData.parts.some(part => 
      part.measures && part.measures.some(measure => 
        measure.notes && measure.notes.length > 0
      )
    )

    if (!hasNotes) {
      console.warn('Aviso: Nenhuma nota encontrada na partitura')
    }

    return processedData
  }

  /**
   * Obtém estatísticas do processo de importação
   * 
   * @returns {Object} Estatísticas do serviço
   */
  getStats() {
    return {
      isProcessing: this.isProcessing,
      currentProgress: this.currentProgress,
      hasActiveCallbacks: this.progressCallbacks.size > 0
    }
  }

  /**
   * Limpa todos os callbacks de progresso
   */
  clearProgressCallbacks() {
    this.progressCallbacks.clear()
  }
}

// Instância singleton do serviço
const musicXMLService = new MusicXMLService()

export default musicXMLService
