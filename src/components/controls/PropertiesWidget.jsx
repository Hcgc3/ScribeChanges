import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Music, Clock, Settings, ListMusic, Ruler } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import MagneticWidget from './MagneticWidget';
import { useScoreStore } from '@/lib/stores/score-store';
import { setPlaybackTempo, describePitch, describeDuration } from '@music-editor/score-viewer';
import { useAppStore } from '@/lib/stores/app-store';

// Text field that applies its value on Enter or when it loses focus (each apply
// re-renders the score, so not on every keystroke)
const CommitInput = ({ id, value, onCommit, placeholder }) => {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => setDraft(value || ''), [value]);
  const commit = (next) => { if (next !== (value || '')) onCommit(next); };
  return (
    <Input
      id={id}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className="h-7 text-xs"
      placeholder={placeholder}
    />
  );
};

const ReadOnlyField = ({ label, value, hint }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="h-7 flex items-center text-xs font-medium" title={hint}>{value}</div>
  </div>
);

const PropertiesWidget = ({ widgetId }) => {
  const {
    selection,
    metadata,
    viewSettings,
    updateViewSettings,
    tempo,
    setMetadata,
    renderScore,
  } = useScoreStore(useShallow((s) => ({
    selection: s.selection,
    metadata: s.metadata,
    viewSettings: s.viewSettings,
    updateViewSettings: s.updateViewSettings,
    tempo: s.playbackState.tempo,
    setMetadata: s.setMetadata,
    renderScore: s.renderScore,
  })));

  // Title/composer are drawn by OSMD from the sheet, so change them there and re-render
  const commitText = (field, value) => {
    setMetadata({ ...(metadata || {}), [field]: value });
    renderScore((osmd) => {
      if (field === 'title') osmd.Sheet.TitleString = value;
      if (field === 'composer') osmd.Sheet.ComposerString = value;
    });
  };

  const toggleMeasureNumbers = () => {
    const show = !viewSettings.showMeasureNumbers;
    updateViewSettings({ showMeasureNumbers: show });
    renderScore((osmd) => osmd.setOptions({ drawMeasureNumbers: show }));
  };

  const renderScoreProperties = () => (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Music className="w-3 h-3" />
        Propriedades da Partitura
      </div>

      <div className="space-y-2">
        <div>
          <Label htmlFor="title" className="text-xs">Título</Label>
          <CommitInput id="title" value={metadata?.title} onCommit={(v) => commitText('title', v)} placeholder="Título da partitura" />
        </div>

        <div>
          <Label htmlFor="composer" className="text-xs">Compositor</Label>
          <CommitInput id="composer" value={metadata?.composer} onCommit={(v) => commitText('composer', v)} placeholder="Nome do compositor" />
        </div>

        {/* Changing key/time rewrites the music itself: that belongs to edit mode */}
        <div className="grid grid-cols-2 gap-2">
          <ReadOnlyField label="Tonalidade" value={metadata?.keySignature || '—'} hint="Alterar a tonalidade fica para o modo de edição" />
          <ReadOnlyField label="Compasso" value={metadata?.timeSignature || '—'} hint="Alterar o compasso fica para o modo de edição" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ReadOnlyField label="Compassos" value={metadata?.measures || '—'} />
          <ReadOnlyField label="Instrumentos" value={metadata?.instruments?.join(', ') || '—'} />
        </div>

        <div>
          <Label className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Andamento de reprodução (BPM)
          </Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[tempo]}
              onValueChange={(value) => setPlaybackTempo(value[0])}
              min={30}
              max={300}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 tabular-nums">{tempo}</span>
          </div>
          {metadata?.tempo && metadata.tempo !== tempo && (
            <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setPlaybackTempo(metadata.tempo)}>
              Repor andamento da partitura ({metadata.tempo})
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Selected note(s) from a click on the score (Shift+click for a range); read-only until edit mode
  const renderSelectionProperties = () => {
    const notes = selection?.notes || [];
    const first = notes[0];
    const isRange = selection?.type === 'range';
    return (
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <ListMusic className="w-3 h-3" />
          {isRange ? 'Seleção' : 'Propriedades da Nota'}
        </div>
        {isRange ? (
          <div className="grid grid-cols-2 gap-2">
            <ReadOnlyField label="Notas" value={notes.filter((n) => !n.isRest?.()).length} />
            <ReadOnlyField
              label="Compassos"
              value={selection.startMeasure === selection.endMeasure ? selection.startMeasure : `${selection.startMeasure}–${selection.endMeasure}`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <ReadOnlyField
              label="Altura"
              value={notes.filter((n) => !n.isRest?.()).map(describePitch).join(' · ') || describePitch(first)}
              hint="Altura escrita (como na partitura)"
            />
            <ReadOnlyField label="Duração" value={describeDuration(first)} />
            <ReadOnlyField label="Compasso" value={selection.startMeasure} />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">Editar notas fica disponível no modo de edição.</p>
      </div>
    );
  };

  const renderViewProperties = () => (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Settings className="w-3 h-3" />
        Propriedades de Visualização
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Mostrar Números de Compasso</Label>
        <Button
          variant={viewSettings.showMeasureNumbers ? 'default' : 'outline'}
          size="sm"
          onClick={toggleMeasureNumbers}
          className="h-6 px-2 text-xs"
        >
          {viewSettings.showMeasureNumbers ? 'Sim' : 'Não'}
        </Button>
      </div>
    </div>
  );

  return (
    <MagneticWidget widgetId={widgetId}>
      <div className="properties-content space-y-4">
        {selection ? renderSelectionProperties() : renderScoreProperties()}

        <div className="border-t border-border/20 pt-3">
          {renderViewProperties()}
        </div>
        <div className="border-t border-border/20 pt-3">
          <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => useAppStore.getState().openModal('formatting')}>
            <Ruler className="w-3 h-3 mr-1" />
            Formatação avançada
          </Button>
        </div>
      </div>
    </MagneticWidget>
  );
};

export default PropertiesWidget;
