import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useScoreStore } from '@/lib/stores/score-store';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings2, RefreshCcw } from 'lucide-react';

/**
 * EngravingSettingsPanel
 * Provides runtime tweaking of selected OSMD EngravingRules + a few option level properties via setOptions.
 * NOTE: Many engraving values are not exposed through osmd.setOptions directly; we mutate EngravingRules where needed
 * and trigger a re-render. We defensively probe for property names (different OSMD versions may differ slightly).
 */
const EngravingSettingsPanel = ({ className = '' }) => {
  const { osmdInstance } = useScoreStore();
  const [ready, setReady] = useState(false);
  const renderDebounceRef = useRef(null);

  // Local state snapshot so sliders are controlled. Units are kept in logical OSMD units (staff space fractions).
  const [values, setValues] = useState({
    noteSpacing: 1.0,          // conceptual spacing factor we map onto several internal distances
    staffLineThickness: 0.12,  // EngravingRules.StaffLineWidth typical ~0.11 - 0.15
    titleFontSize: 16,         // EngravingRules.TitleFontSize (points)
    lyricFontSize: 11,         // EngravingRules.LyricFontSize (points)
    pageFormat: 'A4_Portrait', // setOptions
    background: '#FFFFFF',     // page color
  });

  // Helper to safely set an EngravingRules property if it exists under any of provided candidate keys.
  const setRule = (rules, candidates, value) => {
    if (!rules) return false;
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(rules, key)) {
        try { rules[key] = value; return true; } catch { /* ignore */ }
      }
    }
    return false;
  };

  const getFirstExistingRuleValue = (rules, candidates, fallback) => {
    if (!rules) return fallback;
    for (const key of candidates) {
      if (Object.prototype.hasOwnProperty.call(rules, key)) {
        return rules[key];
      }
    }
    return fallback;
  };

  // Initialize from current EngravingRules when OSMD ready
  useEffect(() => {
    if (!osmdInstance) return;
    const rules = osmdInstance.EngravingRules || osmdInstance.rules || osmdInstance.engravingRules;
    if (!rules) return;
    setValues(v => ({
      ...v,
      staffLineThickness: getFirstExistingRuleValue(rules, ['StaffLineWidth','StaffLineThickness'], v.staffLineThickness),
      titleFontSize: getFirstExistingRuleValue(rules, ['TitleFontSize','TitleFontHeight'], v.titleFontSize),
      lyricFontSize: getFirstExistingRuleValue(rules, ['LyricFontSize','LyricFontHeight','LyricsFontSize'], v.lyricFontSize),
      // Derive noteSpacing from one of several spacing rules (choose MinimumDistanceBetweenNotes if exists)
      noteSpacing: getFirstExistingRuleValue(rules, ['MinimumDistanceBetweenNotes','DefaultRestNoteDistance'], v.noteSpacing),
      pageFormat: (osmdInstance?.osmdOptions?.pageFormat) || v.pageFormat,
      background: (osmdInstance?.osmdOptions?.pageBackgroundColor) || v.background,
    }));
    setReady(true);
  }, [osmdInstance]);

  // Debounced render after rule changes
  const scheduleRender = useCallback(() => {
    if (!osmdInstance) return;
    if (renderDebounceRef.current) clearTimeout(renderDebounceRef.current);
    renderDebounceRef.current = setTimeout(() => {
      try { osmdInstance.render(); } catch { /* ignore */ }
    }, 180);
  }, [osmdInstance]);

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (!osmdInstance) return;
    const rules = osmdInstance.EngravingRules || osmdInstance.rules || osmdInstance.engravingRules;

    switch (field) {
      case 'staffLineThickness':
        setRule(rules, ['StaffLineWidth','StaffLineThickness'], value);
        break;
      case 'titleFontSize':
        setRule(rules, ['TitleFontSize','TitleFontHeight'], value);
        break;
      case 'lyricFontSize':
        setRule(rules, ['LyricFontSize','LyricFontHeight','LyricsFontSize'], value);
        break;
      case 'noteSpacing': {
        // Apply to multiple spacing-related rules proportionally if available.
        // We scale a base factor (1.0) -> multiply existing base distances.
        const targets = [
          'MinimumDistanceBetweenNotes',
          'DefaultRestNoteDistance',
          'MinimumStaffLineDistance', // optional
        ];
        targets.forEach(k => {
          if (rules && Object.prototype.hasOwnProperty.call(rules, k)) {
            const baseKey = `__base_${k}`;
            if (rules[baseKey] == null) rules[baseKey] = rules[k]; // store base
            try { rules[k] = rules[baseKey] * value; } catch { /* ignore */ }
          }
        });
        break; }
      case 'pageFormat':
        try { osmdInstance.setOptions({ pageFormat: value }); } catch { /* ignore */ }
        break;
      case 'background':
        try { osmdInstance.setOptions({ pageBackgroundColor: value }); } catch { /* ignore */ }
        break;
      default:
        break;
    }
    // For rule changes (not setOptions) we still need re-render.
    scheduleRender();
  };

  const resetDefaults = () => {
    if (!osmdInstance) return;
    const rules = osmdInstance.EngravingRules || osmdInstance.rules || osmdInstance.engravingRules;
    if (rules) {
      // Attempt to reset by re-applying drawingParameters preset if available
      try { osmdInstance.setOptions({ drawingParameters: 'default' }); } catch { /* ignore */ }
    }
    setReady(false);
    setTimeout(() => {
      try { osmdInstance.render(); } catch { /* ignore */ }
      setReady(true);
    }, 50);
  };

  if (!osmdInstance) {
    return <div className={`p-3 text-xs text-muted-foreground ${className}`}>OSMD não inicializado.</div>;
  }

  return (
    <div className={`engraving-settings-panel p-3 space-y-4 text-xs ${className}`}>\n      <div className="flex items-center gap-2 font-medium text-sm"><Settings2 className="w-4 h-4" /> Configurações de Gravação</div>

      {/* Note Spacing */}
      <div className="space-y-1">
        <Label className="text-xs">Espaçamento entre Notas <span className="text-[10px] text-muted-foreground">(fator)</span></Label>
        <div className="flex items-center gap-2">
          <Slider value={[values.noteSpacing]} onValueChange={v => handleChange('noteSpacing', v[0])} min={0.5} max={2} step={0.05} className="flex-1" />
          <Input value={values.noteSpacing.toFixed(2)} onChange={e => handleChange('noteSpacing', parseFloat(e.target.value)||1)} className="h-7 w-16 text-center" />
        </div>
      </div>

      {/* Staff Line Thickness */}
      <div className="space-y-1">
        <Label className="text-xs">Espessura da Linha de Pauta</Label>
        <div className="flex items-center gap-2">
          <Slider value={[values.staffLineThickness]} onValueChange={v => handleChange('staffLineThickness', v[0])} min={0.05} max={0.25} step={0.005} className="flex-1" />
          <Input value={values.staffLineThickness.toFixed(3)} onChange={e => handleChange('staffLineThickness', parseFloat(e.target.value)||0.12)} className="h-7 w-20 text-center" />
        </div>
      </div>

      {/* Title Font Size */}
      <div className="space-y-1">
        <Label className="text-xs">Tamanho do Título (pt)</Label>
        <div className="flex items-center gap-2">
          <Slider value={[values.titleFontSize]} onValueChange={v => handleChange('titleFontSize', v[0])} min={8} max={48} step={1} className="flex-1" />
          <Input value={values.titleFontSize} onChange={e => handleChange('titleFontSize', parseInt(e.target.value)||16)} className="h-7 w-16 text-center" />
        </div>
      </div>

      {/* Lyric Font Size */}
      <div className="space-y-1">
        <Label className="text-xs">Tamanho da Letra da Letra (pt)</Label>
        <div className="flex items-center gap-2">
          <Slider value={[values.lyricFontSize]} onValueChange={v => handleChange('lyricFontSize', v[0])} min={6} max={24} step={0.5} className="flex-1" />
          <Input value={values.lyricFontSize} onChange={e => handleChange('lyricFontSize', parseFloat(e.target.value)||11)} className="h-7 w-16 text-center" />
        </div>
      </div>

      {/* Page Format */}
      <div className="space-y-1">
        <Label className="text-xs">Formato da Página</Label>
        <Select value={values.pageFormat} onValueChange={v => handleChange('pageFormat', v)}>
          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A4_Portrait">A4 (Retrato)</SelectItem>
            <SelectItem value="A4_Landscape">A4 (Paisagem)</SelectItem>
            <SelectItem value="Endless">Endless</SelectItem>
            <SelectItem value="Letter_Portrait">Carta (Retrato)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Background Color */}
      <div className="space-y-1">
        <Label className="text-xs">Cor de Fundo</Label>
        <div className="flex items-center gap-2">
          <Input type="color" value={values.background} onChange={e => handleChange('background', e.target.value)} className="h-7 w-14 p-1" />
          <Input value={values.background} onChange={e => handleChange('background', e.target.value)} className="h-7 text-center" />
        </div>
      </div>

      <div className="pt-1 flex justify-between gap-2">
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={resetDefaults}><RefreshCcw className="w-3 h-3 mr-1" />Reset</Button>
        {!ready && <div className="text-[10px] text-muted-foreground">A inicializar...</div>}
      </div>
    </div>
  );
};

export default EngravingSettingsPanel;
