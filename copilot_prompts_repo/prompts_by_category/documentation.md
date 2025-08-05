# Prompts para Documentação e Explicação de Código

Utilizando o Copilot para gerar comentários, docstrings e explicações sobre o código, facilitando a compreensão e a manutenção por outros desenvolvedores (ou por você mesmo no futuro). Isso é vital em projetos grandes onde a documentação pode facilmente ficar desatualizada.

## Cenário 1: Geração de Docstrings/Comentários para Funções/Classes

**Objetivo**: Adicionar documentação clara e concisa a um trecho de código.

**Contexto**: Você acabou de escrever uma função e quer adicionar um docstring padrão (e.g., JSDoc, Python docstring) para descrever seu propósito, parâmetros e retorno.

**Prompt Exemplo (no código, antes da função)**:

```javascript
/**
 * Copilot, generate a comprehensive JSDoc for this function.
 * Describe its purpose, parameters, return value, and any side effects.
 * Include examples of usage and mention any exceptions that might be thrown.
 */
function calculateNoteFrequency(noteName, octave, tuningFrequency = 440) {
    // ... implementação ...
    return frequency;
}
```

**Insights Adicionais**: O Copilot é muito bom em inferir a documentação a partir do nome da função, parâmetros e lógica interna. Você pode especificar o formato do docstring (e.g., `// Python docstring for this class`).

## Cenário 2: Explicação de um Trecho de Código Complexo

**Objetivo**: Obter uma explicação detalhada de um algoritmo ou lógica complexa.

**Contexto**: Você está revisando um código legado ou uma seção que não entende completamente.

**Prompt Exemplo (no código, como comentário)**:

```javascript
// Este bloco de código implementa o algoritmo de detecção de colisão para widgets magnéticos.
// Ele calcula a sobreposição de retângulos e ajusta as posições.
// Copilot, explique este algoritmo em termos simples, passo a passo.
// Quais são os principais conceitos e como eles são aplicados aqui?
function detectWidgetCollisions(widgets) {
    const collisions = [];
    for (let i = 0; i < widgets.length; i++) {
        for (let j = i + 1; j < widgets.length; j++) {
            const rect1 = widgets[i].getBoundingRect();
            const rect2 = widgets[j].getBoundingRect();
            
            if (rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y) {
                collisions.push({ widget1: widgets[i], widget2: widgets[j] });
            }
        }
    }
    return collisions;
}
```

**Insights Adicionais**: O Copilot pode atuar como um tutor, explicando a lógica de código complexa. Quanto mais contexto você fornecer (o que o código faz, qual o problema que ele resolve), melhor será a explicação.

## Cenário 3: Geração de Comentários para Seções de Código

**Objetivo**: Adicionar comentários inline para melhorar a compreensão de blocos de código específicos.

**Contexto**: Um loop ou uma série de operações matemáticas complexas precisa de comentários para explicar cada passo.

**Prompt Exemplo (no código)**:

```javascript
function calculateSheetMusicLayout(notes, clefs, staves) {
    // Copilot, add inline comments to explain each major step in this layout calculation.
    // Focus on how note positions, clef adjustments, and staff spacing are determined.
    
    const layoutData = {
        notePositions: [],
        staffLines: [],
        measures: []
    };
    
    for (const note of notes) {
        // [Copilot: explicar cálculo de posição horizontal]
        const x = note.startTime * pixelsPerSecond + marginLeft;
        
        // [Copilot: explicar cálculo de posição vertical]
        const y = calculateVerticalPosition(note.pitch, clefs[note.staff]);
        
        layoutData.notePositions.push({ note, x, y });
    }
    
    return layoutData;
}
```

## Cenário 4: Documentação de APIs e Interfaces

**Objetivo**: Criar documentação completa para APIs, interfaces ou contratos de dados.

**Prompt Exemplo**:

```typescript
// Copilot, generate comprehensive documentation for this API interface.
// Include descriptions for each property, possible values, and usage examples.
// Mention any validation rules or constraints.
interface SheetMusicData {
    id: string;
    title: string;
    composer: string;
    keySignature: string;
    timeSignature: string;
    tempo: number;
    measures: Measure[];
    instruments: Instrument[];
    metadata: {
        duration: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        genre: string;
        tags: string[];
    };
}
```

## Cenário 5: Documentação de Componentes React

**Objetivo**: Criar documentação para componentes React, incluindo props, estados e comportamentos.

**Prompt Exemplo**:

```javascript
// Copilot, generate comprehensive documentation for this React component.
// Include prop descriptions, usage examples, and behavioral notes.
// Mention any accessibility considerations and styling options.
/**
 * [Copilot: adicionar documentação aqui]
 */
const MagneticPlaybackControls = ({ 
    isPlaying, 
    onPlayPause, 
    volume, 
    onVolumeChange, 
    tempo, 
    onTempoChange,
    disabled = false,
    size = 'medium',
    theme = 'default'
}) => {
    // ... implementação do componente ...
};
```

## Cenário 6: Documentação de Hooks Customizados

**Objetivo**: Documentar hooks customizados com seus parâmetros, retornos e efeitos colaterais.

