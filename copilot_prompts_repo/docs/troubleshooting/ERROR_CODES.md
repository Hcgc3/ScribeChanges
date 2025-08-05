# 🚨 Códigos de Erro e Significados

## 🎵 **Erros de Audio/Tone.js**

### **AUDIO_001: AudioContext Não Permitido**
```
The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture
```
- **Causa**: Tentativa de inicializar áudio sem gesto do utilizador
- **Severidade**: ⚠️ Warning
- **Solução**: Aguardar primeiro clique do utilizador
- **Status**: ✅ Resolvido automaticamente

### **AUDIO_002: Tone.js Initialization Failed**
```
Error ao inicializar áudio: [error details]
```
- **Causa**: Falha na criação do synth ou context
- **Severidade**: 🔴 Critical
- **Solução**: Verificar compatibilidade do browser com Web Audio API

### **AUDIO_003: Audio Playback Failed**
```
Failed to start audio playback
```
- **Causa**: AudioEngine não inicializado ou notas não carregadas
- **Severidade**: 🟡 Medium
- **Solução**: Verificar se `isInitialized` é true e `notesRef.current` tem dados

---

## 🎼 **Erros de OSMD**

### **OSMD_001: MusicXML Parse Error**
```
[OSMD] Failed to parse MusicXML
```
- **Causa**: MusicXML inválido ou corrompido
- **Severidade**: 🔴 Critical
- **Solução**: Validar formato MusicXML

### **OSMD_002: Container Not Found**
```
[OSMD] Could not find container element
```
- **Causa**: Container DOM não existe quando OSMD tenta renderizar
- **Severidade**: 🔴 Critical
- **Solução**: Verificar se ref está definido antes de inicializar OSMD

### **OSMD_003: Render Failed**
```
[OSMD] Rendering failed
```
- **Causa**: Dimensões inválidas ou CSS conflicts
- **Severidade**: 🟡 Medium
- **Solução**: Verificar CSS do container e dimensões mínimas

---

## 🧲 **Erros de Magnetic Widgets**

### **WIDGET_001: Position Calculation Failed**
```
Error calculating widget position
```
- **Causa**: Dimensões do viewport ou container indefinidas
- **Severidade**: 🟡 Medium
- **Solução**: Aguardar layout complete antes de calcular posições

### **WIDGET_002: Drag Handler Failed**
```
Widget drag event failed
```
- **Causa**: Event listener não registrado ou conflicts
- **Severidade**: 🟡 Medium
- **Solução**: Verificar event handlers e z-index

---

## ⚛️ **Erros de React**

### **REACT_001: Cannot Access Ref**
```
Warning: Function components cannot be given refs. Attempts to access this ref will fail.
```
- **Causa**: Tentativa de passar ref para component funcional sem forwardRef
- **Severidade**: ⚠️ Warning
- **Solução**: Usar React.forwardRef ou remover ref
- **Status**: ✅ Resolvido para Card component

### **REACT_002: State Update on Unmounted Component**
```
Warning: Can't perform a React state update on an unmounted component
```
- **Causa**: setState após component unmount
- **Severidade**: ⚠️ Warning
- **Solução**: Adicionar cleanup em useEffect

### **REACT_003: Infinite Re-render**
```
Too many re-renders. React limits the number of renders to prevent an infinite loop
```
- **Causa**: useEffect sem dependencies ou state update em render
- **Severidade**: 🔴 Critical
- **Solução**: Verificar dependencies arrays e state updates

---

## 🎨 **Erros de CSS/Styling**

### **CSS_001: Tailwind Class Not Found**
```
Unknown at rule @apply
```
- **Causa**: Tailwind não configurado corretamente
- **Severidade**: 🟡 Medium
- **Solução**: Verificar tailwind.config.js e postcss.config.js

### **CSS_002: Z-index Conflicts**
```
Widget appears behind other elements
```
- **Causa**: Z-index hierarchy incorreta
- **Severidade**: 🟡 Medium
- **Solução**: Ajustar z-index values ou stacking context

---

## 🔧 **Erros de Build/Development**

### **BUILD_001: Module Not Found**
```
Failed to resolve import "module-name"
```
- **Causa**: Dependency não instalada ou path incorreto
- **Severidade**: 🔴 Critical
- **Solução**: `npm install module-name` ou corrigir import path

### **BUILD_002: Type Error**
```
Property 'x' does not exist on type 'y'
```
- **Causa**: TypeScript type mismatch
- **Severidade**: 🟡 Medium
- **Solução**: Corrigir types ou adicionar type assertion

### **BUILD_003: Hot Reload Failed**
```
[vite] Hot reload failed
```
- **Causa**: Syntax error ou module dependency issue
- **Severidade**: 🟡 Medium
- **Solução**: Fix syntax errors e restart dev server

---

## 🔍 **Como Diagnosticar Erros**

### **1. Console Logs**
```javascript
// Ativar modo debug
localStorage.setItem('debug', 'true');

// Logs estruturados
console.group('🎵 Audio Debug');
console.log('isInitialized:', isInitialized);
console.log('Tone.context.state:', Tone.context.state);
console.groupEnd();
```

### **2. React DevTools**
- Instalar React DevTools extension
- Verificar component props e state
- Profiler para performance issues

### **3. Network Tab**
- Verificar se assets estão carregando
- Check for failed requests
- Monitor bundle sizes

### **4. Application Tab**
- LocalStorage/SessionStorage state
- Service worker status
- Cache storage

---

## 📊 **Severity Levels**

- 🔴 **Critical**: Aplicação não funciona
- 🟡 **Medium**: Funcionalidade limitada
- ⚠️ **Warning**: Funciona mas com avisos
- 🔵 **Info**: Informativo apenas

---

## 🆘 **Emergency Recovery**

### **Hard Reset**
```bash
# Clear all cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Browser Reset**
```javascript
// Clear localStorage
localStorage.clear();
sessionStorage.clear();

// Reload page
window.location.reload();
```

### **Component Reset**
```jsx
// Force component re-mount
const [key, setKey] = useState(0);
const resetComponent = () => setKey(prev => prev + 1);

<Component key={key} />
```
