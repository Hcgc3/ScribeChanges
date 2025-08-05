/**
 * @fileoverview Utilitários para manipulação de arquivos na aplicação de partitura musical
 * @description Implementa leitura de arquivos seguindo as diretrizes do CUSTOM_PROMPT.md
 * @version 1.0.0
 * @created 4 de agosto de 2025
 */

/**
 * Função assíncrona para ler o conteúdo de um arquivo selecionado pelo usuário como texto.
 * Utiliza a API FileReader do navegador com tratamento de erros robusto.
 * 
 * @param {File} file - O objeto File a ser lido
 * @returns {Promise<string>} Uma promessa que resolve com o conteúdo do arquivo como string
 * @throws {Error} Quando o arquivo é inválido, muito grande ou ocorre erro de leitura
 */
export async function readFileContent(file) {
  return new Promise((resolve, reject) => {
    // Validação básica do arquivo
    if (!file) {
      reject(new Error('Nenhum arquivo fornecido'))
      return
    }

    // Verificar se o arquivo não está vazio
    if (file.size === 0) {
      reject(new Error('O arquivo está vazio'))
      return
    }

    // Verificar limite de tamanho (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / (1024 * 1024)}MB`))
      return
    }

    const reader = new FileReader()

    // Handler para sucesso na leitura
    reader.onload = (event) => {
      const content = event.target.result
      
      // Verificar se o conteúdo foi lido corretamente
      if (typeof content !== 'string') {
        reject(new Error('Erro na leitura: conteúdo inválido'))
        return
      }

      resolve(content)
    }

    // Handler para erro na leitura
    reader.onerror = () => {
      reject(new Error(`Erro ao ler o arquivo: ${reader.error?.message || 'Erro desconhecido'}`))
    }

    // Handler para cancelamento
    reader.onabort = () => {
      reject(new Error('Leitura do arquivo foi cancelada'))
    }

    // Iniciar a leitura como texto
    try {
      reader.readAsText(file, 'UTF-8')
    } catch (error) {
      reject(new Error(`Erro ao iniciar leitura: ${error.message}`))
    }
  })
}

/**
 * Valida se um arquivo tem extensão válida para MusicXML
 * 
 * @param {File} file - O arquivo a ser validado
 * @returns {boolean} True se a extensão é válida
 */
export function isValidMusicXMLFile(file) {
  if (!file || !file.name) return false
  
  const validExtensions = ['.xml', '.musicxml', '.mxl']
  const fileName = file.name.toLowerCase()
  
  return validExtensions.some(ext => fileName.endsWith(ext))
}

/**
 * Obtém informações básicas de um arquivo
 * 
 * @param {File} file - O arquivo para obter informações
 * @returns {Object} Objeto com informações do arquivo
 */
export function getFileInfo(file) {
  if (!file) return null

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified),
    extension: file.name.split('.').pop()?.toLowerCase() || ''
  }
}

/**
 * Formata o tamanho do arquivo em formato legível
 * 
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (ex: "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
