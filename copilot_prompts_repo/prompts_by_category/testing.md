# Prompts para Geração de Testes

Prompts dedicados à criação de testes unitários, de integração e de ponta a ponta, garantindo a cobertura do código e a robustez da aplicação. O Copilot é particularmente útil para gerar casos de teste baseados na assinatura da função e nos comentários.

## Cenário 1: Geração de Testes Unitários para uma Função

**Objetivo**: Criar testes unitários abrangentes para uma função existente.

**Contexto**: Você acabou de escrever ou refatorar uma função e precisa garantir que ela funcione corretamente em diferentes cenários.

**Prompt Exemplo (em um arquivo de teste, e.g., `myFunction.test.js`)**:

```javascript
import { calculateSheetMusicDuration } from '../src/utils/sheetMusicUtils';

describe('calculateSheetMusicDuration', () => {
    // Copilot, write comprehensive unit tests for the calculateSheetMusicDuration function.
    // Include test cases for:
    // - Empty sheet music data
    // - Sheet music with a single note
    // - Sheet music with multiple notes and different durations
    // - Edge cases (e.g., very long durations, zero duration)
    // - Invalid input (e.g., null or undefined data)
    // - Different time signatures (4/4, 3/4, 6/8)
    // - Notes with different note values (whole, half, quarter, eighth)
});
```

**Insights Adicionais**: Liste explicitamente os tipos de casos de teste que você deseja (casos de sucesso, vazios, múltiplos, borda, inválidos). Isso direciona o Copilot para uma cobertura de teste mais completa.

## Cenário 2: Geração de Testes de Integração para um Componente

**Objetivo**: Testar a interação entre um componente UI e suas dependências ou APIs.

**Contexto**: Você tem um componente `MagneticPlaybackControls` e quer testar se ele interage corretamente com as funções de callback.

**Prompt Exemplo (em um arquivo de teste)**:

```javascript
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import MagneticPlaybackControls from '../src/components/MagneticPlaybackControls';

describe('MagneticPlaybackControls Integration', () => {
    // Copilot, write integration tests for the MagneticPlaybackControls component.
    // Test that:
    // - Clicking the play/pause button calls onPlayPause with correct parameters
    // - Changing the volume slider calls onVolumeChange with the correct value
    // - Changing the tempo slider calls onTempoChange with the correct value
    // - The component renders correctly with different prop values (isPlaying, volume, tempo)
    // - The component handles edge cases (volume 0-100, tempo 60-200 BPM)
    // - Accessibility: buttons have proper ARIA labels and keyboard navigation works
});
```

## Cenário 3: Testes para Funções Assíncronas

**Objetivo**: Testar funções que retornam Promises ou usam async/await.

**Prompt Exemplo**:

```javascript
import { fetchSheetMusicById } from '../src/services/sheetMusicService';

// Mock fetch para controlar as respostas
global.fetch = jest.fn();

describe('fetchSheetMusicById', () => {
    // Copilot, write tests for this async function.
    // Test scenarios:
    // - Successful API response with valid data
    // - API returns 404 (sheet music not found)
    // - API returns 500 (server error)
    // - Network error (fetch throws)
    // - Invalid JSON response
    // - Timeout scenarios
    // Use proper async/await testing patterns and mock fetch appropriately
    
    beforeEach(() => {
        fetch.mockClear();
    });
});
```

## Cenário 4: Testes de Performance

**Objetivo**: Criar testes que verificam se o código atende aos requisitos de performance.

**Prompt Exemplo**:

```javascript
import { calculateNotePositions } from '../src/utils/layoutUtils';

describe('calculateNotePositions Performance', () => {
    // Copilot, write performance tests for calculateNotePositions.
    // Test that:
    // - Function completes within 100ms for 1000 notes
    // - Function completes within 500ms for 10000 notes
    // - Memory usage doesn't exceed reasonable limits
    // - Function handles large datasets without crashing
    // Use performance.now() to measure execution time
    // Create test data generators for different dataset sizes
});
```

## Cenário 5: Testes de Error Handling

**Objetivo**: Verificar se o código lida adequadamente com situações de erro.

**Prompt Exemplo**:

```javascript
import { AudioEngine } from '../src/services/AudioEngine';

describe('AudioEngine Error Handling', () => {
    // Copilot, write tests for error handling in AudioEngine.
    // Test scenarios:
    // - AudioContext creation fails (browser doesn't support Web Audio API)
    // - Invalid audio parameters (negative volume, invalid frequency)
    // - Audio context is suspended or closed
    // - Memory exhaustion when creating many audio nodes
    // - Invalid note data passed to playNote method
    // Verify that appropriate errors are thrown or handled gracefully
});
```

## Cenário 6: Testes de Estado e Lifecycle (React)

**Objetivo**: Testar o comportamento de componentes React em diferentes estados e durante seu ciclo de vida.

