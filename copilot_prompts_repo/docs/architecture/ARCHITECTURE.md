# 🏗️ Arquitetura do Sistema

## 📐 **Visão Geral da Arquitetura**

```
┌─────────────────────────────────────────────────────────────┐
│                     APLICAÇÃO REACT                        │
├─────────────────────────────────────────────────────────────┤
│  App.jsx (Controlador Principal)                           │
│  ├── Estado Global (useState)                              │
│  ├── Handlers de Eventos                                   │
│  └── Orquestração de Componentes                           │
├─────────────────────────────────────────────────────────────┤
│                  CAMADA DE APRESENTAÇÃO                    │
│  ├── Header (Controles principais)                         │
│  ├── Main Content Area (Partitura)                         │
│  └── Magnetic Widgets (Controles flutuantes)               │
├─────────────────────────────────────────────────────────────┤
│                   COMPONENTES CORE                         │
│  ├── AdvancedSheetMusicOSMD (Renderização avançada)        │
│  ├── SheetMusicOSMD (Renderização básica)                  │
│  ├── AudioEngine (Motor de áudio)                          │
│  └── SelectionTool (Ferramentas de seleção)                │
├─────────────────────────────────────────────────────────────┤
│                  COMPONENTES MAGNETIC                      │
│  ├── MagneticPlaybackControls (Reprodução)                 │
│  ├── MagneticNavigationControls (Navegação)                │
│  ├── MagneticAnalysisWidget (Análise)                      │
│  └── MagneticWidget (Base para widgets)                    │
├─────────────────────────────────────────────────────────────┤
│                   COMPONENTES MODAL                        │
│  ├── AnalysisPanel (Painel de análise IA)                  │
│  ├── FullscreenSheetMusic (Modo fullscreen)                │
│  └── SelectionTool (Overlay de seleção)                    │
├─────────────────────────────────────────────────────────────┤
│                    CAMADA DE UI                            │
│  ├── Shadcn/UI Components (Design system)                  │
│  ├── Tailwind CSS (Styling)                                │
│  └── Lucide Icons (Iconografia)                            │
├─────────────────────────────────────────────────────────────┤
│                  BIBLIOTECAS EXTERNAS                      │
│  ├── OpenSheetMusicDisplay (OSMD)                          │
│  ├── Tone.js (Audio synthesis)                             │
│  └── React (Framework base)                                │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **Padrões Arquiteturais**

### **1. Component Composition Pattern**
- Componentes pequenos e focados
- Composição em vez de herança
- Props drilling controlado

### **2. Magnetic Widget System**
- Widgets flutuantes e posicionáveis
- Sistema de ancoragem magnética
- Estado persistente de posição

### **3. Dual Renderer Pattern**
- Suporte para múltiplos motores de renderização
- Fallback gracioso entre versões
- Interface unificada

### **4. Progressive Enhancement**
- Funcionalidade base sem áudio
- Audio engine ativado por gesto do utilizador
- Layers de funcionalidade

## 🎯 **Princípios de Design**

### **Separation of Concerns**
- **App.jsx**: Orquestração e estado global
- **Components**: Lógica específica e UI
- **Libraries**: Funcionalidades externas

### **Single Responsibility**
- Cada componente tem uma responsabilidade
- Handlers específicos para cada ação
- Estado localizado quando possível

### **Composition over Configuration**
- Componentes combinados para criar funcionalidades
- Props para customização
- Hooks para reutilização de lógica

## 📊 **Métricas da Arquitetura**

- **Componentes Core**: 9
- **UI Components**: 35+
- **Magnetic Widgets**: 4
- **External Libraries**: 3
- **Lines of Code**: ~3000+
- **File Count**: 50+
