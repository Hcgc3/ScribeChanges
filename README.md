# Sheet Music Viewer - Interactive Music Visualization

Um aplicativo web moderno e responsivo para visualização e reprodução de partituras MIDI com sincronização de áudio/vídeo.

## 🎵 Funcionalidades Principais

### 📁 Upload e Gerenciamento de Arquivos
- **Drag & Drop Interface**: Interface intuitiva para upload de arquivos MIDI
- **Formatos Suportados**: .mid, .midi
- **Arquivo de Exemplo**: MIDI de demonstração incluído para testes
- **Validação de Arquivos**: Verificação automática de formato e integridade

### 🎼 Visualização de Partituras
- **Renderização SVG**: Partituras de alta qualidade usando VexFlow
- **Visualização em Tela Cheia**: Interface otimizada para máxima legibilidade
- **Notação Musical Padrão**: Clave de sol, compassos, notas reais do MIDI
- **Responsivo**: Adapta-se automaticamente a diferentes tamanhos de tela

### 🎮 Controles de Reprodução Avançados
- **Play/Pause/Stop**: Controles básicos de reprodução
- **Controle de Velocidade**: 0.5x a 2.0x (50% a 200%)
- **Seleção de Instrumentos**: Piano, Guitar, Violin, Flute
- **Controle de Volume**: 0% a 100% com função mute
- **Barra de Progresso**: Navegação interativa na música
- **Loop**: Reprodução em loop
- **Painel Colapsível**: Interface limpa e focada

### 🎬 Sincronização de Áudio/Vídeo
- **Integração YouTube**: Sincronização com vídeos do YouTube
- **Upload de Áudio**: Suporte para arquivos de áudio locais
- **Timeline Interativa**: Pontos de sincronização arrastáveis
- **Visualização Dual**: Timeline MIDI e áudio lado a lado
- **Controles Precisos**: Sincronização frame-perfect

### 📚 Gerenciamento de Partituras
- **Biblioteca Pessoal**: Sistema completo de gerenciamento
- **Busca e Filtros**: Pesquisa por nome, filtros por categoria
- **Favoritos**: Sistema de marcação de partituras favoritas
- **Estatísticas**: Dashboard com métricas de uso
- **Histórico**: Rastreamento de última reprodução
- **Visualizações**: Grid e lista para diferentes preferências

### 📱 Design Responsivo
- **Mobile-First**: Otimizado para dispositivos móveis
- **Touch-Friendly**: Controles adaptados para toque
- **Breakpoints**: Desktop (≥1024px), Tablet (768-1023px), Mobile (<768px)
- **Layout Adaptativo**: Interface reorganiza-se automaticamente

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18**: Framework principal
- **Tailwind CSS**: Estilização e design system
- **Lucide Icons**: Ícones modernos e consistentes
- **Vite**: Build tool e desenvolvimento

### Áudio e MIDI
- **Tone.js**: Engine de áudio e síntese
- **@tonejs/midi**: Parser e manipulação de arquivos MIDI
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

### 1. Upload de Arquivo MIDI
1. Acesse a tela inicial
2. Arraste um arquivo .mid/.midi para a área de drop
3. Ou clique em "Browse Files" para selecionar
4. Use "Load Sample MIDI" para testar com arquivo de exemplo

### 2. Configuração de Sincronização (Opcional)
1. Insira URL do YouTube (opcional)
2. Ou faça upload de arquivo de áudio
3. Configure pontos de sincronização na timeline
4. Clique em "Continue to Playback"

### 3. Reprodução de Partituras
1. Use os controles de reprodução na parte inferior
2. Ajuste velocidade, volume e instrumento conforme necessário
3. Navegue pela música usando a barra de progresso
4. Alterne para tela cheia para melhor visualização

### 4. Gerenciamento de Partituras
1. Acesse "My Scores" no menu superior
2. Visualize suas partituras salvas
3. Use busca e filtros para encontrar partituras
4. Marque favoritos e visualize estatísticas

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
- **Responsividade**: Verificação automática de breakpoints
- **Performance**: Monitor em tempo real de FPS, memória, render time
- **Funcionalidade**: Testes manuais de todos os fluxos
- **Compatibilidade**: Verificação cross-browser

### Métricas de Performance
- **FPS**: >55 (bom), 30-55 (aceitável), <30 (ruim)
- **Memória**: <50MB (bom), 50-100MB (aceitável), >100MB (ruim)
- **Load Time**: <2s (bom), 2-5s (aceitável), >5s (ruim)
- **Render Time**: <16ms (bom), 16-33ms (aceitável), >33ms (ruim)

## 🔮 Funcionalidades Futuras

### Curto Prazo
- [ ] Suporte para mais formatos (MusicXML, ABC)
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

**Sheet Music Viewer** - Transformando a experiência de visualização e reprodução de partituras digitais. 🎵

