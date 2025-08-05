// Componente React para painel de configurações e preferências do utilizador
// Integra com sistema de widgets magnéticos e persistência local
// @param {boolean} isOpen - Estado de visibilidade do painel
// @param {function} onClose - Callback para fechar painel
// @param {Object} settings - Objeto com configurações atuais
// @param {function} onSettingsChange - Callback para mudanças de configuração
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@ui/dialog';
import { Button } from '@ui/button';
import { Slider } from '@ui/slider';
import { Switch } from '@ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/tabs';
import { Label } from '@ui/label';
import { Separator } from '@ui/separator';
import { 
  Settings, 
  Volume2, 
  Eye, 
  Keyboard, 
  Palette, 
  Accessibility,
  Save,
  RotateCcw
} from 'lucide-react';

/**
 * SettingsPanel - Painel de configurações e preferências
 * Permite configurar audio, visual, acessibilidade e comportamento da aplicação
 */
const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  settings = {}, 
  onSettingsChange 
}) => {
  console.log('SettingsPanel props:', { isOpen });

  // Estados locais para configurações
  const [localSettings, setLocalSettings] = useState({
    // Configurações de Audio
    masterVolume: 0.7,
    enableMetronome: false,
    metronomeVolume: 0.5,
    audioLatency: 'auto',
    
    // Configurações Visuais
    theme: 'light',
    zoomSensitivity: 1.0,
    showMeasureNumbers: true,
    showBeatIndicators: true,
    enableAnimations: true,
    
    // Configurações de Comportamento
    autoSave: true,
    autoSaveInterval: 30,
    enableKeyboardShortcuts: true,
    magneticWidgetsEnabled: true,
    
    // Configurações de Acessibilidade
    highContrast: false,
    largeText: false,
    screenReaderMode: false,
    reduceMotion: false,
    
    ...settings
  });

  // Sincronizar com settings externos
  useEffect(() => {
    setLocalSettings(prev => ({ ...prev, ...settings }));
  }, [settings]);

  // Handler para mudanças de configuração
  const handleSettingChange = (key, value) => {
    console.log('🎨 Settings Change:', { key, value }); // Debug log
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    // Notificar componente pai imediatamente para algumas configurações críticas
    if (['masterVolume', 'theme', 'enableAnimations'].includes(key)) {
      onSettingsChange?.(newSettings);
    }
  };

  // Salvar todas as configurações
  const handleSaveSettings = () => {
    onSettingsChange?.(localSettings);
    
    // Persistir no localStorage
    localStorage.setItem('sheetMusicAppSettings', JSON.stringify(localSettings));
    
    onClose();
  };

  // Resetar para defaults
  const handleResetSettings = () => {
    const defaultSettings = {
      masterVolume: 0.7,
      enableMetronome: false,
      metronomeVolume: 0.5,
      audioLatency: 'auto',
      theme: 'light',
      zoomSensitivity: 1.0,
      showMeasureNumbers: true,
      showBeatIndicators: true,
      enableAnimations: true,
      autoSave: true,
      autoSaveInterval: 30,
      enableKeyboardShortcuts: true,
      magneticWidgetsEnabled: true,
      highContrast: false,
      largeText: false,
      screenReaderMode: false,
      reduceMotion: false
    };
    
    setLocalSettings(defaultSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="settings-description" className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
          </DialogTitle>
          <DialogDescription id="settings-description">
            Personalize a aplicação de partitura musical conforme suas preferências.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Comportamento
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Acessibilidade
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configurações de Áudio */}
          <TabsContent value="audio" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="master-volume">Volume Principal: {Math.round(localSettings.masterVolume * 100)}%</Label>
                <Slider
                  id="master-volume"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[localSettings.masterVolume]}
                  onValueChange={([value]) => handleSettingChange('masterVolume', value)}
                  className="mt-2"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Metrônomo</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar som de metrônomo durante reprodução
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableMetronome}
                  onCheckedChange={(checked) => handleSettingChange('enableMetronome', checked)}
                />
              </div>

              {localSettings.enableMetronome && (
                <div>
                  <Label htmlFor="metronome-volume">Volume do Metrônomo: {Math.round(localSettings.metronomeVolume * 100)}%</Label>
                  <Slider
                    id="metronome-volume"
                    min={0}
                    max={1}
                    step={0.01}
                    value={[localSettings.metronomeVolume]}
                    onValueChange={([value]) => handleSettingChange('metronomeVolume', value)}
                    className="mt-2"
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Latência de Áudio</Label>
                <Select 
                  value={localSettings.audioLatency} 
                  onValueChange={(value) => handleSettingChange('audioLatency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="low">Baixa (&lt; 20ms)</SelectItem>
                    <SelectItem value="medium">Média (20-50ms)</SelectItem>
                    <SelectItem value="high">Alta (&gt; 50ms)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Latências menores podem causar instabilidade em alguns dispositivos
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Configurações Visuais */}
          <TabsContent value="visual" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tema</Label>
                <Select 
                  value={localSettings.theme} 
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="zoom-sensitivity">Sensibilidade do Zoom: {localSettings.zoomSensitivity.toFixed(1)}x</Label>
                <Slider
                  id="zoom-sensitivity"
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  value={[localSettings.zoomSensitivity]}
                  onValueChange={([value]) => handleSettingChange('zoomSensitivity', value)}
                  className="mt-2"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Números de Compasso</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar numeração dos compassos
                  </p>
                </div>
                <Switch
                  checked={localSettings.showMeasureNumbers}
                  onCheckedChange={(checked) => handleSettingChange('showMeasureNumbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Indicadores de Tempo</Label>
                  <p className="text-sm text-muted-foreground">
                    Destacar visualmente os tempos do compasso
                  </p>
                </div>
                <Switch
                  checked={localSettings.showBeatIndicators}
                  onCheckedChange={(checked) => handleSettingChange('showBeatIndicators', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animações</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar transições e animações visuais
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableAnimations}
                  onCheckedChange={(checked) => handleSettingChange('enableAnimations', checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Configurações de Comportamento */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Salvamento Automático</Label>
                  <p className="text-sm text-muted-foreground">
                    Salvar workspace automaticamente
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                />
              </div>

              {localSettings.autoSave && (
                <div>
                  <Label htmlFor="autosave-interval">Intervalo de Salvamento: {localSettings.autoSaveInterval}s</Label>
                  <Slider
                    id="autosave-interval"
                    min={10}
                    max={300}
                    step={10}
                    value={[localSettings.autoSaveInterval]}
                    onValueChange={([value]) => handleSettingChange('autoSaveInterval', value)}
                    className="mt-2"
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Atalhos de Teclado</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar shortcuts para ações comuns
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableKeyboardShortcuts}
                  onCheckedChange={(checked) => handleSettingChange('enableKeyboardShortcuts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Widgets Magnéticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir arrastar widgets pela tela
                  </p>
                </div>
                <Switch
                  checked={localSettings.magneticWidgetsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('magneticWidgetsEnabled', checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Tab: Configurações de Acessibilidade */}
          <TabsContent value="accessibility" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alto Contraste</Label>
                  <p className="text-sm text-muted-foreground">
                    Aumentar contraste para melhor visibilidade
                  </p>
                </div>
                <Switch
                  checked={localSettings.highContrast}
                  onCheckedChange={(checked) => handleSettingChange('highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Texto Grande</Label>
                  <p className="text-sm text-muted-foreground">
                    Aumentar tamanho dos textos da interface
                  </p>
                </div>
                <Switch
                  checked={localSettings.largeText}
                  onCheckedChange={(checked) => handleSettingChange('largeText', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Leitor de Tela</Label>
                  <p className="text-sm text-muted-foreground">
                    Otimizar para tecnologias assistivas
                  </p>
                </div>
                <Switch
                  checked={localSettings.screenReaderMode}
                  onCheckedChange={(checked) => handleSettingChange('screenReaderMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Reduzir Movimento</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimizar animações e transições
                  </p>
                </div>
                <Switch
                  checked={localSettings.reduceMotion}
                  onCheckedChange={(checked) => handleSettingChange('reduceMotion', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;
