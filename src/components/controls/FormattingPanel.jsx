import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useScoreStore } from '@/lib/stores/score-store';
import { useAppStore } from '@/lib/stores/app-store';
import { mergeFormatting, setNoteheadSize, getNoteheadSize, DEFAULT_FORMATTING, DEFAULT_MARGINS } from '@music-editor/score-viewer';

const PAPER = {
  a4: { label: 'A4', width: 210, height: 297 },
  a3: { label: 'A3', width: 297, height: 420 },
  letter: { label: 'Letter', width: 216, height: 279 },
  legal: { label: 'Legal', width: 216, height: 356 },
  tabloid: { label: 'Tabloid', width: 279, height: 432 },
};
// applyPageSettings preset names (mapped to OSMD page formats in the store)
const presetFor = (paper, landscape) => (paper === 'custom' ? 'custom' : `${paper}-${landscape ? 'landscape' : 'portrait'}`);

const paperOf = (page) => {
  const w = Math.min(page.widthMm, page.heightMm);
  const h = Math.max(page.widthMm, page.heightMm);
  const match = Object.entries(PAPER).find(([, p]) => Math.abs(p.width - w) < 1 && Math.abs(p.height - h) < 1);
  return match ? match[0] : 'custom';
};

// ---- controls -----------------------------------------------------------------------

const Section = ({ title, onReset, children }) => (
  <section className="space-y-2">
    <div className="flex items-center justify-between">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {onReset && (
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground" onClick={onReset} title="Repor">
          <RotateCcw className="w-3 h-3" />
        </Button>
      )}
    </div>
    <div className="space-y-1.5">{children}</div>
  </section>
);

const Row = ({ label, children }) => (
  <div className="flex items-center gap-2 min-h-7">
    <span className="w-32 shrink-0 text-xs">{label}</span>
    <div className="flex flex-1 items-center gap-2 min-w-0">{children}</div>
  </div>
);

// Slider + number field. Applies on release / Enter / blur (each apply re-renders the score).
// `scale` shows e.g. 1 as 100 (%).
const NumberRow = ({ label, value, min, max, step, unit, scale = 1, digits = 0, disabled, onCommit }) => {
  const [local, setLocal] = useState(value);
  const [text, setText] = useState(null);
  useEffect(() => { setLocal(value); }, [value]);
  const shown = (local * scale).toFixed(digits);
  const commit = (v) => {
    const clamped = Math.min(max, Math.max(min, v));
    if (!Number.isFinite(clamped)) return;
    setLocal(clamped);
    if (Math.abs(clamped - value) > 1e-9) onCommit(clamped);
  };
  return (
    <Row label={label}>
      <Slider
        value={[local]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(v) => setLocal(v[0])}
        onValueCommit={(v) => commit(v[0])}
        className="flex-1"
      />
      <Input
        value={text ?? shown}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => { setText(null); commit(parseFloat(e.target.value.replace(',', '.')) / scale); }}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        className="h-7 w-14 px-1 text-center text-xs tabular-nums"
      />
      <span className="w-6 text-[10px] text-muted-foreground">{unit}</span>
    </Row>
  );
};

const ToggleRow = ({ label, checked, onChange, disabled }) => (
  <Row label={label}>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </Row>
);

