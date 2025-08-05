# Caso de Uso: Implementação de Importação de MusicXML

Este caso de uso demonstra como usar prompts do Copilot para implementar uma funcionalidade complexa dividindo-a em tarefas menores e mais gerenciáveis.

## Contexto

A aplicação de partitura musical precisa de uma funcionalidade para importar arquivos MusicXML, que atualmente não existe (conforme identificado no `FILE_INVENTORY.md` - "High Priority Missing Features: File Import/Export").

## Problema

Implementar a importação de MusicXML é uma tarefa complexa que envolve:
- Leitura de arquivos
- Parsing de XML
- Validação de dados
- Conversão para formato interno
- Integração com a UI
- Tratamento de erros

## Abordagem com Copilot

Em vez de pedir ao Copilot para "implementar a importação de MusicXML" (muito amplo), dividimos em etapas menores:

### Etapa 1: Criação da Estrutura Básica de Leitura de Arquivo

**Arquivo**: `src/utils/fileUtils.js`

```javascript
// Função assíncrona para ler o conteúdo de um arquivo selecionado pelo usuário como texto.
// Deve usar a API File ou FileReader do navegador.
// @param {File} file - O objeto File a ser lido.
// @returns {Promise<string>} Uma promessa que resolve com o conteúdo do arquivo como string.
async function readFileContent(file) {
    // Copilot, implement the file reading logic using FileReader.
    // Handle potential errors during file reading (file too large, read errors).
    // Add validation to ensure the file is not empty.
}

export { readFileContent };
```

**Resultado esperado**: O Copilot deve gerar uma implementação usando `FileReader` com tratamento de erros adequado.

### Etapa 2: Parsing do Conteúdo MusicXML

**Arquivo**: `src/parsers/musicXMLParser.js`

```javascript
// Função para parsear uma string XML de MusicXML em um objeto JavaScript.
// Deve usar DOMParser para parsing de XML e extrair informações musicais relevantes.
// @param {string} xmlString - A string contendo o conteúdo MusicXML.
// @returns {Object} O objeto JavaScript com dados estruturados da partitura.
function parseMusicXML(xmlString) {
    // Copilot, use DOMParser to parse the xmlString.
    // Extract key musical elements: title, composer, time signature, key signature, measures, notes.
    // Add error handling for invalid XML or missing required elements.
    // Return a structured object with properties: metadata, measures, notes.
}

// Função para validar se o XML é um MusicXML válido.
// @param {Document} xmlDoc - Documento XML parseado.
// @returns {boolean} True se é um MusicXML válido.
function validateMusicXML(xmlDoc) {
    // Copilot, implement validation for MusicXML structure.
    // Check for required root elements: score-partwise or score-timewise.
    // Verify presence of essential elements: part-list, part, measure.
}

export { parseMusicXML, validateMusicXML };
```

### Etapa 3: Conversão para Formato Interno

**Arquivo**: `src/converters/musicXMLConverter.js`

```javascript
// Função para converter dados parseados de MusicXML para o formato interno da aplicação.
// O formato interno deve ser compatível com o componente AdvancedSheetMusicOSMD.
// @param {Object} musicXMLData - Dados parseados do MusicXML.
// @returns {Object} Dados no formato interno da aplicação.
function convertToInternalFormat(musicXMLData) {
    // Copilot, convert MusicXML data to internal format.
    // Map MusicXML elements to internal data structure:
    // - measures -> internal measure format
    // - notes -> internal note format with timing and pitch
    // - metadata -> application metadata format
    // Ensure compatibility with existing OSMD integration.
}

// Função para normalizar durações de notas para o formato interno.
// @param {string} noteType - Tipo de nota do MusicXML (whole, half, quarter, etc.).
// @param {number} divisions - Divisões por quarter note.
// @returns {number} Duração normalizada.
function normalizeDuration(noteType, divisions) {
    // Copilot, implement duration normalization.
    // Convert MusicXML note types to decimal duration values.
    // Handle dotted notes and tuplets if present.
}

export { convertToInternalFormat, normalizeDuration };
```

