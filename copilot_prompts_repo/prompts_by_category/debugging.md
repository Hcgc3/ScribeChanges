# Prompts para Resolução de Problemas e Debugging

Esta categoria aborda prompts para identificar e corrigir bugs, entender mensagens de erro e implementar soluções robustas. O Copilot pode ser um aliado valioso na depuração, sugerindo causas e correções para problemas comuns e complexos, especialmente quando o contexto do erro é fornecido.

## Cenário 1: Entendimento e Correção de um Erro Específico

**Objetivo**: Obter uma explicação para uma mensagem de erro e sugestões de correção.

**Contexto**: Você encontrou um erro no console e precisa de ajuda para entender a causa e como resolvê-lo.

**Prompt Exemplo (no código ou como comentário geral)**:

```javascript
// O seguinte erro está ocorrendo no console:
// TypeError: Cannot read properties of undefined (reading 'duration') at calculateSheetMusicDuration
// A função `calculateSheetMusicDuration` espera um objeto `sheetMusicData` com uma propriedade `duration`.
// Copilot, qual é a causa provável deste erro e como posso corrigi-lo?

function calculateSheetMusicDuration(sheetMusicData) {
    // Linha onde o erro ocorre
    return sheetMusicData.duration + sheetMusicData.extraTime;
}
```

**Insights Adicionais**: Forneça a mensagem de erro exata e o contexto onde ela ocorre (nome da função, linha, se possível). O Copilot pode inferir que `sheetMusicData` é `undefined` ou não possui a propriedade `duration` e sugerir verificações de nulidade ou validação de entrada.

## Cenário 2: Depuração de Lógica Incorreta

**Objetivo**: Identificar a causa de um comportamento inesperado e sugerir uma correção.

**Contexto**: Uma função está retornando um valor incorreto ou se comportando de forma diferente do esperado.

**Prompt Exemplo (no código)**:

```javascript
// A função `updateTempo` deveria ajustar o tempo da partitura, mas o valor final está sempre incorreto.
// Entrada esperada: currentTempo=120, newTempo=140
// Saída esperada: 140
// Saída atual: 260 (parece estar somando em vez de substituir)
// Copilot, revise esta função e sugira onde o erro pode estar e como corrigi-lo.
function updateTempo(currentTempo, newTempo) {
    let updatedTempo = currentTempo;
    updatedTempo += newTempo; // Suspeito que este é o problema
    return updatedTempo;
}
```

**Insights Adicionais**: Descreva o comportamento esperado e o comportamento atual. O Copilot pode analisar a lógica da função e apontar para erros comuns como operações matemáticas incorretas, condições de loop erradas ou lógica invertida.

## Cenário 3: Debugging de Problemas de Performance

**Objetivo**: Identificar gargalos de performance e sugerir otimizações.

**Contexto**: Uma parte da aplicação está lenta, especialmente ao renderizar partituras grandes.

**Prompt Exemplo (no código)**:

```javascript
// Este loop está causando lentidão na renderização de partituras grandes.
// Ele itera sobre milhares de notas para calcular suas posições.
// O tempo de execução cresce exponencialmente com o número de notas.
// Copilot, identifique o gargalo e sugira uma forma mais eficiente.
function calculateNotePositions(notes) {
    const positions = [];
    for (let i = 0; i < notes.length; i++) {
        for (let j = 0; j < notes.length; j++) { // Suspeito loop aninhado desnecessário
            if (notes[i].measure === notes[j].measure) {
                // Cálculo complexo executado muitas vezes
                const position = complexCalculation(notes[i], notes[j]);
                positions.push(position);
            }
        }
    }
    return positions;
}
```

## Cenário 4: Debugging de Problemas de Estado (React/Vue)

**Objetivo**: Resolver problemas relacionados ao gerenciamento de estado em componentes.

**Prompt Exemplo (no código)**:

```javascript
// Este componente React não está atualizando quando o estado muda.
// O `isPlaying` deveria alternar entre true/false, mas a UI não reflete a mudança.
// Copilot, identifique por que o re-render não está acontecendo.
function PlaybackControls() {
    let isPlaying = false; // Suspeito que deveria usar useState
    
    const handlePlayPause = () => {
        isPlaying = !isPlaying; // Suspeito que esta mudança não está sendo detectada
        console.log('isPlaying:', isPlaying); // Log mostra valor correto
    };
    
    return (
        <button onClick={handlePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
        </button>
    );
}
```

## Cenário 5: Debugging de Problemas de Async/Await

**Objetivo**: Resolver problemas com código assíncrono que não está funcionando como esperado.

**Prompt Exemplo (no código)**:

