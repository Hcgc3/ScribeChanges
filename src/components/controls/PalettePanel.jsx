import React, { useMemo, useState } from 'react';
import { X, ChevronRight, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useScoreStore } from '@/lib/stores/score-store';
import { PALETTES, staffTextSymbol } from '@/lib/palettes';

// MuseScore's Palettes panel (F9): every symbol by category. A click puts the symbol on
// the selected note/range (or on the note just written in note input).

// Small drawings for symbols with no Unicode glyph
const ICONS = {
  accent: <path d="M5 8 L19 12 L5 16" fill="none" strokeWidth="1.8" />,
  staccato: <circle cx="12" cy="12" r="2.4" stroke="none" fill="currentColor" />,
  staccatissimo: <path d="M10 7 L14 7 L12 17 Z" stroke="none" fill="currentColor" />,
  tenuto: <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" />,
  portato: <><line x1="6" y1="9" x2="18" y2="9" strokeWidth="2" /><circle cx="12" cy="15" r="2.2" stroke="none" fill="currentColor" /></>,
  marcato: <path d="M7 17 L12 6 L17 17" fill="none" strokeWidth="2" />,
  stress: <path d="M8 9 Q12 17 16 9" fill="none" strokeWidth="1.8" />,
  unstress: <path d="M8 15 Q12 7 16 15" fill="none" strokeWidth="1.8" />,
  mordent: <path d="M3 13 L7 9 L10 15 L13 9 L16 15 L20 11" fill="none" strokeWidth="1.6" />,
  'inverted-mordent': <><path d="M3 13 L7 9 L10 15 L13 9 L16 15 L20 11" fill="none" strokeWidth="1.6" /><line x1="11.5" y1="5" x2="11.5" y2="19" strokeWidth="1.4" /></>,
  'tremolo-1': <><line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.2" /><line x1="7" y1="14" x2="17" y2="10" strokeWidth="2.4" /></>,
  'tremolo-2': <><line x1="12" y1="3" x2="12" y2="21" strokeWidth="1.2" /><line x1="7" y1="12" x2="17" y2="8" strokeWidth="2.4" /><line x1="7" y1="17" x2="17" y2="13" strokeWidth="2.4" /></>,
  'tremolo-3': <><line x1="12" y1="2" x2="12" y2="22" strokeWidth="1.2" /><line x1="7" y1="9" x2="17" y2="5" strokeWidth="2.4" /><line x1="7" y1="14" x2="17" y2="10" strokeWidth="2.4" /><line x1="7" y1="19" x2="17" y2="15" strokeWidth="2.4" /></>,
  slur: <path d="M3 15 Q12 4 21 15 Q12 8 3 15" stroke="none" fill="currentColor" />,
  'head-normal': <ellipse cx="12" cy="12" rx="5.5" ry="4" transform="rotate(-20 12 12)" stroke="none" fill="currentColor" />,
  'head-x': <path d="M7 8 L17 16 M17 8 L7 16" strokeWidth="2" />,
  'head-diamond': <path d="M12 6 L18 12 L12 18 L6 12 Z" fill="none" strokeWidth="1.8" />,
  'head-slash': <path d="M7 17 L15 7 L18 7 L10 17 Z" stroke="none" fill="currentColor" />,
  'head-triangle': <path d="M12 6 L18 17 L6 17 Z" stroke="none" fill="currentColor" />,
  'head-circle-x': <><circle cx="12" cy="12" r="6" fill="none" strokeWidth="1.6" /><path d="M8 8 L16 16 M16 8 L8 16" strokeWidth="1.4" /></>,
  arpeggio: <path d="M12 3 q3 1.5 0 3 q-3 1.5 0 3 q3 1.5 0 3 q-3 1.5 0 3 q3 1.5 0 3 q-3 1.5 0 3" fill="none" strokeWidth="1.5" />,
  'arpeggio-up': <><path d="M12 7 q3 1.5 0 3 q-3 1.5 0 3 q3 1.5 0 3 q-3 1.5 0 3" fill="none" strokeWidth="1.5" /><path d="M8.5 7 L12 2.5 L15.5 7" fill="none" strokeWidth="1.5" /></>,
  'arpeggio-down': <><path d="M12 2 q3 1.5 0 3 q-3 1.5 0 3 q3 1.5 0 3 q-3 1.5 0 3" fill="none" strokeWidth="1.5" /><path d="M8.5 17 L12 21.5 L15.5 17" fill="none" strokeWidth="1.5" /></>,
  thumb: <><circle cx="12" cy="10" r="4.5" fill="none" strokeWidth="1.6" /><line x1="12" y1="14.5" x2="12" y2="20" strokeWidth="1.6" /></>,
};

