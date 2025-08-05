# Prompts para Manutenção e Refatoração de Código

Esta seção foca em prompts para auxiliar na melhoria da qualidade do código existente, otimização de performance, refatoração de seções complexas e garantia da legibilidade. Isso é crucial para a longevidade e a sustentabilidade do projeto, especialmente em bases de código grandes.

## Cenário 1: Refatoração de uma Função Existente para Melhorar a Legibilidade/Performance

**Objetivo**: Simplificar uma função complexa ou otimizar seu desempenho.

**Contexto**: Você tem uma função que processa eventos de áudio e está se tornando difícil de ler e manter.

**Prompt Exemplo (no código)**:

```javascript
// Esta função `processAudioEvents` está muito longa e complexa.
// Refatore-a para melhorar a legibilidade, dividindo-a em funções menores e mais focadas.
// O objetivo é que cada sub-função tenha uma única responsabilidade.
function processAudioEvents(audioData, eventQueue) {
    // ... código existente complexo ...

    // Copilot, refactor this function into smaller, more readable parts.
    // Ensure all existing functionality is preserved.
}
```

**Insights Adicionais**: Ao indicar explicitamente o objetivo (melhorar legibilidade, dividir em funções menores) e a garantia (preservar funcionalidade existente), você guia o Copilot. Para otimização de performance, você pode adicionar comentários como `// Otimize esta seção para reduzir o tempo de execução em 20%`.

## Cenário 2: Adição de Tratamento de Erros a um Bloco de Código

**Objetivo**: Tornar um bloco de código mais robusto adicionando tratamento de erros.

**Contexto**: Uma seção do código que interage com o sistema de arquivos ou uma API externa não possui tratamento de erros adequado.

**Prompt Exemplo (no código)**:

```javascript
// O código abaixo pode falhar se o arquivo não for encontrado ou se houver um erro de permissão.
// Adicione um bloco try-catch para lidar com possíveis exceções.
// Em caso de erro, registre a mensagem de erro e retorne um valor padrão ou lance um erro mais específico.
async function loadConfiguration(filePath) {
    const config = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(config);
    // Copilot, add robust error handling here.
}
```

**Insights Adicionais**: Especificar o tipo de erro a ser tratado (arquivo não encontrado, permissão) e a ação desejada em caso de erro (registrar, retornar padrão, lançar erro específico) ajuda o Copilot a gerar o `try-catch` apropriado.

## Cenário 3: Atualização de Dependências ou Padrões de Código

**Objetivo**: Modernizar o código para usar novas sintaxes ou APIs de bibliotecas atualizadas.

**Contexto**: Você está atualizando uma biblioteca de UI e precisa adaptar o uso de um componente.

**Prompt Exemplo (no código)**:

```javascript
// O componente Button da biblioteca '@old-ui/components' foi atualizado para '@new-ui/components'.
// O novo componente agora aceita uma prop `variant` em vez de `type` para estilos (e.g., 'primary' -> 'default', 'secondary' -> 'outline').
// Atualize o uso deste componente para a nova API.
import { Button } from '@old-ui/components';

function MyComponent() {
    return (
        <Button type="primary" onClick={handleSave}>Salvar</Button>
    );
}

// Copilot, refactor the Button component usage to the new API from '@new-ui/components'.
```

**Insights Adicionais**: Fornecer um mapeamento claro entre a API antiga e a nova é fundamental. O Copilot pode então aplicar essas transformações.

## Cenário 4: Otimização de Performance

**Objetivo**: Melhorar a performance de código que está causando lentidão.

**Prompt Exemplo (no código)**:

```javascript
// Este loop está causando lentidão na renderização de partituras grandes.
// Ele itera sobre milhares de notas para calcular suas posições.
// Copilot, sugira uma forma mais eficiente de calcular as posições das notas,
// talvez usando memoização, virtualização de lista ou um algoritmo mais otimizado.
function calculateNotePositions(notes) {
    const positions = [];
    for (let i = 0; i < notes.length; i++) {
        // Cálculo complexo que é executado para cada nota
        const position = complexCalculation(notes[i]);
        positions.push(position);
    }
    return positions;
}
```

