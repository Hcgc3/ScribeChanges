
# Midi Stuff for Music - Modern Sheet Music & MIDI Tools

## 🛠️ MusicXML Output Fixes Roadmap

To ensure the converter output matches the reference MusicXML, follow this iterative workflow:

1. **Apply a Fix:** Implement one fix from the checklist (e.g., duration mapping, dynamics, beams, etc.).
2. **Generate Output:** Run the converter on `Test/teste.mid` to produce a new MusicXML output (`tests/unit/batch_output/Test.musicxml`).
3. **Compare Output:** Compare the generated output to the reference (`Test/teste.musicxml`).
4. **Validate:** If the output matches, delete the fix from the checklist and proceed to the next.
5. **Retry if Needed:** If the output does not match, refine the fix and repeat steps 2-4 until it matches.
6. **Repeat:** Continue until all fixes are complete and the output matches the reference.

This process ensures each fix is validated before moving on. Document progress by updating the README and removing each step after successful validation.

## 🛠️ Fixes Needed for Exact MusicXML Output Matching

To achieve exact output matching with reference MusicXML files, apply the following fixes in order. After each fix, remove it from this list:


Follow this order for implementation and validation.

Um aplicativo web moderno e responsivo para upload, conversão, visualização e reprodução de partituras digitais. Agora inclui conversão direta de arquivos MIDI para MusicXML, download, sincronização de áudio/vídeo, e gerenciamento avançado de biblioteca.


## 🚀 Principais Funcionalidades


### 🎹 Upload, Conversão e Download de MIDI/MusicXML
- **Upload de Arquivo MIDI**: Interface intuitiva para arrastar ou selecionar arquivos .mid/.midi
- **Conversão Automática**: Converte MIDI para MusicXML instantaneamente usando pipeline modular
- **Download MusicXML**: Baixe o arquivo MusicXML gerado com um clique
- **Validação**: Saída MusicXML validada contra schema customizado
- **Exemplo Incluso**: Arquivo MIDI de exemplo para testes


### 🎼 Visualização e Reprodução de Partituras
- **Renderização MusicXML/MIDI**: Visualização de partituras usando VexFlow e OpenSheetMusicDisplay
- **Tela Cheia**: Interface otimizada para máxima legibilidade
- **Notação Musical Padrão**: Clave de sol, compassos, notas reais do MIDI
- **Responsivo**: Adapta-se automaticamente a diferentes tamanhos de tela


### 🎮 Controles de Reprodução
- **Play/Pause/Stop**: Controles básicos de reprodução
- **Velocidade e Instrumentos**: Ajuste de tempo e seleção de instrumentos
- **Volume e Loop**: Controle de volume, mute e reprodução em loop
- **Barra de Progresso**: Navegação interativa


### 🎬 Sincronização de Áudio/Vídeo
- **YouTube Sync**: Sincronize partituras com vídeos do YouTube
- **Upload de Áudio**: Suporte para arquivos de áudio locais
- **Timeline Interativa**: Pontos de sincronização arrastáveis


### 📚 Gerenciamento de Biblioteca
- **Biblioteca Pessoal**: CRUD completo de partituras
- **Busca, Filtros e Favoritos**: Pesquisa avançada e marcação
- **Estatísticas e Histórico**: Dashboard de uso e histórico


### 📱 Design Responsivo
- **Mobile-First**: Otimizado para dispositivos móveis
- **Touch-Friendly**: Controles adaptados para toque


## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18**: Framework principal
- **Tailwind CSS**: Estilização e design system
- **Lucide Icons**: Ícones modernos e consistentes
- **Vite**: Build tool e desenvolvimento


### Áudio, MIDI e MusicXML
- **Tone.js**: Engine de áudio e síntese
- **@tonejs/midi**: Parser e manipulação de arquivos MIDI
- **OpenSheetMusicDisplay**: Renderização de MusicXML
- **VexFlow**: Renderização de notação musical

### Armazenamento
- **localStorage**: Persistência de dados local
- **JSON**: Formato de dados estruturados


## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- npm ou pnpm

### Instalação
```bash
# Clone o repositório
git clone https://github.com/Hcgc3/Midi-stuff-for-music.git
cd Midi-stuff-for-music

# Instale as dependências
npm install --legacy-peer-deps
# ou se você tiver pnpm instalado:
# pnpm install

# Execute em modo de desenvolvimento
npm run dev
# ou com pnpm:
# pnpm dev

# Build para produção
npm run build
# ou com pnpm:
# pnpm build

# Visualizar build de produção
npm run preview
# ou com pnpm:
# pnpm preview
```

