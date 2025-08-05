# ⚠️ Problemas Comuns e Soluções

## 🔧 **AudioContext e Web Audio**

### **Problema**: AudioContext warnings
```
The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
```

**Solução**: ✅ **RESOLVIDO**
- Ver [AUDIOCONTEXT_FIX.md](AUDIOCONTEXT_FIX.md) para detalhes completos
- Audio engine aguarda gesto do utilizador
- Inicialização automática no primeiro clique em Play

---

## 🎵 **Problemas de OSMD**

### **Problema**: "endless/undefined pageformat"
```
[OSMD] endless/undefined pageformat, id: noIdStringGiven
```

**Causa**: Configuração de formato de página não especificada no MusicXML
**Impacto**: ⚠️ Warning apenas - não afeta funcionalidade
**Solução**: Aceitar como warning esperado ou configurar pageFormat explicitamente

### **Problema**: OSMD não carrega partitura
**Diagnóstico**:
```bash
# Check console for OSMD errors
# Verify musicXML format
# Check container dimensions
```

**Soluções**:
1. Verificar se o MusicXML é válido
2. Assegurar que o container tem dimensões definidas
3. Verificar se o OSMD está inicializado

---

## 🧲 **Magnetic Widgets**

### **Problema**: Widget não aparece
**Causa comum**: Estado `defaultPinned` ou `isVisible`
**Solução**:
```jsx
// Verificar props do widget
<MagneticWidget
  defaultPinned={true}  // ou false
  defaultMinimized={false}
  defaultPosition="top-right"
/>
```

### **Problema**: Widget não é arrastável
**Causa**: CSS conflitos ou event handlers
**Solução**:
1. Verificar se não há `pointer-events: none`
2. Confirmar que event handlers estão ativos
3. Check z-index conflicts

---

## 🧩 **Widgets Magnéticos**

### **Problema**: Widgets sobrepostos ou reposicionados incorretamente
**Diagnóstico**:
- Verificar lógica de `getPositionStyle`.
- Confirmar valores de `customPosition` e `position`.

**Soluções**:
1. Ajustar lógica de `handleMouseMove` para suavizar movimento.
2. Garantir que `customPosition` seja respeitado em `getPositionStyle`.
3. Revisar cálculo de proximidade em `findNearestMagneticPosition`.

### **Problema**: Movimento clunky durante arrasto
**Diagnóstico**:
- Verificar uso de `requestAnimationFrame`.
- Confirmar que atualizações de estado não são excessivas.

**Soluções**:
1. Usar `requestAnimationFrame` para suavizar atualizações.
2. Reduzir frequência de chamadas para `setCustomPosition`.
3. Testar lógica de arrasto em diferentes resoluções.

---

## 📱 **Responsividade e Layout**

### **Problema**: Layout quebra em mobile
**Causa**: Magnetic widgets não otimizados para mobile
**Solução temporária**: Usar apenas em desktop
**Roadmap**: Implementar layout responsivo

### **Problema**: Fullscreen não funciona
**Diagnóstico**:
```jsx
// Verificar estado
console.log('isFullscreen:', isFullscreen);

// Verificar handler
const handleFullscreen = () => {
  setIsFullscreen(true);
};
```

---

## 🎚️ **Problemas de Performance**

### **Problema**: Lag ao arrastar widgets
**Causa**: Re-renders excessivos
**Solução**:
```jsx
// Usar useCallback para handlers
const handleDrag = useCallback((newPosition) => {
  // logic here
}, [dependencies]);

// Throttle de position updates
const throttledUpdate = useMemo(
  () => throttle(updatePosition, 16), // 60fps
  []
);
```

### **Problema**: Audio latency
**Causa**: Buffer size ou sample rate
**Solução**:
```jsx
// Configurar Tone.js context
Tone.context.latencyHint = "interactive";
Tone.context.lookAhead = 0.05;
```

---

## 🔄 **Problemas de Estado**

### **Problema**: Estado não sincroniza entre componentes
**Diagnóstico**:
```jsx
// Verificar se callbacks estão sendo chamados
console.log('Callback triggered:', data);

// Verificar estado no App.jsx
console.log('App state:', { isPlaying, currentTime, selectionInfo });
```

**Solução**:
1. Verificar se props callbacks estão sendo passados
2. Confirmar que handlers estão atualizando estado
3. Check for stale closures em useEffect

---

## 🚨 **Emergency Debug Commands**

### **Reset Audio Engine**
```javascript
// No console do browser
Tone.Transport.stop();
Tone.Transport.cancel();
await Tone.start();
```

### **Reset Component State**
```javascript
// Forçar re-render
window.location.reload();
```

### **Check Component Tree**
```javascript
// React DevTools
$r.props  // Props do componente selecionado
$r.state  // Estado (se class component)
```

---

## 📊 **Logs Úteis para Debug**

### **Ativar logs detalhados**
```javascript
// Adicionar ao App.jsx
const DEBUG = true;
const log = (msg, data) => DEBUG && console.log(`[DEBUG] ${msg}`, data);

// Usar nos handlers
const handlePlay = () => {
  log('Play clicked', { isPlaying, currentTime });
  setIsPlaying(true);
};
```

### **Monitor performance**
```javascript
// Performance monitoring
console.time('OSMD-render');
// ... OSMD operations
console.timeEnd('OSMD-render');
```

---

## 🔗 **Links Úteis**

- [React DevTools](https://reactjs.org/blog/2019/08/15/new-react-devtools.html)
- [Tone.js Documentation](https://tonejs.github.io/)
- [OSMD Documentation](https://opensheetmusicdisplay.org/)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