## Cenário 5: Refatoração de Classes para Composição

**Objetivo**: Converter uma classe monolítica em uma estrutura mais modular usando composição.

**Prompt Exemplo (no código)**:

```javascript
// Esta classe `MusicPlayer` está fazendo muitas coisas: reprodução, análise, UI, persistência.
// Refatore-a usando composição, separando as responsabilidades em classes menores.
// Crie classes separadas para: AudioEngine, AnalysisEngine, UIController, DataPersistence.
class MusicPlayer {
    // ... 200+ linhas de código com múltiplas responsabilidades ...
}

// Copilot, refactor this monolithic class into smaller, composed classes.
// Each class should have a single responsibility.
```

## Cenário 6: Modernização de Sintaxe

**Objetivo**: Atualizar código antigo para usar sintaxes modernas do JavaScript/TypeScript.

**Prompt Exemplo (no código)**:

```javascript
// Modernize este código para usar async/await em vez de Promises com .then()
// Também converta para arrow functions e destructuring onde apropriado.
function fetchUserData(userId) {
    return fetch(`/api/users/${userId}`)
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            return processUserData(data);
        })
        .catch(function(error) {
            console.error('Error fetching user data:', error);
            throw error;
        });
}

// Copilot, modernize this code to use async/await and modern JavaScript syntax.
```

## Cenário 7: Adição de Tipos TypeScript

**Objetivo**: Adicionar tipagem TypeScript a código JavaScript existente.

**Prompt Exemplo (no código)**:

```javascript
// Adicione tipos TypeScript a esta função e suas dependências.
// Crie interfaces para os objetos complexos e use tipos apropriados para parâmetros e retorno.
function processSheetMusic(musicData, options) {
    const result = {
        duration: calculateDuration(musicData.notes),
        tempo: options.tempo || 120,
        key: musicData.keySignature,
        measures: musicData.measures.map(measure => ({
            number: measure.number,
            notes: measure.notes.filter(note => note.duration > 0)
        }))
    };
    return result;
}

// Copilot, add comprehensive TypeScript types to this function.
// Create interfaces for musicData, options, and the return type.
```

## Cenário 8: Extração de Constantes e Configurações

**Objetivo**: Extrair valores hardcoded para constantes ou arquivos de configuração.

**Prompt Exemplo (no código)**:

```javascript
// Este código tem muitos valores hardcoded que deveriam ser constantes.
// Extraia os valores mágicos para constantes bem nomeadas no topo do arquivo.
function setupAudioContext() {
    const context = new AudioContext({
        sampleRate: 44100,
        latencyHint: 0.1
    });
    
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    return { context, compressor };
}

// Copilot, extract the hardcoded values to well-named constants.
// Group related constants together and add comments explaining their purpose.
```

## Cenário 9: Implementação de Design Patterns

**Objetivo**: Refatorar código para implementar um design pattern específico.

**Prompt Exemplo (no código)**:

```javascript
// Refatore este código para implementar o padrão Observer.
// O `MusicPlayer` deve notificar múltiplos listeners sobre mudanças de estado.
// Implemente métodos: subscribe, unsubscribe, notify.
class MusicPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTime = 0;
    }
    
    play() {
        this.isPlaying = true;
        // Atualmente não há notificação para outros componentes
    }
    
    pause() {
        this.isPlaying = false;
        // Atualmente não há notificação para outros componentes
    }
}

// Copilot, implement the Observer pattern for this MusicPlayer class.
// Allow multiple components to subscribe to playback state changes.
```

## Dicas para Prompts de Manutenção Eficazes

1. **Seja específico sobre o problema**: Descreva exatamente o que está errado ou pode ser melhorado
2. **Indique o objetivo**: Deixe claro se é performance, legibilidade, manutenibilidade, etc.
3. **Preserve funcionalidade**: Sempre mencione que a funcionalidade existente deve ser mantida
4. **Sugira abordagens**: Se você tem ideias sobre como melhorar, mencione-as
5. **Considere impacto**: Mencione se a mudança pode afetar outros arquivos
6. **Teste após refatoração**: Sempre teste o código refatorado para garantir que funciona corretamente

