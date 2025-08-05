# 🚀 Guia de Configuração e Setup

## 📋 **Pré-requisitos**

- **Node.js**: v18+ 
- **npm**: v8+
- **Git**: Para version control
- **VS Code**: Recomendado (com extensões)

## ⚡ **Setup Inicial**

### **1. Clone e Install**
```bash
# Clonar repositório
git clone [repo-url]
cd sheet-music-app

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev
```

### **2. Verificar Instalação**
```bash
# Verificar se todas as deps estão instaladas
npm list --depth=0

# Testar build
npm run build

# Preview build
npm run preview
```

## 🔧 **Configuração do Ambiente**

### **VS Code Extensions Recomendadas**
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json"
  ]
}
```

### **Settings.json**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^\"'`]*)(?:'|\"|`)"]
  ]
}
```

## 📦 **Dependências Principais**

### **Core Dependencies**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "opensheetmusicdisplay": "^1.8.7",
  "tone": "^14.7.77",
  "lucide-react": "^0.263.1"
}
```

### **UI Dependencies**
```json
{
  "@radix-ui/react-*": "^1.x.x",
  "tailwindcss": "^3.3.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^1.14.0"
}
```

### **Development Dependencies**
```json
{
  "vite": "^5.3.4",
  "eslint": "^9.7.0",
  "autoprefixer": "^10.4.14",
  "postcss": "^8.4.24"
}
```

## 🌐 **URLs e Portas**

- **Development**: `http://localhost:5174/`
- **Network**: `http://[your-ip]:5174/`
- **Build Preview**: `http://localhost:4173/`

## 🔧 **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Cria build de produção
npm run preview      # Preview do build

# Linting
npm run lint         # Roda ESLint
```

## 🎯 **Configuração de Componentes**

### **Imports Recomendados**
```jsx
// React core
import React, { useState, useEffect, useRef } from 'react';

// UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Icons
import { Play, Pause, Volume2 } from 'lucide-react';

// Custom components
import MagneticWidget from './MagneticWidget';
```

### **Estrutura de Component**
```jsx
const MyComponent = ({ 
  prop1,
  prop2 = "default",
  onCallback,
  className = ""
}) => {
  // Estados
  const [state, setState] = useState(initialValue);
  
  // Refs
  const elementRef = useRef(null);
  
  // Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);
  
  // Handlers
  const handleAction = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  // Render
  return (
    <div className={cn("base-classes", className)}>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

## 🎨 **Configuração de Styling**

### **Tailwind Classes Comuns**
```css
/* Layout */
.container { @apply mx-auto px-4; }
.flex-center { @apply flex items-center justify-center; }

/* Magnetic Widget Base */
.magnetic-widget { 
  @apply absolute z-50 bg-white rounded-lg shadow-lg border;
  @apply transition-all duration-300 ease-in-out;
}

/* Button Variants */
.btn-primary { @apply bg-blue-500 hover:bg-blue-600 text-white; }
.btn-secondary { @apply bg-gray-200 hover:bg-gray-300 text-gray-800; }
```

## 🔊 **Configuração de Audio**

### **Tone.js Setup**
```jsx
// AudioEngine initialization
const initializeAudio = async () => {
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
  
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: {
      attack: 0.02,
      decay: 0.1,
      sustain: 0.3,
      release: 1
    }
  }).toDestination();
  
  return synth;
};
```

## 🧪 **Testing Setup (Futuro)**

### **Configuração de Jest/Vitest**
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "^0.34.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.4.0"
  }
}
```

## 📊 **Performance Monitoring**

### **Bundle Analysis**
```bash
# Analisar bundle size
npm run build
npx vite-bundle-analyzer dist
```

### **Memory Monitoring**
```javascript
// Monitor performance
console.time('component-render');
// ... component logic
console.timeEnd('component-render');

// Memory usage
console.log('Memory:', performance.memory);
```

## 🔐 **Environment Variables**

### **.env.local**
```bash
# Development
VITE_APP_NAME="Sheet Music App"
VITE_DEBUG_MODE=true

# Production
VITE_API_URL="https://api.example.com"
VITE_APP_VERSION="1.0.0"
```

## 🚀 **Deployment Checklist**

- [ ] `npm run build` sem erros
- [ ] Testar preview build localmente
- [ ] Verificar console errors no browser
- [ ] Testar funcionalidades core
- [ ] Verificar performance (Lighthouse)
- [ ] Testar em diferentes browsers
- [ ] Mobile responsiveness (se aplicável)

## 🆘 **Troubleshooting Setup**

### **Node Modules Issues**
```bash
# Reset completo
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### **Port Already in Use**
```bash
# Matar processo na porta 5174
lsof -ti:5174 | xargs kill -9
```

### **Permission Issues**
```bash
# Verificar permissions
ls -la
sudo chown -R $(whoami) node_modules
```
