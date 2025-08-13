import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, FileText } from 'lucide-react';
import { useScoreStore } from '@/lib/stores/score-store';

const PAGE_PRESETS = {
  'a4-portrait': { name: 'A4 Portrait', width: 210, height: 297, unit: 'mm' },
  'a4-landscape': { name: 'A4 Landscape', width: 297, height: 210, unit: 'mm' },
  'a3-portrait': { name: 'A3 Portrait', width: 297, height: 420, unit: 'mm' },
  'a3-landscape': { name: 'A3 Landscape', width: 420, height: 297, unit: 'mm' },
  'letter-portrait': { name: 'Letter Portrait', width: 216, height: 279, unit: 'mm' },
  'letter-landscape': { name: 'Letter Landscape', width: 279, height: 216, unit: 'mm' },
  'legal-portrait': { name: 'Legal Portrait', width: 216, height: 356, unit: 'mm' },
  'tabloid-portrait': { name: 'Tabloid Portrait', width: 279, height: 432, unit: 'mm' },
  'custom': { name: 'Custom', width: 210, height: 297, unit: 'mm' }
};

const PageSizeEditor = () => {
  const { pageSettings, osmdInstance, applyPageSettings } = useScoreStore(); // updatePageSettings removido: não utilizado
  const [selectedPreset, setSelectedPreset] = useState('a4-portrait');
  const [customWidth, setCustomWidth] = useState(210);
  const [customHeight, setCustomHeight] = useState(297);
  const [unit, setUnit] = useState('mm');
  const [isApplying, setIsApplying] = useState(false);
  const [margins, setMargins] = useState({ topMm: 12, rightMm: 12, bottomMm: 14, leftMm: 12 });
  const [warning, setWarning] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Initialize from current page settings
  useEffect(() => {
    if (pageSettings) {
      setCustomWidth(pageSettings.width || 210);
      setCustomHeight(pageSettings.height || 297);
      setUnit(pageSettings.unit || 'mm');
      
      // Try to match a preset
      const matchingPreset = Object.entries(PAGE_PRESETS).find(([, preset]) => 
        preset.width === pageSettings.width && 
        preset.height === pageSettings.height &&
        preset.unit === pageSettings.unit
      );
      setSelectedPreset(matchingPreset ? matchingPreset[0] : 'custom');

      if (pageSettings.margins) setMargins(pageSettings.margins);
      setDirty(false);
    }
  }, [pageSettings]);

  useEffect(() => {
    // Mark dirty if any difference from applied
    if (!pageSettings) return;
    const changed = (
      pageSettings.width !== customWidth ||
      pageSettings.height !== customHeight ||
      pageSettings.unit !== unit ||
      JSON.stringify(pageSettings.margins) !== JSON.stringify(margins) ||
      selectedPreset !== pageSettings.preset
    );
    setDirty(changed);
  }, [customWidth, customHeight, unit, margins, selectedPreset, pageSettings]);

  const handlePresetChange = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey !== 'custom') {
      const preset = PAGE_PRESETS[presetKey];
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
      setUnit(preset.unit);
    }
  };

  // ...existing code...

  const applyPageSize = async () => {
    if (!osmdInstance) return;
    setIsApplying(true);
    try {
      const result = await applyPageSettings({
        width: customWidth,
        height: customHeight,
        unit,
        preset: selectedPreset,
        margins,
      });
      if (!result.ok) {
        console.error('Failed to apply page settings:', result.error);
      } else {
        setWarning(result.warning || null);
      }
    } catch (error) {
      console.error('Error applying page size:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const resetToDefault = () => {
    handlePresetChange('a4-portrait');
  };

  const swapDimensions = () => {
    const temp = customWidth;
    setCustomWidth(customHeight);
    setCustomHeight(temp);
    setSelectedPreset('custom');
  };

  const isValid = customWidth >= 40 && customWidth <= 2000 && customHeight >= 40 && customHeight <= 2000;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Page Size Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Selection */}
        <div className="space-y-2">
          <Label>Preset</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_PRESETS).map(([key, preset]) => (
                <SelectItem key={key} value={key}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Custom Dimensions */}
        <div className="space-y-3">
          <Label>Dimensions</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={customWidth}
                onChange={(e) => {
                  setCustomWidth(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                min="50"
                max="2000"
                step="1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={customHeight}
                onChange={(e) => {
                  setCustomHeight(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                min="50"
                max="2000"
                step="1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Unit</Label>
            <Select value={unit} onValueChange={(value) => {
              setUnit(value);
              setSelectedPreset('custom');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="px">Pixels (px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Margins */}
        <div className="space-y-3">
          <Label>Margins (mm)</Label>
          <div className="grid grid-cols-4 gap-2">
            {['topMm','rightMm','bottomMm','leftMm'].map(key => (
              <div key={key} className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{key.replace('Mm','')}</Label>
                <Input
                  type="number"
                  value={margins[key]}
                  onChange={(e) => {
                    const v = Math.max(0, Number(e.target.value));
                    setMargins(prev => ({ ...prev, [key]: v }));
                  }}
                  min="0"
                  max="100"
                  step="1"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={swapDimensions}
              variant="outline"
              size="sm"
              className="flex-1"
              title="Swap width and height"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Rotate
            </Button>
            <Button
              onClick={resetToDefault}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Reset
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => useScoreStore.getState().undo()}
            >
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => useScoreStore.getState().redo()}
            >
              Redo
            </Button>
          </div>
          <Button
            onClick={applyPageSize}
            disabled={isApplying || !osmdInstance || !isValid || !dirty}
            className="w-full"
            size="sm"
          >
            {isApplying ? 'Applying...' : 'Apply Size'}
          </Button>
        </div>

        {warning && (
          <div className="text-xs text-amber-600 bg-amber-100 border border-amber-300 p-2 rounded">
            Redução de páginas: {warning.pagesBefore} → {warning.pagesAfter} ({warning.dropPct}%)
          </div>
        )}

        {/* Preview Info */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded space-y-0.5">
          <div>Preview: {customWidth} × {customHeight} {unit}</div>
          <div>Last Applied: {pageSettings?.lastAppliedFormat || '—'}</div>
          <div>{Math.round(pageSettings?.widthMm || 0)} × {Math.round(pageSettings?.heightMm || 0)} mm</div>
          <div>Margins: {Object.values(pageSettings?.margins || {}).join('/')} mm</div>
          <div>({Math.round(pageSettings?.widthPx || 0)} × {Math.round(pageSettings?.heightPx || 0)} px)</div>
          {!isValid && (
            <div className="text-red-600">Valores devem estar entre 40 e 2000</div>
          )}
          {!dirty && <div className="text-green-600">Sem alterações</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default PageSizeEditor;