const SymbolFace = ({ symbol }) => {
  if (symbol.icon && ICONS[symbol.icon]) {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[symbol.icon]}
      </svg>
    );
  }
  if (symbol.fraction) {
    return (
      <span className="flex flex-col items-center font-serif text-[13px] font-bold leading-[0.95]">
        <span>{symbol.fraction[0]}</span>
        <span>{symbol.fraction[1]}</span>
      </span>
    );
  }
  if (symbol.glyph) {
    return (
      <span className="palette-glyph relative leading-none">
        {symbol.glyph}
        {symbol.sub && <span className="absolute -right-2 bottom-0 font-sans text-[9px]">{symbol.sub}</span>}
      </span>
    );
  }
  return (
    <span
      className={[
        'font-serif leading-none',
        symbol.small ? 'text-[10px] tracking-[-0.08em]' : symbol.text?.length > 4 ? 'text-[10px]' : 'text-[13px]',
        symbol.italic ? 'italic' : '',
        symbol.bold ? 'font-bold' : '',
        symbol.boxed ? 'border border-current px-1 py-0.5' : '',
      ].join(' ')}
    >
      {symbol.text}
    </span>
  );
};

const PalettePanel = () => {
  const togglePalettes = useScoreStore((s) => s.togglePalettes);
  const applySymbol = useScoreStore((s) => s.applySymbol);
  const hasTarget = useScoreStore((s) => !!s.selection || (s.editing.active && !!(s.editing.last || s.editing.caret)));
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set(['clefs', 'keys', 'time', 'articulations', 'dynamics']));

  const q = query.trim().toLowerCase();
  const palettes = useMemo(() => (q
    ? PALETTES.map((p) => ({ ...p, symbols: p.symbols.filter((s) => `${s.label} ${p.title}`.toLowerCase().includes(q)) }))
      .filter((p) => p.symbols.length)
    : PALETTES), [q]);

  const toggle = (id) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const apply = (symbol) => {
    if (symbol.ask) {
      const text = window.prompt(symbol.ask);
      if (text && text.trim()) applySymbol(staffTextSymbol(text.trim()));
      return;
    }
    applySymbol(symbol);
  };

  return (
    <aside className="palette-panel absolute top-0 left-0 bottom-0 z-[120] flex w-[300px] max-w-full flex-col border-r border-border/30 bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <h2 className="text-sm font-semibold">Paletas</h2>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => togglePalettes(false)} title="Fechar (F9)">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="border-b border-border/30 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar símbolo…" className="h-8 pl-8 text-xs" />
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {hasTarget ? 'Clique num símbolo para o pôr na seleção.' : 'Selecione uma nota (ou várias, com Shift+clique) e clique num símbolo.'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {palettes.map((palette) => {
          const expanded = q || open.has(palette.id);
          return (
            <section key={palette.id} className="mb-1">
              <button
                type="button"
                onClick={() => toggle(palette.id)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-accent"
              >
                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
                {palette.title}
              </button>
              {expanded && (
                <>
                  {palette.hint && <p className="px-2 pb-1 text-[10px] text-muted-foreground">{palette.hint}</p>}
                  <div className="grid grid-cols-6 gap-1 px-1 pb-2">
                    {palette.symbols.map((symbol) => (
                      <button
                        key={symbol.label}
                        type="button"
                        title={symbol.label}
                        aria-label={symbol.label}
                        onClick={() => apply(symbol)}
                        className="flex h-10 items-center justify-center rounded-md border border-border/30 bg-secondary/40 text-foreground transition-colors hover:border-primary hover:bg-primary/15"
                      >
                        <SymbolFace symbol={symbol} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
};

export default PalettePanel;
