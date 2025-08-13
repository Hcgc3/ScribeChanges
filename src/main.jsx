import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global one-time audio unlock for Tone.js
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', async () => {
    try { await (window.Tone?.start?.()); } catch {}
    try {
      const ctx = window.Tone?.getContext?.();
      if (ctx && ctx.state !== 'running') await ctx.rawContext.resume();
    } catch {}
  }, { once: true, passive: true });
}

createRoot(document.getElementById('root')).render(
  <App />
)