### Acesso
- **Desenvolvimento**: http://localhost:5173
- **Produção**: Após build, servir pasta `dist/`


## 📖 Guia de Uso

### 1. Upload, Conversão e Download de MIDI/MusicXML
1. Acesse a tela inicial
2. Arraste ou selecione um arquivo MIDI (.mid/.midi)
3. O arquivo é convertido automaticamente para MusicXML
4. Clique em "Download MusicXML" para baixar o resultado
5. Visualize o MusicXML gerado na interface


### 2. Sincronização e Reprodução
1. Configure sincronização com áudio ou vídeo (YouTube)
2. Ajuste pontos de sincronização na timeline
3. Use controles de reprodução para tocar, pausar, ajustar velocidade e instrumentos


### 3. Gerenciamento de Biblioteca
1. Acesse "My Scores" para visualizar, buscar, filtrar e favoritar partituras
2. Veja estatísticas e histórico de uso

## 🎨 Design System

### Paleta de Cores
- **Primária**: Gradientes de roxo e azul
- **Secundária**: Tons de slate/cinza
- **Acentos**: Verde, amarelo, vermelho para status
- **Fundo**: Gradientes escuros para contraste

### Tipografia
- **Fonte Principal**: Sistema (sans-serif)
- **Tamanhos**: Escala responsiva
- **Pesos**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Componentes
- **Cards**: Backdrop blur com bordas sutis
- **Botões**: Estados hover e focus bem definidos
- **Inputs**: Bordas e focus states consistentes
- **Modais**: Overlay com backdrop blur

## 🏗️ Arquitetura Moderna e Boas Práticas

### Organização do Projeto
Este projeto segue as melhores práticas modernas do React:

#### Estrutura Modular
- **Separação de responsabilidades**: Cada diretório tem um propósito específico
- **Components reutilizáveis**: Componentes UI isolados e testáveis
- **Custom Hooks**: Lógica reutilizável extraída em hooks customizados
- **Absolute Imports**: Imports limpos usando alias `@/` para melhor manutenibilidade

#### Vantagens da Estrutura Atual
- **Escalabilidade**: Fácil adicionar novos componentes e funcionalidades
- **Manutenibilidade**: Estrutura clara facilita localização e modificação de código
- **Reutilização**: Componentes e utils podem ser reutilizados em todo o projeto
- **Colaboração**: Estrutura familiar para desenvolvedores React

### Configuração de Desenvolvimento
- **Vite**: Build tool rápido com HMR (Hot Module Replacement)
- **ESLint**: Linting configurado para React
- **Tailwind CSS**: Sistema de design utilitário
- **Absolute Imports**: Configuração via Vite e jsconfig.json

## 🔧 Arquitetura do Código

### Estrutura de Pastas
```
src/
├── components/           # Componentes React reutilizáveis
│   ├── Ui/              # Componentes base (Button, Card, etc.)
│   ├── SheetMusicRenderer.jsx
│   ├── PlaybackControls.jsx
│   ├── MyScoresManager.jsx
│   ├── YouTubePlayer.jsx
│   ├── SyncTimeline.jsx
│   └── ...
├── pages/               # Páginas de nível superior
│   └── App.jsx         # Componente principal da aplicação
├── hooks/               # Custom React hooks
│   └── use-mobile.js   # Hook para detecção de dispositivos móveis
├── utils/               # Funções utilitárias/helper
│   ├── audioAnalysis.js # Utilitários de análise de áudio
│   └── utils.js        # Utilitários gerais
├── assets/              # Imagens, fontes e outros assets estáticos
│   └── react.svg       # Logo e recursos visuais
├── styles/              # CSS global e compartilhado
│   ├── index.css       # Estilos globais e configuração Tailwind
│   └── App.css         # Estilos específicos da aplicação
├── lib/                 # Utilitários de biblioteca compartilhados
│   └── utils.js        # Utilitários para componentes (cn function)
└── main.jsx            # Entry point da aplicação
```

### Configuração de Absolute Imports
O projeto usa imports absolutos configurados via Vite com o alias `@/`:

```javascript
// Ao invés de imports relativos:
import Button from '../../../components/Ui/button.jsx'

// Use imports absolutos:
import Button from '@/components/Ui/button.jsx'
```