**Prompt Exemplo**:

```javascript
import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { useAudioPlayer } from '../src/hooks/useAudioPlayer';

// Componente de teste para o hook
function TestComponent({ audioSrc }) {
    const { isPlaying, currentTime, play, pause } = useAudioPlayer(audioSrc);
    return (
        <div>
            <span data-testid="playing">{isPlaying.toString()}</span>
            <span data-testid="time">{currentTime}</span>
            <button onClick={play}>Play</button>
            <button onClick={pause}>Pause</button>
        </div>
    );
}

describe('useAudioPlayer Hook', () => {
    // Copilot, write tests for the useAudioPlayer custom hook.
    // Test:
    // - Initial state (not playing, time = 0)
    // - State changes when play() is called
    // - State changes when pause() is called
    // - Time updates during playback
    // - Cleanup when component unmounts
    // - Behavior when audioSrc changes
    // Use act() for state updates and waitFor() for async operations
});
```

## Cenário 7: Testes de Mocking e Stubbing

**Objetivo**: Testar código que depende de APIs externas ou serviços complexos.

**Prompt Exemplo**:

```javascript
import { MusicAnalyzer } from '../src/services/MusicAnalyzer';
import { AudioEngine } from '../src/services/AudioEngine';

// Mock do AudioEngine
jest.mock('../src/services/AudioEngine');

describe('MusicAnalyzer with Mocked Dependencies', () => {
    // Copilot, write tests using mocks for external dependencies.
    // Mock the AudioEngine to control its behavior in tests
    // Test scenarios:
    // - MusicAnalyzer correctly calls AudioEngine methods
    // - MusicAnalyzer handles AudioEngine errors gracefully
    // - MusicAnalyzer processes different types of audio data
    // - Verify that mocked methods are called with correct parameters
    // Use jest.fn() to create spies and verify function calls
    
    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });
});
```

## Cenário 8: Testes End-to-End (E2E)

**Objetivo**: Testar fluxos completos da aplicação do ponto de vista do usuário.

**Prompt Exemplo**:

```javascript
// Usando Cypress ou Playwright
describe('Sheet Music Player E2E', () => {
    // Copilot, write end-to-end tests for the sheet music player.
    // Test complete user workflows:
    // - User loads a sheet music file
    // - User plays/pauses the music
    // - User adjusts volume and tempo
    // - User navigates through the score (zoom, pan)
    // - User switches to fullscreen mode
    // - User saves/loads workspace settings
    // Include assertions for UI state, audio playback, and data persistence
    
    beforeEach(() => {
        cy.visit('/');
        // Setup test data or mock APIs as needed
    });
});
```

## Cenário 9: Testes de Acessibilidade

**Objetivo**: Verificar se a aplicação atende aos padrões de acessibilidade.

**Prompt Exemplo**:

```javascript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import MagneticPlaybackControls from '../src/components/MagneticPlaybackControls';

expect.extend(toHaveNoViolations);

describe('MagneticPlaybackControls Accessibility', () => {
    // Copilot, write accessibility tests for the playback controls.
    // Test:
    // - No axe-core violations
    // - Proper ARIA labels and roles
    // - Keyboard navigation works correctly
    // - Focus management is appropriate
    // - Screen reader announcements for state changes
    // - Color contrast meets WCAG standards
    // - Component works without mouse interaction
});
```

## Cenário 10: Testes de Snapshot

**Objetivo**: Detectar mudanças não intencionais na renderização de componentes.

**Prompt Exemplo**:

```javascript
import React from 'react';
import { render } from '@testing-library/react';
import MagneticAnalysisWidget from '../src/components/MagneticAnalysisWidget';

describe('MagneticAnalysisWidget Snapshots', () => {
    // Copilot, write snapshot tests for different states of the analysis widget.
    // Create snapshots for:
    // - Widget with no analysis data
    // - Widget with basic analysis results
    // - Widget with complex analysis (multiple instruments, harmonies)
    // - Widget in loading state
    // - Widget in error state
    // - Widget in different sizes (mobile, tablet, desktop)
    // Include props variations that affect rendering
});
```

## Dicas para Prompts de Testes Eficazes

1. **Especifique o framework de teste**: Jest, Mocha, Cypress, Playwright, etc.
2. **Liste cenários específicos**: Não apenas "escreva testes", mas "teste X, Y, Z"
3. **Inclua edge cases**: Sempre mencione casos extremos e situações de erro
4. **Defina critérios de sucesso**: O que constitui um teste que passa?
5. **Mencione setup/teardown**: Se há configuração especial necessária
6. **Considere performance**: Para funções críticas, inclua testes de performance
7. **Pense em acessibilidade**: Especialmente para componentes UI
8. **Use dados realistas**: Mencione se precisa de dados de teste específicos

