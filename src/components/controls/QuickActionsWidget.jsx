import React from 'react';
import { 
  Zap,
  Save,
  Download,
  Upload,
  Printer,
  Share2,
  Copy,
  Scissors,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import MagneticWidget from './MagneticWidget';
import { useScoreStore } from '@/lib/stores/score-store';
import { useAppStore } from '@/lib/stores/app-store';

const QuickActionsWidget = ({ widgetId }) => {
  const {
    file,
    selection,
    undo,
    redo,
    zoomIn,
    zoomOut,
    resetZoom,
    editHistory,
    editHistoryIndex,
    // exportScore, // removido: não utilizado
  } = useScoreStore();

  const {
    toggleFullscreen,
    openModal,
  } = useAppStore();

  const quickActions = [
    {
      id: 'save',
      label: 'Guardar',
      icon: Save,
      shortcut: 'Ctrl+S',
      action: () => console.log('Save'),
      disabled: !file,
      category: 'file',
    },
    {
      id: 'export',
      label: 'Exportar',
      icon: Download,
      shortcut: 'Ctrl+E',
      action: () => openModal('export-dialog'),
      disabled: !file,
      category: 'file',
    },
    {
      id: 'print',
      label: 'Imprimir',
      icon: Printer,
      shortcut: 'Ctrl+P',
      action: () => window.print(),
      disabled: !file,
      category: 'file',
    },
    {
      id: 'share',
      label: 'Partilhar',
      icon: Share2,
      action: () => openModal('share-dialog'),
      disabled: !file,
      category: 'file',
    },
    {
      id: 'undo',
      label: 'Desfazer',
      icon: RotateCcw,
      shortcut: 'Ctrl+Z',
      action: undo,
      disabled: editHistoryIndex <= 0,
      category: 'edit',
    },
    {
      id: 'redo',
      label: 'Refazer',
      icon: RotateCw,
      shortcut: 'Ctrl+Y',
      action: redo,
      disabled: editHistoryIndex >= editHistory.length - 1,
      category: 'edit',
    },
    {
      id: 'copy',
      label: 'Copiar',
      icon: Copy,
      shortcut: 'Ctrl+C',
      action: () => console.log('Copy'),
      disabled: !selection,
      category: 'edit',
    },
    {
      id: 'cut',
      label: 'Cortar',
      icon: Scissors,
      shortcut: 'Ctrl+X',
      action: () => console.log('Cut'),
      disabled: !selection,
      category: 'edit',
    },
    {
      id: 'zoom-in',
      label: 'Ampliar',
      icon: ZoomIn,
      shortcut: 'Ctrl++',
      action: zoomIn,
      disabled: false,
      category: 'view',
    },
    {
      id: 'zoom-out',
      label: 'Reduzir',
      icon: ZoomOut,
      shortcut: 'Ctrl+-',
      action: zoomOut,
      disabled: false,
      category: 'view',
    },
    {
      id: 'zoom-reset',
      label: 'Zoom 100%',
      icon: RotateCcw,
      shortcut: 'Ctrl+0',
      action: resetZoom,
      disabled: false,
      category: 'view',
    },
    {
      id: 'fullscreen',
      label: 'Ecrã Completo',
      icon: Maximize2,
      shortcut: 'F11',
      action: toggleFullscreen,
      disabled: false,
      category: 'view',
    },
  ];

  const categories = {
    file: { label: 'Ficheiro', color: 'text-blue-600' },
    edit: { label: 'Edição', color: 'text-green-600' },
    view: { label: 'Visualização', color: 'text-purple-600' },
  };

  const groupedActions = quickActions.reduce((groups, action) => {
    if (!groups[action.category]) {
      groups[action.category] = [];
    }
    groups[action.category].push(action);
    return groups;
  }, {});

  const handleAction = (action) => {
    if (!action.disabled && action.action) {
      action.action();
    }
  };

  return (
    <MagneticWidget widgetId={widgetId}>
      <div className="quick-actions-content">
        <TooltipProvider>
          <div className="space-y-3">
            {Object.entries(groupedActions).map(([categoryId, actions]) => {
              const category = categories[categoryId];
              return (
                <div key={categoryId} className="space-y-2">
                  <div className={`text-xs font-medium ${category.color}`}>
                    {category.label}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {actions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Tooltip key={action.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(action)}
                              disabled={action.disabled}
                              className="h-8 p-1 flex flex-col items-center gap-1 hover:bg-primary/10"
                            >
                              <Icon className="w-3 h-3" />
                              <span className="text-xs leading-none">
                                {action.label}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <div>{action.label}</div>
                            {action.shortcut && (
                              <div className="text-muted-foreground">
                                {action.shortcut}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quick Settings */}
            <div className="pt-2 border-t border-border/20">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openModal('settings')}
                className="w-full h-8 flex items-center gap-2 justify-start"
              >
                <Settings className="w-3 h-3" />
                <span className="text-xs">Configurações</span>
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </MagneticWidget>
  );
};

export default QuickActionsWidget;

