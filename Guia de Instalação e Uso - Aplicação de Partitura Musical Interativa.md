# Guia de Instalação e Uso - Aplicação de Partitura Musical Interativa

## Requisitos do Sistema

- **Node.js**: Versão 18 ou superior
- **pnpm**: Gestor de pacotes (recomendado) ou npm/yarn
- **Navegador moderno**: Chrome, Firefox, Safari ou Edge

## Instalação

### 1. Extrair os Ficheiros
```bash
tar -xzf sheet-music-interactive-app.tar.gz
cd sheet-music-app
```

### 2. Instalar Dependências
```bash
pnpm install
# ou
npm install
```

### 3. Iniciar o Servidor de Desenvolvimento
```bash
pnpm dev
# ou
npm run dev
```

### 4. Aceder à Aplicação
Abrir o navegador em: `http://localhost:5174`

## Funcionalidades Principais

### 🎼 Visualização de Partituras
- Renderização profissional com OpenSheetMusicDisplay
- Suporte para ficheiros MusicXML
- Cursor musical sincronizado
- Zoom e navegação fluidos

### 🗺️ Navegação Estilo OSM
- **Zoom In/Out**: Botões dedicados com indicador de percentagem
- **Pan (Movimento)**: Ferramenta ativável para arrastar a partitura
- **Reset**: Voltar à vista original
- **Ecrã Completo**: Maximizar a área de visualização

### 🎯 Seleção Interativa
1. **Ativar Seleção**: Toggle no painel de controles
2. **Selecionar Área**: Arrastar sobre a partitura
3. **Redimensionar**: Usar os handles nas bordas
4. **Ações**: Barra de ferramentas flutuante com opções

### 🧠 Análise Musical com IA
- **Análise Harmónica**: Tonalidades, progressões, acordes
- **Análise Melódica**: Âmbito, contornos, motivos
- **Análise Rítmica**: Compassos, tempos, padrões
- **Contexto Histórico**: Períodos, estilos, características

### 🎵 Motor de Áudio Avançado
- **Reprodução**: Play/Pause/Stop com controles profissionais
- **Seleção**: Reproduzir apenas compassos selecionados
- **Tempo**: Controle de BPM (60-200)
- **Volume**: Controle com mute
- **Loop**: Repetição automática

## Interface de Utilizador

### Cabeçalho Dourado
- Título da aplicação
- Indicadores de status
- Botões de funcionalidades principais

### Barra de Controles
- Controles de zoom tradicionais
- Controles de reprodução
- Slider de volume
- Configurações avançadas

### Área Principal
- Partitura musical renderizada
- Controles de navegação OSM (canto superior direito)
- Painel de configurações (canto superior esquerdo)

### Painéis Laterais
- **Análise Musical**: Painel direito deslizante
- **Motor de Áudio**: Seção inferior expansível

## Atalhos de Teclado

| Ação | Atalho |
|------|--------|
| Play/Pause | Espaço |
| Zoom In | + |
| Zoom Out | - |
| Reset Vista | R |
| Ecrã Completo | F |

## Configurações Avançadas

### Navegação OSM
- **Ativar/Desativar**: Toggle no painel de controles
- **Sensibilidade**: Configurável via código
- **Limites de Zoom**: 30% a 300%

### Seleção
- **Ativar/Desativar**: Toggle no painel de controles
- **Área Mínima**: 20x20 pixels
- **Cor**: Dourado semi-transparente

### Motor de Áudio
- **Sintetizador**: Configurável (Triangle, Sine, Square)
- **Reverb**: Ativável
- **Compressor**: Automático

## Resolução de Problemas

### Áudio Não Funciona
1. Verificar se o navegador permite áudio
2. Clicar em qualquer botão para ativar contexto de áudio
3. Verificar volume do sistema

### Partitura Não Carrega
1. Verificar formato MusicXML
2. Verificar consola do navegador para erros
3. Recarregar a página

### Performance Lenta
1. Reduzir nível de zoom
2. Fechar painéis não utilizados
3. Usar navegador atualizado

## Desenvolvimento

### Estrutura do Código
```
src/
├── components/          # Componentes React
├── lib/                # Utilitários
├── App.jsx             # Aplicação principal
└── main.jsx            # Ponto de entrada
```

### Comandos Úteis
```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Preview da build
pnpm preview

# Linting
pnpm lint
```

### Personalização
- **Cores**: Editar `tailwind.config.js`
- **Componentes**: Modificar ficheiros em `src/components/`
- **Estilos**: Ajustar `src/App.css`

## Suporte e Contribuições

### Reportar Bugs
1. Verificar consola do navegador
2. Reproduzir o problema
3. Documentar passos para reprodução

### Funcionalidades Futuras
- Edição de partituras
- Múltiplos instrumentos
- Colaboração em tempo real
- Exportação para PDF/MIDI
- Integração com IA real

## Licença e Créditos

- **OpenSheetMusicDisplay**: Renderização de partituras
- **Tone.js**: Motor de áudio web
- **React**: Framework de interface
- **Tailwind CSS**: Framework de estilos
- **shadcn/ui**: Componentes de interface

---

**Nota**: Esta aplicação foi desenvolvida seguindo o roadmap especificado e está preparada para futuras expansões e integrações.