```javascript
// Esta função assíncrona não está aguardando corretamente.
// Às vezes retorna undefined, outras vezes retorna os dados corretos.
// Copilot, identifique o problema com o tratamento assíncrono.
async function loadSheetMusic(id) {
    try {
        const response = fetch(`/api/sheetmusic/${id}`); // Suspeito: falta await
        const data = response.json(); // Suspeito: falta await
        return data;
    } catch (error) {
        console.error('Error loading sheet music:', error);
        return null;
    }
}
```

## Cenário 6: Debugging de Memory Leaks

**Objetivo**: Identificar e corrigir vazamentos de memória.

**Prompt Exemplo (no código)**:

```javascript
// Esta função está causando vazamento de memória.
// A memória continua crescendo mesmo após parar a reprodução.
// Copilot, identifique possíveis vazamentos e sugira correções.
function startAudioPlayback(audioContext) {
    const interval = setInterval(() => {
        // Processamento de áudio contínuo
        processAudioFrame(audioContext);
    }, 16); // 60 FPS
    
    // Suspeito: interval nunca é limpo
    // Suspeito: listeners não são removidos
    audioContext.addEventListener('statechange', handleStateChange);
    
    return {
        stop: () => {
            // Função de parada incompleta?
            console.log('Stopping playback...');
        }
    };
}
```

## Cenário 7: Debugging de Problemas de Cross-Browser

**Objetivo**: Resolver problemas que ocorrem apenas em navegadores específicos.

**Prompt Exemplo (no código)**:

```javascript
// Este código funciona no Chrome mas falha no Safari.
// Erro no Safari: "TypeError: audioContext.createGain is not a function"
// Copilot, identifique problemas de compatibilidade e sugira correções.
function createAudioNodes() {
    const audioContext = new AudioContext();
    const gainNode = audioContext.createGain(); // Falha no Safari
    const analyser = audioContext.createAnalyser();
    
    return { audioContext, gainNode, analyser };
}
```

## Cenário 8: Debugging de Problemas de Concorrência

**Objetivo**: Resolver problemas relacionados a condições de corrida ou acesso concorrente.

**Prompt Exemplo (no código)**:

```javascript
// Esta função às vezes falha com "Cannot read property of undefined".
// Suspeito que há uma condição de corrida entre múltiplas chamadas.
// Copilot, identifique o problema de concorrência e sugira uma solução.
let currentAudioData = null;

async function processAudio(newAudioData) {
    currentAudioData = newAudioData; // Suspeito: pode ser sobrescrito
    
    // Processamento assíncrono longo
    await heavyProcessing(currentAudioData); // Suspeito: currentAudioData pode ter mudado
    
    // Uso do resultado
    return currentAudioData.processedResult; // Falha aqui às vezes
}
```

## Cenário 9: Debugging com Console e Logging

**Objetivo**: Adicionar logging estratégico para identificar problemas.

**Prompt Exemplo (no código)**:

```javascript
// Adicione logs estratégicos para debuggar este fluxo complexo.
// Preciso rastrear: entrada de dados, transformações, e saída final.
// Copilot, adicione console.log em pontos estratégicos para debugging.
function complexDataTransformation(inputData) {
    const step1 = validateInput(inputData);
    const step2 = transformData(step1);
    const step3 = enrichData(step2);
    const step4 = finalizeData(step3);
    return step4;
}
```

## Cenário 10: Debugging de Problemas de Event Listeners

**Objetivo**: Resolver problemas com event listeners que não estão funcionando ou causando vazamentos.

**Prompt Exemplo (no código)**:

```javascript
// Os event listeners não estão sendo removidos corretamente.
// Múltiplos listeners são adicionados a cada re-render.
// Copilot, corrija o gerenciamento de event listeners.
function setupKeyboardShortcuts() {
    const handleKeyPress = (event) => {
        if (event.key === ' ') {
            togglePlayback();
        }
    };
    
    // Suspeito: listener é adicionado múltiplas vezes
    document.addEventListener('keydown', handleKeyPress);
    
    // Suspeito: cleanup não está funcionando
    return () => {
        document.removeEventListener('keydown', handleKeyPress);
    };
}
```

## Dicas para Prompts de Debugging Eficazes

1. **Forneça a mensagem de erro exata**: Copie e cole a mensagem completa
2. **Descreva o comportamento esperado vs atual**: Seja específico sobre a diferença
3. **Inclua dados de entrada**: Forneça exemplos dos dados que causam o problema
4. **Mencione o ambiente**: Navegador, versão do Node.js, sistema operacional
5. **Indique quando o problema ocorre**: Sempre, às vezes, em condições específicas
6. **Sugira suspeitas**: Se você tem ideias sobre a causa, mencione-as
7. **Inclua código relacionado**: Mostre funções que chamam ou são chamadas pela função problemática

