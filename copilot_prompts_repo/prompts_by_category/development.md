# Prompts para Desenvolvimento de Novas Funcionalidades

Esta seção foca em prompts para auxiliar na criação de novas partes do código, desde funções simples até componentes mais complexos. O objetivo é acelerar o processo de codificação e garantir a adesão a padrões.

## Cenário 1: Criação de uma Nova Função/Método

**Objetivo**: Gerar o esqueleto de uma função com base em sua descrição e tipo de retorno esperado.

**Contexto**: Você está em um arquivo `.js` ou `.ts` e precisa adicionar uma nova função para processar dados de partitura.

**Prompt Exemplo (no código)**:

```javascript
// Função para calcular a duração total de uma partitura em segundos, considerando o tempo e a métrica.
// @param {Object} sheetMusicData - Dados da partitura, incluindo notas e durações.
// @returns {number} Duração total em segundos.
function calculateSheetMusicDuration(sheetMusicData) {
    // Copilot, complete this function based on the description above.
}
```

**Insights Adicionais**: O Copilot usará os comentários JSDoc para entender os parâmetros e o tipo de retorno, gerando um código mais preciso. Para funções mais complexas, adicione exemplos de entrada/saída nos comentários.

## Cenário 2: Implementação de um Componente UI (React/Vue/Angular)

**Objetivo**: Criar um componente de interface de usuário com base em sua descrição e propriedades.

**Contexto**: Você está em um arquivo `.jsx` ou `.tsx` e precisa de um novo componente para exibir controles de reprodução magnéticos.

**Prompt Exemplo (no código)**:

```javascript
// Componente React para controles de reprodução de música (play, pause, volume, tempo).
// Deve ser um widget magnético que pode ser arrastado na tela.
// @param {boolean} isPlaying - Estado de reprodução atual.
// @param {function} onPlayPause - Callback para alternar play/pause.
// @param {number} volume - Volume atual (0-100).
// @param {function} onVolumeChange - Callback para mudança de volume.
// @param {number} tempo - Tempo atual (BPM).
// @param {function} onTempoChange - Callback para mudança de tempo.
import React from 'react';
import { Button, Slider } from '@/components/ui'; // Assumindo componentes UI de uma biblioteca como Shadcn UI

const MagneticPlaybackControls = ({ isPlaying, onPlayPause, volume, onVolumeChange, tempo, onTempoChange }) => {
    // Copilot, implement the UI and logic for these playback controls.
    // Include icons for play/pause and a slider for volume and tempo.
};

export default MagneticPlaybackControls;
```

**Insights Adicionais**: Ao importar componentes de UI de uma biblioteca específica (como `shadcn/ui` ou `Material-UI`), o Copilot pode inferir o uso correto desses componentes e gerar o JSX/TSX apropriado. Mencionar que é um widget magnético também ajuda o Copilot a inferir a necessidade de lógica de arrastar e soltar.

## Cenário 3: Integração com APIs Existentes

**Objetivo**: Gerar código para interagir com uma API RESTful existente, como buscar dados de partituras ou salvar configurações do usuário.

**Contexto**: Você precisa integrar a aplicação com um endpoint de API para carregar partituras.

**Prompt Exemplo (no código)**:

```javascript
// Função assíncrona para buscar uma partitura específica da API.
// O endpoint é `/api/sheetmusic/{id}` e espera um ID de partitura.
// Deve usar `fetch` ou `axios` e retornar os dados da partitura ou lançar um erro.
// @param {string} sheetMusicId - O ID único da partitura a ser buscada.
// @returns {Promise<Object>} Uma promessa que resolve com os dados da partitura.
async function fetchSheetMusicById(sheetMusicId) {
    // Copilot, implement the API call to retrieve sheet music data.
    // Handle loading states and potential network errors.
}
```