### Etapa 4: Componente de UI para Upload

**Arquivo**: `src/components/MusicXMLUploader.jsx`

```javascript
// Componente React para upload de arquivo MusicXML.
// Deve ter um input de arquivo, área de drag-and-drop e botão de upload.
// Ao selecionar um arquivo, deve processar e chamar onFileLoaded com os dados convertidos.
import React, { useState, useCallback } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { Upload, FileMusic } from 'lucide-react';

const MusicXMLUploader = ({ onFileLoaded, onError }) => {
    // Copilot, implement the UI for MusicXML file upload.
    // Include:
    // - File input with accept=".xml,.musicxml"
    // - Drag and drop area with visual feedback
    // - Loading state during file processing
    // - Error display for invalid files
    // - Progress indicator for large files
    // Handle file selection, validation, and processing pipeline.
};

export default MusicXMLUploader;
```

### Etapa 5: Integração com o Sistema Principal

**Arquivo**: `src/services/musicXMLService.js`

```javascript
// Serviço principal para gerenciar importação de MusicXML.
// Coordena entre leitura de arquivo, parsing, conversão e validação.
import { readFileContent } from '../utils/fileUtils';
import { parseMusicXML, validateMusicXML } from '../parsers/musicXMLParser';
import { convertToInternalFormat } from '../converters/musicXMLConverter';

class MusicXMLService {
    // Copilot, implement a service class for MusicXML import workflow.
    // Include methods:
    // - importFile(file): complete import pipeline
    // - validateFile(file): pre-import validation
    // - processFile(xmlString): parsing and conversion
    // Add comprehensive error handling and progress reporting.
    // Ensure the service is testable and follows SOLID principles.
}

export default MusicXMLService;
```

### Etapa 6: Integração com o Componente Principal

**Arquivo**: `src/App.jsx` (modificação)

```javascript
// Adicionar funcionalidade de importação ao componente principal.
// Integrar o MusicXMLUploader e atualizar o estado da aplicação com novos dados.
import MusicXMLUploader from './components/MusicXMLUploader';
import MusicXMLService from './services/musicXMLService';

// Dentro do componente App:
const handleMusicXMLImport = useCallback(async (file) => {
    // Copilot, implement the import handler for the main App component.
    // Use MusicXMLService to process the file.
    // Update application state with imported sheet music data.
    // Handle loading states and error scenarios.
    // Integrate with existing AdvancedSheetMusicOSMD component.
}, []);
```

## Benefícios desta Abordagem

1. **Contexto Limitado**: Cada prompt foca em uma função ou componente específico
2. **Reutilização**: Funções utilitárias podem ser reutilizadas em outras partes
3. **Testabilidade**: Cada função pode ser testada independentemente
4. **Manutenibilidade**: Código modular é mais fácil de manter e debuggar
5. **Iteração**: Cada etapa pode ser refinada independentemente

## Prompts de Teste para Validação

Após implementar cada etapa, use prompts para gerar testes:

```javascript
// Para fileUtils.test.js
describe('readFileContent', () => {
    // Copilot, write comprehensive tests for readFileContent function.
    // Test scenarios: valid files, empty files, large files, read errors.
});

// Para musicXMLParser.test.js
describe('parseMusicXML', () => {
    // Copilot, write tests for MusicXML parsing.
    // Include test cases with sample MusicXML files and expected outputs.
});
```

## Considerações de Performance

Para arquivos grandes, considere adicionar:

```javascript
// Função para processar MusicXML em chunks para evitar bloqueio da UI.
// @param {string} xmlString - Conteúdo XML grande.
// @param {Function} progressCallback - Callback para reportar progresso.
async function processLargeMusicXML(xmlString, progressCallback) {
    // Copilot, implement chunked processing for large MusicXML files.
    // Use requestIdleCallback or setTimeout to yield control to the browser.
    // Report progress through the callback function.
}
```

Este caso de uso demonstra como uma funcionalidade complexa pode ser implementada de forma incremental usando o Copilot, mantendo cada prompt focado e específico.

