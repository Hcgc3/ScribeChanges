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
import { TooltipProvider } from '../ui/tooltip';
import MagneticWidget from './MagneticWidget';
import { ToolbarRoot, ToolbarGroup, ToolbarSection, ToolbarSeparator, ToolbarButton } from './WidgetToolbar';
import { useWidgetOrientation } from '@/lib/stores/widget-store';
import { useScoreStore } from '../../lib/stores/score-store';
import { useAppStore } from '@/lib/stores/app-store';

const QuickActionsWidget = ({ widgetId }) => {
  const { orientation, tooltipSide } = useWidgetOrientation(widgetId);
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
      short: '100%',
      icon: RotateCcw,
      shortcut: 'Ctrl+0',
      action: resetZoom,
      disabled: false,
      category: 'view',
    },
    {
      id: 'fullscreen',
      label: 'Ecrã Completo',
      short: 'Ecrã',
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

  const vertical = orientation === 'vertical';

  return (
    <MagneticWidget widgetId={widgetId}>
      <TooltipProvider>
        <ToolbarRoot orientation={orientation} className={vertical ? '' : 'items-start px-1'}>
          {Object.entries(groupedActions).map(([categoryId, actions], index) => {
            const buttons = actions.map((action) => (
              <ToolbarButton
                key={action.id}
                icon={action.icon}
                label={vertical ? `${action.label} · ${categories[categoryId].label}` : action.label}
                caption={vertical ? undefined : action.short || action.label}
                shortcut={action.shortcut}
                tooltipSide={tooltipSide}
                onClick={() => handleAction(action)}
                disabled={action.disabled}
              />
            ));
            return (
              <React.Fragment key={categoryId}>
                {index > 0 && <ToolbarSeparator orientation={orientation} />}
                {vertical
                  ? <ToolbarGroup orientation="vertical">{buttons}</ToolbarGroup>
                  : <ToolbarSection caption={categories[categoryId].label}>{buttons}</ToolbarSection>}
              </React.Fragment>
            );
          })}

          {/* Quick Settings */}
          <ToolbarSeparator orientation={orientation} />
          {vertical ? (
            <ToolbarButton icon={Settings} label="Configurações" tooltipSide={tooltipSide} onClick={() => openModal('settings')} />
          ) : (
            <ToolbarSection caption="Geral">
              <ToolbarButton icon={Settings} label="Configurações" caption="Definições" tooltipSide={tooltipSide} onClick={() => openModal('settings')} />
            </ToolbarSection>
          )}
        </ToolbarRoot>
      </TooltipProvider>
    </MagneticWidget>
  );
};

export default QuickActionsWidget;