**Insights Adicionais**: Ao especificar o método HTTP (`fetch` ou `axios`), o endpoint, os parâmetros e o tipo de retorno, você fornece ao Copilot informações suficientes para gerar a chamada de API correta. Mencionar o tratamento de erros e estados de carregamento direciona o Copilot para uma implementação mais robusta.

## Cenário 4: Criação de Custom Hooks (React)

**Objetivo**: Criar um hook personalizado para encapsular lógica reutilizável.

**Prompt Exemplo (no código)**:

```javascript
// Custom hook para gerenciar o estado de reprodução de música.
// Deve retornar: isPlaying, currentTime, duration, play, pause, seek
// Deve usar useRef para o elemento de áudio e useEffect para listeners
import { useState, useRef, useEffect } from 'react';

function useAudioPlayer(audioSrc) {
    // Copilot, implement a custom hook for audio playback management.
    // Include play, pause, seek functionality and time tracking.
}

export default useAudioPlayer;
```

## Cenário 5: Implementação de Classes/Serviços

**Objetivo**: Criar uma classe para encapsular lógica complexa de negócio.

**Prompt Exemplo (no código)**:

```javascript
// Classe para gerenciar o motor de áudio da aplicação de partitura.
// Deve usar Tone.js para síntese de áudio e reprodução de notas.
// Métodos necessários: playNote, stopNote, setTempo, setVolume
import * as Tone from 'tone';

class AudioEngine {
    // Copilot, implement an audio engine class using Tone.js.
    // Include methods for note playback, tempo control, and volume management.
    constructor() {
        // Initialize Tone.js components
    }
}

export default AudioEngine;
```

## Cenário 6: Criação de Utilitários e Helpers

**Objetivo**: Implementar funções utilitárias que podem ser reutilizadas em todo o projeto.

**Prompt Exemplo (no código)**:

```javascript
// Utilitário para converter notas musicais em frequências.
// Deve suportar notação americana (C, D, E, F, G, A, B) e oitavas (0-8).
// @param {string} note - Nota musical (ex: "C4", "A#3", "Bb5")
// @returns {number} Frequência em Hz
function noteToFrequency(note) {
    // Copilot, implement note to frequency conversion.
    // Handle sharps (#) and flats (b) notation.
}

// Utilitário para validar dados de partitura MusicXML.
// @param {Object} musicXMLData - Dados parseados do MusicXML
// @returns {boolean} True se os dados são válidos
function validateMusicXMLData(musicXMLData) {
    // Copilot, implement validation for MusicXML data structure.
    // Check for required fields: measures, notes, time signature, key signature.
}
```

## Cenário 7: Implementação de Middleware/Interceptors

**Objetivo**: Criar middleware para interceptar e processar requisições ou dados.

**Prompt Exemplo (no código)**:

```javascript
// Middleware para interceptar erros de API e mostrar notificações ao usuário.
// Deve capturar erros HTTP e mostrar mensagens amigáveis.
// @param {Error} error - Erro capturado
// @param {Function} showNotification - Função para mostrar notificação
function apiErrorMiddleware(error, showNotification) {
    // Copilot, implement error handling middleware.
    // Map HTTP status codes to user-friendly messages.
}

// Interceptor para adicionar token de autenticação em requisições.
// @param {Object} config - Configuração da requisição
// @returns {Object} Configuração modificada com token
function authInterceptor(config) {
    // Copilot, implement authentication interceptor.
    // Add Authorization header with Bearer token from localStorage.
}
```

## Dicas para Prompts de Desenvolvimento Eficazes

1. **Seja específico sobre o framework/biblioteca**: Mencione React, Vue, Angular, etc.
2. **Defina interfaces claras**: Use TypeScript ou JSDoc para tipos
3. **Inclua dependências**: Mencione bibliotecas que devem ser usadas
4. **Especifique padrões**: Indique se deve seguir algum padrão específico (MVC, MVVM, etc.)
5. **Mencione tratamento de erros**: Sempre inclua considerações sobre error handling
6. **Indique testes**: Se aplicável, mencione que a função deve ser testável