const Segmented = ({ value, options, onChange, disabled }) => (
  <div className="inline-flex rounded-md border border-border/40 p-0.5">
    {options.map(([key, label]) => (
      <button
        key={key}
        type="button"
        disabled={disabled}
        onClick={() => onChange(key)}
        className={`px-2 h-6 rounded text-xs transition-colors disabled:opacity-40 ${value === key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
      >
        {label}
      </button>
    ))}
  </div>
);

// ---- panel ---------------------------------------------------------------------------

const FormattingPanel = () => {
  const closeModal = useAppStore((s) => s.closeModal);
  const {
    pageSettings, formatting, selection, applyPageSettings, updateFormatting, resetFormatting, resetAllFormatting, renderScore,
  } = useScoreStore(useShallow((s) => ({
    pageSettings: s.pageSettings,
    formatting: s.formatting,
    selection: s.selection,
    applyPageSettings: s.applyPageSettings,
    updateFormatting: s.updateFormatting,
    resetFormatting: s.resetFormatting,
    resetAllFormatting: s.resetAllFormatting,
    renderScore: s.renderScore,
  })));
  const f = mergeFormatting(formatting);
  const D = DEFAULT_FORMATTING;
  const page = pageSettings;
  const margins = page.margins || {};
  const landscape = page.widthMm > page.heightMm;
  const paper = paperOf(page);
  const mirror = f.page.mirrorMargins;

  const setPaper = (key, isLandscape = landscape) => {
    const p = PAPER[key];
    if (!p) return;
    const [width, height] = isLandscape ? [p.height, p.width] : [p.width, p.height];
    applyPageSettings({ width, height, unit: 'mm', preset: presetFor(key, isLandscape) });
  };
  const setSize = (width, height) => applyPageSettings({ width, height, unit: 'mm', preset: 'custom' });
  const setMargin = (key, value) => applyPageSettings({ margins: { [key]: value } });
  const sys = (patch) => updateFormatting({ system: patch });
  const el = (patch) => updateFormatting({ elements: patch });
  const txt = (patch) => updateFormatting({ text: patch });

  // Selected notes (click / Shift+click on the score): individual notehead size
  const selNotes = (selection?.notes || []).filter((n) => !n.isRest?.());
  const selSize = getNoteheadSize(selNotes[0]);
  const setSelectionSize = (mode, scale = selSize.scale) => {
    setNoteheadSize(selNotes, mode, mode === 'custom' ? scale : 1);
    renderScore();
  };

  return (
    <aside className="formatting-panel absolute top-0 right-0 bottom-0 z-[120] w-[360px] max-w-full flex flex-col border-l border-border/30 bg-background shadow-2xl">
      <header className="flex items-center justify-between px-4 h-11 border-b border-border/20">
        <h2 className="text-sm font-semibold">Formatação</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={resetAllFormatting}>Repor tudo</Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => closeModal('formatting')} title="Fechar">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="page" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="mx-4 mt-3 grid grid-cols-3">
          <TabsTrigger value="page" className="text-xs">Página</TabsTrigger>
          <TabsTrigger value="system" className="text-xs">Sistema</TabsTrigger>
          <TabsTrigger value="elements" className="text-xs">Elementos</TabsTrigger>
        </TabsList>

        {/* 1. Page setup */}
        <TabsContent value="page" className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-5">
          <Section title="Papel">
            <Row label="Formato">
              <Select value={paper} onValueChange={(v) => (v === 'custom' ? setSize(page.widthMm, page.heightMm) : setPaper(v))}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                {/* Above the panel (z-120); the default z-50 opened behind it */}
                <SelectContent className="z-[200]">
                  {Object.entries(PAPER).map(([key, p]) => <SelectItem key={key} value={key}>{p.label}</SelectItem>)}
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Orientação">
              <Segmented
                value={landscape ? 'landscape' : 'portrait'}
                options={[['portrait', 'Retrato'], ['landscape', 'Paisagem']]}
                onChange={(v) => {
                  const toLandscape = v === 'landscape';
                  if (toLandscape === landscape) return;
                  if (paper === 'custom') setSize(page.heightMm, page.widthMm);
                  else setPaper(paper, toLandscape);
                }}
              />
            </Row>
            <NumberRow label="Largura" value={page.widthMm} min={100} max={600} step={1} unit="mm" onCommit={(v) => setSize(v, page.heightMm)} />
            <NumberRow label="Altura" value={page.heightMm} min={100} max={800} step={1} unit="mm" onCommit={(v) => setSize(page.widthMm, v)} />
          </Section>

          <Section
            title="Margens"
            onReset={() => {
              applyPageSettings({ margins: { ...DEFAULT_MARGINS } });
              if (mirror) updateFormatting({ page: { mirrorMargins: false } });
            }}
          >
            <NumberRow label="Superior" value={margins.topMm ?? 12} min={0} max={60} step={0.5} digits={1} unit="mm" onCommit={(v) => setMargin('topMm', v)} />
            <NumberRow label="Inferior" value={margins.bottomMm ?? 14} min={0} max={60} step={0.5} digits={1} unit="mm" onCommit={(v) => setMargin('bottomMm', v)} />
            <NumberRow label={mirror ? 'Interior' : 'Esquerda'} value={margins.leftMm ?? 12} min={0} max={60} step={0.5} digits={1} unit="mm" onCommit={(v) => setMargin('leftMm', v)} />
            <NumberRow label={mirror ? 'Exterior' : 'Direita'} value={margins.rightMm ?? 12} min={0} max={60} step={0.5} digits={1} unit="mm" onCommit={(v) => setMargin('rightMm', v)} />
            <ToggleRow label="Espelhar (par/ímpar)" checked={mirror} onChange={(v) => updateFormatting({ page: { mirrorMargins: v } })} />
          </Section>
        </TabsContent>

        {/* 2. System geometry */}
        <TabsContent value="system" className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-5">
          <Section title="Escala" onReset={() => sys({ masterScale: D.system.masterScale, systemScale: D.system.systemScale })}>
            <NumberRow label="Escala global" value={f.system.masterScale} min={0.5} max={2} step={0.01} scale={100} unit="%" onCommit={(v) => sys({ masterScale: v })} />
            <NumberRow label="Tamanho do sistema" value={f.system.systemScale} min={0.5} max={2} step={0.01} scale={100} unit="%" onCommit={(v) => sys({ systemScale: v })} />
          </Section>

          <Section title="Limites" onReset={() => sys({ leftMm: D.system.leftMm, rightMm: D.system.rightMm, stretchLastSystem: D.system.stretchLastSystem })}>
            <NumberRow label="Esquerdo" value={f.system.leftMm} min={0} max={50} step={0.5} digits={1} unit="mm" onCommit={(v) => sys({ leftMm: v })} />
            <NumberRow label="Direito" value={f.system.rightMm} min={0} max={50} step={0.5} digits={1} unit="mm" onCommit={(v) => sys({ rightMm: v })} />
            <ToggleRow label="Justificar último" checked={f.system.stretchLastSystem} onChange={(v) => sys({ stretchLastSystem: v })} />
            <ToggleRow label="Juntar pausas (multi-pausa)" checked={f.system.multiRests} onChange={(v) => sys({ multiRests: v })} />
          </Section>

          <Section title="Distâncias" onReset={() => sys({ systemDistanceMm: D.system.systemDistanceMm, staffDistanceMm: D.system.staffDistanceMm })}>
            <NumberRow label="Entre sistemas" value={f.system.systemDistanceMm} min={0} max={60} step={0.5} digits={1} unit="mm" onCommit={(v) => sys({ systemDistanceMm: v })} />
            <NumberRow label="Entre pautas" value={f.system.staffDistanceMm} min={0} max={40} step={0.5} digits={1} unit="mm" onCommit={(v) => sys({ staffDistanceMm: v })} />
          </Section>
        </TabsContent>

        {/* 3. Element sizing & spacing */}
        <TabsContent value="elements" className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-5">
          <Section title="Cabeças de nota" onReset={() => el({ noteheadScale: D.elements.noteheadScale, symbolScale: D.elements.symbolScale })}>
            <NumberRow label="Global" value={f.elements.noteheadScale} min={0.5} max={1.6} step={0.01} scale={100} unit="%" onCommit={(v) => el({ noteheadScale: v })} />
            <NumberRow label="Símbolos" value={f.elements.symbolScale} min={0.6} max={1.6} step={0.01} scale={100} unit="%" onCommit={(v) => el({ symbolScale: v })} />
            <Row label={selNotes.length ? `Seleção (${selNotes.length})` : 'Seleção'}>
              <Segmented
                value={selSize.mode}
                disabled={!selNotes.length}
                options={[['normal', 'Normal'], ['cue', 'Pequena'], ['custom', 'Pers.']]}
                onChange={(mode) => setSelectionSize(mode, mode === 'custom' ? (selSize.mode === 'custom' ? selSize.scale : 1.2) : 1)}
              />
            </Row>
            {selSize.mode === 'custom' && selNotes.length > 0 && (
              <NumberRow label="Tamanho" value={selSize.scale} min={0.5} max={1.8} step={0.01} scale={100} unit="%" onCommit={(v) => setSelectionSize('custom', v)} />
            )}
          </Section>

          <Section title="Compassos" onReset={() => el({ noteSpacing: D.elements.noteSpacing, measurePadding: D.elements.measurePadding, fixedMeasureWidth: D.elements.fixedMeasureWidth, measureWidth: D.elements.measureWidth })}>
            <NumberRow label="Espaçamento" value={f.elements.noteSpacing} min={0.5} max={2.5} step={0.05} scale={100} unit="%" onCommit={(v) => el({ noteSpacing: v })} />
            <NumberRow label="Margem inicial" value={f.elements.measurePadding} min={0} max={4} step={0.1} digits={1} unit="sp" onCommit={(v) => el({ measurePadding: v })} />
            <ToggleRow label="Largura fixa" checked={f.elements.fixedMeasureWidth} onChange={(v) => el({ fixedMeasureWidth: v })} />
            <NumberRow label="Largura" value={f.elements.measureWidth} min={8} max={60} step={0.5} digits={1} unit="sp" disabled={!f.elements.fixedMeasureWidth} onCommit={(v) => el({ measureWidth: v })} />
          </Section>

          <Section title="Direção das hastes" onReset={() => el({ stemDirection: D.elements.stemDirection, middleLineStem: D.elements.middleLineStem })}>
            <Row label="Direção">
              <Segmented
                value={f.elements.stemDirection}
                options={[['rule', 'Automática'], ['xml', 'Do ficheiro']]}
                onChange={(v) => el({ stemDirection: v })}
              />
            </Row>
            <Row label="Nota na linha do meio">
              <Segmented
                value={f.elements.middleLineStem}
                disabled={f.elements.stemDirection === 'xml'}
                options={[['up', 'Para cima'], ['down', 'Para baixo']]}
                onChange={(v) => el({ middleLineStem: v })}
              />
            </Row>
          </Section>

          <Section title="Hastes, feixes e pausas" onReset={() => el({ stemWidth: D.elements.stemWidth, stemLength: D.elements.stemLength, beamWidth: D.elements.beamWidth, restScale: D.elements.restScale, staffLineWidth: D.elements.staffLineWidth })}>
            <NumberRow label="Espessura da haste" value={f.elements.stemWidth} min={0.05} max={0.4} step={0.01} digits={2} unit="sp" onCommit={(v) => el({ stemWidth: v })} />
            <NumberRow label="Comprimento da haste" value={f.elements.stemLength} min={2} max={5} step={0.1} digits={1} unit="sp" onCommit={(v) => el({ stemLength: v })} />
            <NumberRow label="Espessura do feixe" value={f.elements.beamWidth} min={0.2} max={1} step={0.02} digits={2} unit="sp" onCommit={(v) => el({ beamWidth: v })} />
            <NumberRow label="Pausas" value={f.elements.restScale} min={0.5} max={1.6} step={0.01} scale={100} unit="%" onCommit={(v) => el({ restScale: v })} />
            <NumberRow label="Linhas da pauta" value={f.elements.staffLineWidth} min={0.03} max={0.25} step={0.005} digits={3} unit="sp" onCommit={(v) => el({ staffLineWidth: v })} />
          </Section>

          <Section title="Texto" onReset={() => resetFormatting('text')}>
            <NumberRow label="Título e créditos" value={f.text.title} min={0.5} max={2} step={0.05} scale={100} unit="%" onCommit={(v) => txt({ title: v })} />
            <NumberRow label="Cifras" value={f.text.chords} min={0.5} max={2} step={0.05} scale={100} unit="%" onCommit={(v) => txt({ chords: v })} />
            <NumberRow label="Andamento" value={f.text.tempo} min={0.5} max={2} step={0.05} scale={100} unit="%" onCommit={(v) => txt({ tempo: v })} />
            <NumberRow label="Dinâmicas" value={f.text.dynamics} min={0.5} max={2} step={0.05} scale={100} unit="%" onCommit={(v) => txt({ dynamics: v })} />
            <NumberRow label="Texto de sistema" value={f.text.systemText} min={0.5} max={2} step={0.05} scale={100} unit="%" onCommit={(v) => txt({ systemText: v })} />
            <NumberRow label="Nº de compasso" value={f.text.measureNumbers} min={0.5} max={2} step={0.05} scale={100} unit="%" onCommit={(v) => txt({ measureNumbers: v })} />
          </Section>
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default FormattingPanel;