**Prompt Exemplo**:

```javascript
// Copilot, create detailed documentation for this custom hook.
// Explain what it does, its parameters, return values, and any side effects.
// Include usage examples and mention any dependencies or requirements.
/**
 * [Copilot: adicionar documentação aqui]
 */
function useAudioPlayer(audioSrc, options = {}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    
    // ... implementação do hook ...
    
    return {
        isPlaying,
        currentTime,
        duration,
        play,
        pause,
        seek,
        setVolume
    };
}
```

## Cenário 7: Documentação de Configurações e Constantes

**Objetivo**: Explicar configurações, constantes e valores mágicos no código.

**Prompt Exemplo**:

```javascript
// Copilot, add explanatory comments for these configuration constants.
// Explain what each value represents, why it was chosen, and how it affects the application.
const AUDIO_CONFIG = {
    SAMPLE_RATE: 44100,        // [Copilot: explicar]
    BUFFER_SIZE: 4096,         // [Copilot: explicar]
    LATENCY_HINT: 0.1,         // [Copilot: explicar]
    MAX_POLYPHONY: 32,         // [Copilot: explicar]
    FADE_DURATION: 0.05,       // [Copilot: explicar]
    COMPRESSOR_THRESHOLD: -24, // [Copilot: explicar]
    COMPRESSOR_RATIO: 12       // [Copilot: explicar]
};
```

## Cenário 8: Documentação de Algoritmos e Fórmulas

**Objetivo**: Explicar algoritmos matemáticos ou fórmulas complexas usadas no código.

**Prompt Exemplo**:

```javascript
// Copilot, explain this algorithm for converting musical notes to frequencies.
// Break down the mathematical formula and explain each component.
// Mention the music theory concepts involved (equal temperament, semitones, etc.).
function noteToFrequency(noteName, octave, tuningFrequency = 440) {
    // [Copilot: explicar a teoria musical por trás]
    const noteOffsets = {
        'C': -9, 'C#': -8, 'Db': -8,
        'D': -7, 'D#': -6, 'Eb': -6,
        'E': -5, 'F': -4, 'F#': -3,
        'Gb': -3, 'G': -2, 'G#': -1,
        'Ab': -1, 'A': 0, 'A#': 1,
        'Bb': 1, 'B': 2
    };
    
    // [Copilot: explicar esta fórmula]
    const semitoneOffset = noteOffsets[noteName] + (octave - 4) * 12;
    return tuningFrequency * Math.pow(2, semitoneOffset / 12);
}
```

## Cenário 9: Documentação de Padrões de Design

**Objetivo**: Explicar a implementação de padrões de design e suas motivações.

**Prompt Exemplo**:

```javascript
// Copilot, document this Observer pattern implementation.
// Explain why this pattern was chosen, how it works, and how to use it.
// Include examples of adding/removing observers and triggering notifications.
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    
    // [Copilot: documentar este método]
    subscribe(event, callback) {
        // ... implementação ...
    }
    
    // [Copilot: documentar este método]
    unsubscribe(event, callback) {
        // ... implementação ...
    }
    
    // [Copilot: documentar este método]
    emit(event, data) {
        // ... implementação ...
    }
}
```

## Cenário 10: Documentação de Troubleshooting

**Objetivo**: Criar documentação para ajudar na resolução de problemas comuns.

**Prompt Exemplo**:

```javascript
// Copilot, create troubleshooting documentation for this audio initialization function.
// List common problems that might occur and their solutions.
// Include error codes, browser compatibility issues, and user permission problems.
async function initializeAudioContext() {
    try {
        // [Copilot: documentar possíveis problemas aqui]
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // [Copilot: documentar por que isso é necessário]
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        return audioContext;
    } catch (error) {
        // [Copilot: documentar diferentes tipos de erro e soluções]
        throw new Error(`Failed to initialize audio context: ${error.message}`);
    }
}
```

## Cenário 11: Documentação de README e Guias

**Objetivo**: Gerar documentação de projeto, READMEs e guias de uso.

**Prompt Exemplo**:

```markdown
<!-- Copilot, create a comprehensive README for this sheet music player project.
Include:
- Project description and features
- Installation instructions
- Usage examples
- API documentation
- Contributing guidelines
- Troubleshooting section
- Browser compatibility
- Performance considerations -->

# Sheet Music Player

[Copilot: adicionar conteúdo do README aqui]
```

## Dicas para Prompts de Documentação Eficazes

1. **Especifique o formato**: JSDoc, TSDoc, Markdown, etc.
2. **Defina o público-alvo**: Desenvolvedores iniciantes, experientes, usuários finais
3. **Inclua exemplos**: Peça por exemplos de uso quando apropriado
4. **Mencione contexto**: Explique onde e como o código é usado
5. **Peça por explicações graduais**: Para código complexo, peça explicação passo a passo
6. **Considere manutenibilidade**: Documentação deve ser fácil de manter atualizada
7. **Inclua edge cases**: Documente comportamentos especiais ou limitações
8. **Pense em acessibilidade**: Para componentes UI, inclua considerações de acessibilidade

