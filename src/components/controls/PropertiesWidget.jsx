import React from 'react';
import { 
  Music, 
  Clock, 
  Volume2, 
  Hash, 
  Type,
  Palette,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import MagneticWidget from './MagneticWidget';
import { useScoreStore } from '@/lib/stores/score-store';
import EngravingSettingsPanel from './EngravingSettingsPanel';

const PropertiesWidget = ({ widgetId }) => {
  const {
    selection,
    metadata,
    viewSettings,
    updateViewSettings,
  } = useScoreStore();

  const keySignatures = [
    { value: 'C', label: 'Dó Maior' },
    { value: 'G', label: 'Sol Maior' },
    { value: 'D', label: 'Ré Maior' },
    { value: 'A', label: 'Lá Maior' },
    { value: 'E', label: 'Mi Maior' },
    { value: 'B', label: 'Si Maior' },
    { value: 'F#', label: 'Fá# Maior' },
    { value: 'C#', label: 'Dó# Maior' },
    { value: 'F', label: 'Fá Maior' },
    { value: 'Bb', label: 'Sib Maior' },
    { value: 'Eb', label: 'Mib Maior' },
    { value: 'Ab', label: 'Láb Maior' },
    { value: 'Db', label: 'Réb Maior' },
    { value: 'Gb', label: 'Solb Maior' },
    { value: 'Cb', label: 'Dób Maior' },
  ];

  const timeSignatures = [
    { value: '4/4', label: '4/4' },
    { value: '3/4', label: '3/4' },
    { value: '2/4', label: '2/4' },
    { value: '6/8', label: '6/8' },
    { value: '9/8', label: '9/8' },
    { value: '12/8', label: '12/8' },
    { value: '2/2', label: '2/2' },
    { value: '3/2', label: '3/2' },
  ];

  const handlePropertyChange = (property, value) => {
    console.log('Property changed:', property, value);
    // Here you would update the selected element's properties
  };

  const handleViewSettingChange = (setting, value) => {
    updateViewSettings({ [setting]: value });
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
          <Input
            id="title"
            value={metadata?.title || ''}
            onChange={(e) => handlePropertyChange('title', e.target.value)}
            className="h-7 text-xs"
            placeholder="Título da partitura"
          />
        </div>

        <div>
          <Label htmlFor="composer" className="text-xs">Compositor</Label>
          <Input
            id="composer"
            value={metadata?.composer || ''}
            onChange={(e) => handlePropertyChange('composer', e.target.value)}
            className="h-7 text-xs"
            placeholder="Nome do compositor"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="key" className="text-xs">Tonalidade</Label>
            <Select 
              value={metadata?.keySignature || 'C'} 
              onValueChange={(value) => handlePropertyChange('keySignature', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keySignatures.map((key) => (
                  <SelectItem key={key.value} value={key.value}>
                    {key.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="time" className="text-xs">Compasso</Label>
            <Select 
              value={metadata?.timeSignature || '4/4'} 
              onValueChange={(value) => handlePropertyChange('timeSignature', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeSignatures.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="tempo" className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Tempo (BPM)
          </Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[metadata?.tempo || 120]}
              onValueChange={(value) => handlePropertyChange('tempo', value[0])}
              min={60}
              max={200}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8">
              {metadata?.tempo || 120}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNoteProperties = () => (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Music className="w-3 h-3" />
        Propriedades da Nota
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Altura</Label>
            <Select defaultValue="C4">
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="C4">Dó4</SelectItem>
                <SelectItem value="D4">Ré4</SelectItem>
                <SelectItem value="E4">Mi4</SelectItem>
                <SelectItem value="F4">Fá4</SelectItem>
                <SelectItem value="G4">Sol4</SelectItem>
                <SelectItem value="A4">Lá4</SelectItem>
                <SelectItem value="B4">Si4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Duração</Label>
            <Select defaultValue="quarter">
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whole">Semibreve</SelectItem>
                <SelectItem value="half">Mínima</SelectItem>
                <SelectItem value="quarter">Semínima</SelectItem>
                <SelectItem value="eighth">Colcheia</SelectItem>
                <SelectItem value="sixteenth">Semicolcheia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Dinâmica
          </Label>
          <Select defaultValue="mf">
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pp">Pianissimo (pp)</SelectItem>
              <SelectItem value="p">Piano (p)</SelectItem>
              <SelectItem value="mp">Mezzo-piano (mp)</SelectItem>
              <SelectItem value="mf">Mezzo-forte (mf)</SelectItem>
              <SelectItem value="f">Forte (f)</SelectItem>
              <SelectItem value="ff">Fortissimo (ff)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderViewProperties = () => (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Settings className="w-3 h-3" />
        Propriedades de Visualização
      </div>

      <div className="space-y-2">
        <div>
          <Label className="text-xs">Modo de Visualização</Label>
          <Select 
            value={viewSettings.viewMode} 
            onValueChange={(value) => handleViewSettingChange('viewMode', value)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="page">Página</SelectItem>
              <SelectItem value="continuous">Contínuo</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Mostrar Números de Compasso</Label>
          <Button
            variant={viewSettings.showMeasureNumbers ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewSettingChange('showMeasureNumbers', !viewSettings.showMeasureNumbers)}
            className="h-6 px-2 text-xs"
          >
            {viewSettings.showMeasureNumbers ? 'Sim' : 'Não'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Mostrar Números de Página</Label>
          <Button
            variant={viewSettings.showPageNumbers ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewSettingChange('showPageNumbers', !viewSettings.showPageNumbers)}
            className="h-6 px-2 text-xs"
          >
            {viewSettings.showPageNumbers ? 'Sim' : 'Não'}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Redimensionamento Automático</Label>
          <Button
            variant={viewSettings.autoResize ? "default" : "outline"}
            size="sm"
            onClick={() => handleViewSettingChange('autoResize', !viewSettings.autoResize)}
            className="h-6 px-2 text-xs"
          >
            {viewSettings.autoResize ? 'Sim' : 'Não'}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <MagneticWidget widgetId={widgetId}>
      <div className="properties-content space-y-4">
        {/* Render different property panels based on selection */}
        {!selection && renderScoreProperties()}
        {selection?.type === 'note' && renderNoteProperties()}
        {selection?.type === 'measure' && renderScoreProperties()}
        
        {/* Always show view properties */}
        <div className="border-t border-border/20 pt-3">
          {renderViewProperties()}
        </div>
        {/* Engraving settings panel */}
        <div className="border-t border-border/20 pt-3">
          <EngravingSettingsPanel />
        </div>
      </div>
    </MagneticWidget>
  );
};

export default PropertiesWidget;