**Configuração no vite.config.js:**
```javascript
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Componentes Principais

#### App.jsx (src/pages/)
- **Responsabilidade**: Gerenciamento de estado global e roteamento
- **Estado**: currentView, midiData, playback controls, sync data
- **Navegação**: Controla transições entre telas
- **Imports**: Usa absolute imports (@/) para todos os componentes

#### SheetMusicRenderer.jsx (src/components/)
- **Responsabilidade**: Renderização de partituras com VexFlow
- **Entrada**: Dados MIDI parseados
- **Saída**: SVG de notação musical

#### PlaybackControls.jsx (src/components/)
- **Responsabilidade**: Interface de controles de reprodução
- **Funcionalidades**: Play/pause, volume, velocidade, instrumentos
- **Integração**: Tone.js para síntese de áudio

#### MyScoresManager.jsx (src/components/)
- **Responsabilidade**: Gerenciamento completo de biblioteca
- **Funcionalidades**: CRUD, busca, filtros, estatísticas
- **Persistência**: localStorage

#### Custom Hooks (src/hooks/)
- **use-mobile.js**: Hook para detecção de dispositivos móveis
- **Uso**: `const isMobile = useIsMobile()` para layouts responsivos

#### Utilitários (src/utils/)
- **audioAnalysis.js**: Análise de áudio em tempo real
- **utils.js**: Funções utilitárias gerais
- **src/lib/utils.js**: Função `cn()` para combinação de classes CSS

### Fluxo de Dados
1. **Upload**: Arquivo → Parser MIDI → Estado global
2. **Renderização**: MIDI data → VexFlow → SVG
3. **Reprodução**: MIDI data → Tone.js → Áudio
4. **Persistência**: Estado → localStorage → Recuperação


## 🧪 Testes e Qualidade


### Testes Implementados
- **Conversão MIDI→MusicXML**: Testes unitários e batch para garantir conformidade
- **Validação MusicXML**: Validação automática contra schema customizado
- **Responsividade**: Verificação automática de breakpoints
- **Performance**: Monitor em tempo real de FPS, memória, render time
- **Funcionalidade**: Testes manuais de todos os fluxos
- **Compatibilidade**: Verificação cross-browser

### Métricas de Performance
- **FPS**: >55 (bom), 30-55 (aceitável), <30 (ruim)
- **Memória**: <50MB (bom), 50-100MB (aceitável), >100MB (ruim)
- **Load Time**: <2s (bom), 2-5s (aceitável), >5s (ruim)
- **Render Time**: <16ms (bom), 16-33ms (aceitável), >33ms (ruim)


## 🔮 Roadmap e Funcionalidades Futuras


### Curto Prazo
- [x] Upload e conversão MIDI→MusicXML com download
- [x] Validação MusicXML
- [x] Visualização e reprodução de partituras
- [x] Sincronização com áudio/vídeo
- [x] Gerenciamento de biblioteca
- [ ] Exportação de partituras em PDF
- [ ] Modo escuro/claro
- [ ] Atalhos de teclado


### Médio Prazo
- [ ] Colaboração em tempo real
- [ ] Anotações nas partituras
- [ ] Transposição automática
- [ ] Metrônomo integrado


### Longo Prazo
- [ ] IA para correção de partituras
- [ ] Reconhecimento de áudio para MIDI
- [ ] Marketplace de partituras
- [ ] Aplicativo mobile nativo


## 🤝 Contribuição

### Como Contribuir
1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- **ESLint**: Configuração padrão React
- **Prettier**: Formatação automática (se configurado)
- **Commits**: Conventional Commits recomendado
- **Estrutura**: Siga a organização de pastas estabelecida

### Diretrizes de Desenvolvimento
#### Adicionando Novos Componentes
```bash
# Componentes reutilizáveis
src/components/NewComponent.jsx

# Componentes UI base
src/components/Ui/new-ui-component.jsx

# Use absolute imports
import { Button } from '@/components/Ui/button'
import NewComponent from '@/components/NewComponent'
```

#### Adicionando Custom Hooks
```bash
# Coloque em src/hooks/
src/hooks/use-new-feature.js

# Nomeação: sempre use-*
export function useNewFeature() { ... }
```

#### Adicionando Utilitários
```bash
# Utilitários gerais
src/utils/new-utility.js

# Utilitários de biblioteca (para components)
src/lib/new-lib-utility.js
```

#### Adicionando Assets
```bash
# Imagens, ícones, fontes
src/assets/images/new-image.svg
src/assets/fonts/new-font.woff2
```


## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.


## 👥 Equipe

- **Desenvolvimento**: Manus AI Agent
- **Design**: Baseado no projeto SharpBlend E-commerce
- **Tecnologias**: React, Tone.js, VexFlow, Tailwind CSS


## 📞 Suporte

Para suporte e dúvidas:
- **Issues**: Use o sistema de issues do GitHub
- **Documentação**: Consulte este README
- **Exemplos**: Veja os arquivos de exemplo incluídos

---


**Midi Stuff for Music** - Plataforma completa para upload, conversão, visualização e gerenciamento de partituras digitais. 🎵

