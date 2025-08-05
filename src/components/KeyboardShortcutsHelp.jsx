// Sistema de ajuda para atalhos de teclado da aplicação musical
// Integra com sistema de configurações para mostrar/ocultar shortcuts ativos
// @param {boolean} isOpen - Estado de visibilidade do painel de ajuda
// @param {function} onClose - Callback para fechar painel
// @param {Object} settings - Configurações atuais da aplicação
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Keyboard,
  Search,
  Music,
  Play,
  Navigation,
  Settings,
  Command,
  Zap
} from 'lucide-react';

/**
 * KeyboardShortcutsHelp - Sistema completo de ajuda para atalhos de teclado
 * Organizado por categoria e com funcionalidade de pesquisa
 */
const KeyboardShortcutsHelp = ({ 
  isOpen, 
  onClose, 
  settings = {} 
}) => {
  // Estado para pesquisa
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredShortcuts, setFilteredShortcuts] = useState([]);

  // Definição completa de todos os atalhos
  const allShortcuts = {
    playback: [
      {
        keys: ['Space'],
        description: 'Play/Pause reprodução',
        enabled: true,
        category: 'Reprodução'
      },
      {
        keys: ['Shift', 'Space'],
        description: 'Parar reprodução',
        enabled: true,
        category: 'Reprodução'
      },
      {
        keys: ['←', '→'],
        description: 'Navegar por compassos',
        enabled: true,
        category: 'Reprodução'
      },
      {
        keys: ['↑', '↓'],
        description: 'Ajustar volume (±5%)',
        enabled: true,
        category: 'Reprodução'
      },
      {
        keys: ['Shift', '↑', '↓'],
        description: 'Ajustar tempo (±5 BPM)',
        enabled: true,
        category: 'Reprodução'
      },
      {
        keys: ['L'],
        description: 'Toggle modo loop',
        enabled: true,
        category: 'Reprodução'
      },
      {
        keys: ['M'],
        description: 'Toggle mute',
        enabled: true,
        category: 'Reprodução'
      }
    ],
    navigation: [
      {
        keys: ['Ctrl', '+'],
        description: 'Zoom in',
        enabled: true,
        category: 'Navegação'
      },
      {
        keys: ['Ctrl', '-'],
        description: 'Zoom out',
        enabled: true,
        category: 'Navegação'
      },
      {
        keys: ['Ctrl', '0'],
        description: 'Reset zoom (100%)',
        enabled: true,
        category: 'Navegação'
      },
      {
        keys: ['F'],
        description: 'Toggle fullscreen',
        enabled: true,
        category: 'Navegação'
      },
      {
        keys: ['G'],
        description: 'Toggle grid',
        enabled: true,
        category: 'Navegação'
      },
      {
        keys: ['Ctrl', 'D'],
        description: 'Duplicar seleção',
        enabled: settings.enableKeyboardShortcuts !== false,
        category: 'Navegação'
      }
    ],
    selection: [
      {
        keys: ['S'],
        description: 'Ativar ferramenta de seleção',
        enabled: true,
        category: 'Seleção'
      },
      {
        keys: ['Ctrl', 'A'],
        description: 'Selecionar tudo',
        enabled: true,
        category: 'Seleção'
      },
      {
        keys: ['Escape'],
        description: 'Limpar seleção',
        enabled: true,
        category: 'Seleção'
      },
      {
        keys: ['Delete'],
        description: 'Deletar seleção',
        enabled: true,
        category: 'Seleção'
      },
      {
        keys: ['Ctrl', 'C'],
        description: 'Copiar seleção',
        enabled: true,
        category: 'Seleção'
      },
      {
        keys: ['Ctrl', 'V'],
        description: 'Colar',
        enabled: true,
        category: 'Seleção'
      }
    ],
    interface: [
      {
        keys: ['Ctrl', ','],
        description: 'Abrir configurações',
        enabled: true,
        category: 'Interface'
      },
      {
        keys: ['?'],
        description: 'Mostrar ajuda (este painel)',
        enabled: true,
        category: 'Interface'
      },
      {
        keys: ['Ctrl', 'O'],
        description: 'Abrir ficheiro',
        enabled: true,
        category: 'Interface'
      },
      {
        keys: ['Ctrl', 'S'],
        description: 'Salvar projeto',
        enabled: settings.autoSave !== true,
        category: 'Interface'
      },
      {
        keys: ['Ctrl', 'Shift', 'S'],
        description: 'Exportar partitura',
        enabled: true,
        category: 'Interface'
      },
      {
        keys: ['A'],
        description: 'Toggle análise IA',
        enabled: true,
        category: 'Interface'
      },
      {
        keys: ['1', '2', '3'],
        description: 'Alternar entre widgets magnéticos',
        enabled: settings.magneticWidgetsEnabled !== false,
        category: 'Interface'
      }
    ],
    advanced: [
      {
        keys: ['Ctrl', 'Z'],
        description: 'Desfazer',
        enabled: true,
        category: 'Avançado'
      },
      {
        keys: ['Ctrl', 'Y'],
        description: 'Refazer',
        enabled: true,
        category: 'Avançado'
      },
      {
        keys: ['Ctrl', 'Shift', 'R'],
        description: 'Recarregar partitura',
        enabled: true,
        category: 'Avançado'
      },
      {
        keys: ['Ctrl', 'Shift', 'I'],
        description: 'Toggle ferramentas de desenvolvimento',
        enabled: true,
        category: 'Avançado'
      },
      {
        keys: ['Ctrl', 'Shift', 'T'],
        description: 'Alternar renderizador (Básico/Avançado)',
        enabled: true,
        category: 'Avançado'
      },
      {
        keys: ['Ctrl', 'Shift', 'M'],
        description: 'Toggle modo metrônomo',
        enabled: settings.enableMetronome !== false,
        category: 'Avançado'
      }
    ]
  };

  // Filtrar atalhos baseado na pesquisa
  useEffect(() => {
    if (!searchTerm) {
      setFilteredShortcuts([]);
      return;
    }

    const filtered = [];
    Object.entries(allShortcuts).forEach(([category, shortcuts]) => {
      shortcuts.forEach(shortcut => {
        const searchLower = searchTerm.toLowerCase();
        const matchesDescription = shortcut.description.toLowerCase().includes(searchLower);
        const matchesKeys = shortcut.keys.some(key => 
          key.toLowerCase().includes(searchLower)
        );
        
        if (matchesDescription || matchesKeys) {
          filtered.push({ ...shortcut, categoryKey: category });
        }
      });
    });
    
    setFilteredShortcuts(filtered);
  }, [searchTerm]);

  // Renderizar teclas de atalho
  const renderKeys = (keys) => {
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 text-xs bg-muted border rounded font-mono">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-muted-foreground">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Renderizar lista de atalhos
  const renderShortcutsList = (shortcuts, showCategory = false) => {
    return (
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div 
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              shortcut.enabled 
                ? 'bg-background' 
                : 'bg-muted/50 opacity-60'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {shortcut.description}
                </span>
                {!shortcut.enabled && (
                  <Badge variant="secondary" className="text-xs">
                    Desativado
                  </Badge>
                )}
                {showCategory && (
                  <Badge variant="outline" className="text-xs">
                    {shortcut.category}
                  </Badge>
                )}
              </div>
            </div>
            <div className="ml-4">
              {renderKeys(shortcut.keys)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Contagem de atalhos ativos
  const getTotalShortcuts = () => {
    return Object.values(allShortcuts).flat().length;
  };

  const getActiveShortcuts = () => {
    return Object.values(allShortcuts).flat().filter(s => s.enabled).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            {getActiveShortcuts()} de {getTotalShortcuts()} atalhos ativos. 
            Configure em Configurações {">"} Comportamento.
          </DialogDescription>
        </DialogHeader>

        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar atalhos... (ex: 'play', 'zoom', 'ctrl')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resultados da pesquisa */}
        {searchTerm && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="font-medium">
                Resultados da pesquisa ({filteredShortcuts.length})
              </span>
            </div>
            
            {filteredShortcuts.length > 0 ? (
              renderShortcutsList(filteredShortcuts, true)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Keyboard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum atalho encontrado para "{searchTerm}"</p>
              </div>
            )}
          </div>
        )}

        {/* Tabs por categoria (apenas quando não há pesquisa) */}
        {!searchTerm && (
          <Tabs defaultValue="playback" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="playback" className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span className="hidden sm:inline">Reprodução</span>
              </TabsTrigger>
              <TabsTrigger value="navigation" className="flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                <span className="hidden sm:inline">Navegação</span>
              </TabsTrigger>
              <TabsTrigger value="selection" className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                <span className="hidden sm:inline">Seleção</span>
              </TabsTrigger>
              <TabsTrigger value="interface" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">Interface</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span className="hidden sm:inline">Avançado</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="playback" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Music className="h-5 w-5" />
                <h3 className="text-lg font-medium">Controles de Reprodução</h3>
              </div>
              {renderShortcutsList(allShortcuts.playback)}
            </TabsContent>

            <TabsContent value="navigation" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="h-5 w-5" />
                <h3 className="text-lg font-medium">Navegação e Visualização</h3>
              </div>
              {renderShortcutsList(allShortcuts.navigation)}
            </TabsContent>

            <TabsContent value="selection" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Command className="h-5 w-5" />
                <h3 className="text-lg font-medium">Seleção e Edição</h3>
              </div>
              {renderShortcutsList(allShortcuts.selection)}
            </TabsContent>

            <TabsContent value="interface" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5" />
                <h3 className="text-lg font-medium">Interface e Ficheiros</h3>
              </div>
              {renderShortcutsList(allShortcuts.interface)}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5" />
                <h3 className="text-lg font-medium">Funcionalidades Avançadas</h3>
              </div>
              {renderShortcutsList(allShortcuts.advanced)}
            </TabsContent>
          </Tabs>
        )}

        <Separator />

        {/* Footer com informações adicionais */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>💡 Dica: Pressione "?" a qualquer momento para abrir esta ajuda</span>
            <span>
              {settings.enableKeyboardShortcuts === false && "⚠️ Atalhos desativados nas configurações"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
              Limpar Pesquisa
            </Button>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
