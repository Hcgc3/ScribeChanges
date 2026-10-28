import React, { useState } from 'react';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAppStore } from '@/lib/stores/app-store';
import { useScoreStore } from '@/lib/stores/score-store';
import {
  INSTRUMENT_GROUPS, INSTRUMENTS, TIME_SIGNATURES, DEFAULT_NEW_SCORE, buildNewScoreXml, keyName,
} from '@music-editor/score-viewer';

// Paper -> [OSMD page format code, width mm, height mm] (portrait)
const PAPER = { a4: ['A4', 210, 297], a3: ['A3', 297, 420], letter: ['Letter', 216, 279] };
const KEYS = Array.from({ length: 15 }, (_, i) => i - 7);

const Label = ({ children }) => <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;

const Segmented = ({ value, options, onChange }) => (
  <div className="inline-flex rounded-md border border-border/40 p-0.5">
    {options.map(([key, label]) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        className={`px-2.5 h-7 rounded text-xs transition-colors ${value === key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
      >
        {label}
      </button>
    ))}
  </div>
);

const NewScoreDialog = () => {
  const open = useAppStore((s) => s.modals.newScore);
  const closeModal = useAppStore((s) => s.closeModal);
  const [o, setO] = useState(DEFAULT_NEW_SCORE);
  const set = (patch) => setO((prev) => ({ ...prev, ...patch }));

  const addInstrument = (id) => set({ instruments: [...o.instruments, id] });
  const removeInstrument = (index) => set({ instruments: o.instruments.filter((_, i) => i !== index) });
  const moveInstrument = (index, delta) => {
    const next = [...o.instruments];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set({ instruments: next });
  };

  const create = () => {
    const { loadScore, updatePageSettings, osmdInstance } = useScoreStore.getState();
    const [code, w, h] = PAPER[o.paper];
    const [width, height] = o.landscape ? [h, w] : [w, h];
    const pageFormat = `${code}_${o.landscape ? 'L' : 'P'}`;
    // Page first: the viewer sizes the page and OSMD reads the format from these settings
    updatePageSettings({
      width, height, unit: 'mm', widthMm: width, heightMm: height,
      preset: `${o.paper}-${o.landscape ? 'landscape' : 'portrait'}`,
      lastAppliedFormat: pageFormat,
    });
    if (osmdInstance) osmdInstance.setOptions({ pageFormat });
    const title = o.title.trim() || DEFAULT_NEW_SCORE.title;
    loadScore({ name: `${title}.musicxml`, content: buildNewScoreXml({ ...o, title }) });
    closeModal('newScore');
  };

  return (
    <Dialog open={!!open} onOpenChange={(v) => { if (!v) closeModal('newScore'); }}>
      <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/20">
          <DialogTitle>Nova partitura</DialogTitle>
          <DialogDescription className="sr-only">Instrumentos, compasso, tonalidade e página</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_1.1fr] max-h-[70vh]">
          {/* Instruments */}
          <div className="flex flex-col min-h-0 border-r border-border/20">
            <div className="px-5 pt-4 pb-2"><Label>Instrumentos</Label></div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-3">
              {INSTRUMENT_GROUPS.map((group) => (
                <div key={group.label}>
                  <div className="px-2 pb-1 text-[11px] text-muted-foreground">{group.label}</div>
                  {group.items.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => addInstrument(inst.id)}
                      className="w-full flex items-center justify-between px-2 h-7 rounded text-sm hover:bg-accent group"
                    >
                      <span>{inst.name}</span>
                      <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="border-t border-border/20 px-3 py-2 space-y-1 max-h-44 overflow-y-auto">
              <div className="px-2 pb-1 text-[11px] text-muted-foreground">Na partitura ({o.instruments.length})</div>
              {o.instruments.length === 0 && <div className="px-2 text-xs text-muted-foreground">Nenhum instrumento</div>}
              {o.instruments.map((id, index) => (
                <div key={`${id}-${index}`} className="flex items-center gap-1 px-2 h-7 rounded bg-accent/40 text-sm">
                  <span className="flex-1 truncate">{INSTRUMENTS[id]?.name}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveInstrument(index, -1)} disabled={index === 0} title="Subir"><ChevronUp className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveInstrument(index, 1)} disabled={index === o.instruments.length - 1} title="Descer"><ChevronDown className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeInstrument(index)} title="Remover"><X className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Score settings */}
          <div className="overflow-y-auto px-5 py-4 space-y-5">
            <div className="space-y-2">
              <Label>Partitura</Label>
              <Input value={o.title} onChange={(e) => set({ title: e.target.value })} placeholder="Título" className="h-8" />
              <Input value={o.composer} onChange={(e) => set({ composer: e.target.value })} placeholder="Compositor" className="h-8" />
            </div>

            <div className="space-y-2">
              <Label>Compasso</Label>
              <div className="grid grid-cols-5 gap-1">
                {TIME_SIGNATURES.map((ts) => (
                  <button
                    key={ts}
                    type="button"
                    onClick={() => set({ time: ts })}
                    className={`h-8 rounded border text-sm tabular-nums transition-colors ${o.time === ts ? 'border-primary bg-primary text-primary-foreground' : 'border-border/40 hover:bg-accent'}`}
                  >
                    {ts}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tonalidade</Label>
              <div className="flex items-center gap-2">
                <Select value={String(o.fifths)} onValueChange={(v) => set({ fifths: Number(v) })}>
                  <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KEYS.map((k) => (
                      <SelectItem key={k} value={String(k)}>
                        {keyName(k, o.mode)} <span className="text-muted-foreground text-xs ml-1">{k === 0 ? '' : `${Math.abs(k)}${k > 0 ? '♯' : '♭'}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Segmented value={o.mode} options={[['major', 'Maior'], ['minor', 'menor']]} onChange={(mode) => set({ mode })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Andamento (♩ =)</Label>
                <Input type="number" min={20} max={400} value={o.tempo} onChange={(e) => set({ tempo: Number(e.target.value) || 100 })} className="h-8" />
              </div>
              <div className="space-y-2">
                <Label>Compassos</Label>
                <Input type="number" min={1} max={999} value={o.measures} onChange={(e) => set({ measures: Number(e.target.value) || 1 })} className="h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Página</Label>
              <div className="flex items-center gap-2">
                <Select value={o.paper} onValueChange={(paper) => set({ paper })}>
                  <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="a3">A3</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
                <Segmented value={o.landscape ? 'l' : 'p'} options={[['p', 'Retrato'], ['l', 'Paisagem']]} onChange={(v) => set({ landscape: v === 'l' })} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/20">
          <Button variant="ghost" onClick={() => closeModal('newScore')}>Cancelar</Button>
          <Button onClick={create} disabled={!o.instruments.length}>Criar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewScoreDialog;
