# Caso de Uso: Debugging de TypeError no calculateSheetMusicDuration

Este exemplo demonstra como usar o Copilot para debuggar um erro específico que está ocorrendo na aplicação.

## Contexto

Durante o desenvolvimento da aplicação de partitura musical, um `TypeError` está ocorrendo na função `calculateSheetMusicDuration`, impedindo o cálculo correto da duração das partituras.

## Problema Identificado

**Erro no Console**:
```
TypeError: Cannot read properties of undefined (reading 'duration') at calculateSheetMusicDuration (sheetMusicUtils.js:15)
```

**Código Problemático**:
```javascript
// src/utils/sheetMusicUtils.js
function calculateSheetMusicDuration(sheetMusicData) {
    let totalDuration = 0;
    
    // Linha 15 - onde o erro ocorre
    totalDuration += sheetMusicData.duration;
    
    if (sheetMusicData.measures) {
        sheetMusicData.measures.forEach(measure => {
            measure.notes.forEach(note => {
                totalDuration += note.duration;
            });
        });
    }
    
    return totalDuration;
}
```

## Abordagem de Debugging com Copilot

### Etapa 1: Análise Inicial do Erro

**Prompt para entender o erro**:

```javascript
// O seguinte erro está ocorrendo no console:
// TypeError: Cannot read properties of undefined (reading 'duration') at calculateSheetMusicDuration
// A função `calculateSheetMusicDuration` espera um objeto `sheetMusicData` com uma propriedade `duration`.
// Copilot, qual é a causa provável deste erro e como posso corrigi-lo?

function calculateSheetMusicDuration(sheetMusicData) {
    let totalDuration = 0;
    
    // Esta linha está causando o erro
    totalDuration += sheetMusicData.duration;
    
    // ... resto do código
}
```

**Resposta esperada do Copilot**: Identificação de que `sheetMusicData` é `undefined` ou `null`, sugestão de validação de entrada.

### Etapa 2: Implementação de Validação

**Prompt para adicionar validação**:

```javascript
// Adicione validação robusta para prevenir o TypeError.
// A função deve verificar se sheetMusicData existe e tem a estrutura esperada.
// Em caso de dados inválidos, retorne 0 ou lance um erro mais descritivo.
function calculateSheetMusicDuration(sheetMusicData) {
    // Copilot, add comprehensive input validation here.
    // Check for: null/undefined, missing properties, invalid data types.
    
    let totalDuration = 0;
    
    // Código original que estava falhando
    totalDuration += sheetMusicData.duration;
    
    if (sheetMusicData.measures) {
        sheetMusicData.measures.forEach(measure => {
            measure.notes.forEach(note => {
                totalDuration += note.duration;
            });
        });
    }
    
    return totalDuration;
}
```

### Etapa 3: Investigação da Origem dos Dados

**Prompt para rastrear a origem do problema**:

```javascript
// Investigar de onde vem o sheetMusicData undefined.
// Esta função é chamada por loadSheetMusic. Vamos adicionar logging para debuggar.
async function loadSheetMusic(musicId) {
    try {
        const response = await fetch(`/api/sheetmusic/${musicId}`);
        const data = await response.json();
        
        // Copilot, add debugging logs to trace data flow.
        // Log the response status, data structure, and any transformations.
        // Help identify where the data becomes undefined.
        
        const duration = calculateSheetMusicDuration(data);
        return { ...data, calculatedDuration: duration };
    } catch (error) {
        console.error('Error loading sheet music:', error);
        return null;
    }
}
```

### Etapa 4: Implementação de Solução Robusta

**Prompt para solução completa**:

```javascript
// Refatore a função para ser mais robusta e defensiva.
// Adicione validação, logging e tratamento de diferentes formatos de dados.
// A função deve funcionar mesmo com dados parciais ou malformados.
function calculateSheetMusicDuration(sheetMusicData) {
    // Copilot, implement a robust version of this function.
    // Handle edge cases:
    // - undefined/null input
    // - missing duration property
    // - missing measures array
    // - measures without notes
    // - notes without duration
    // - invalid duration values (negative, NaN)
    // Return 0 for invalid input and log warnings for debugging.
}
```

### Etapa 5: Criação de Testes para Prevenir Regressão

**Prompt para testes abrangentes**:

```javascript
// src/utils/sheetMusicUtils.test.js
import { calculateSheetMusicDuration } from './sheetMusicUtils';

describe('calculateSheetMusicDuration', () => {
    // Copilot, write comprehensive tests to prevent this TypeError from happening again.
    // Test cases should include:
    // - Valid sheet music data
    // - undefined/null input
    // - Missing duration property
    // - Missing measures array
    // - Empty measures array
    // - Measures with missing notes
    // - Notes with invalid durations
    // - Edge cases that caused the original bug
    
    it('should handle undefined input gracefully', () => {
        // Test the specific case that caused the original error
    });
});
```

### Etapa 6: Implementação de Monitoramento

**Prompt para adicionar monitoramento**:

```javascript
// Adicione monitoramento para detectar problemas similares no futuro.
// Use um sistema de logging ou error tracking para capturar erros relacionados.
function calculateSheetMusicDuration(sheetMusicData) {
    try {
        // Implementação validada
        return calculatedDuration;
    } catch (error) {
        // Copilot, implement error tracking and monitoring.
        // Log the error with context (input data, stack trace, user session).
        // Send error to monitoring service (e.g., Sentry, LogRocket).
        // Return a safe default value.
    }
}
```

## Solução Final Implementada

Após usar os prompts do Copilot, a solução final seria algo como:

```javascript
function calculateSheetMusicDuration(sheetMusicData) {
    // Validação de entrada
    if (!sheetMusicData || typeof sheetMusicData !== 'object') {
        console.warn('calculateSheetMusicDuration: Invalid input data', sheetMusicData);
        return 0;
    }
    
    let totalDuration = 0;
    
    // Adicionar duração base se existir
    if (typeof sheetMusicData.duration === 'number' && sheetMusicData.duration >= 0) {
        totalDuration += sheetMusicData.duration;
    }
    
    // Processar medidas se existirem
    if (Array.isArray(sheetMusicData.measures)) {
        sheetMusicData.measures.forEach((measure, measureIndex) => {
            if (measure && Array.isArray(measure.notes)) {
                measure.notes.forEach((note, noteIndex) => {
                    if (note && typeof note.duration === 'number' && note.duration >= 0) {
                        totalDuration += note.duration;
                    } else {
                        console.warn(`Invalid note duration at measure ${measureIndex}, note ${noteIndex}:`, note);
                    }
                });
            }
        });
    }
    
    return totalDuration;
}
```

## Lições Aprendidas

1. **Validação Defensiva**: Sempre validar entradas, especialmente em funções que processam dados externos
2. **Logging Estratégico**: Adicionar logs para rastrear o fluxo de dados e identificar problemas
3. **Testes Abrangentes**: Criar testes que cobrem casos extremos e situações de erro
4. **Monitoramento Proativo**: Implementar sistemas para detectar problemas em produção

## Prompts de Follow-up

Para garantir que o problema foi completamente resolvido:

```javascript
// Copilot, create a comprehensive error handling strategy for the entire sheet music loading pipeline.
// Include validation at each step: API response, data parsing, format conversion, and rendering.

// Copilot, suggest performance optimizations for calculateSheetMusicDuration when processing large scores.
// Consider caching, memoization, or incremental calculation strategies.
```

Este caso de uso demonstra como o Copilot pode ser usado não apenas para escrever código, mas também para debuggar problemas existentes de forma sistemática e criar soluções robustas.

