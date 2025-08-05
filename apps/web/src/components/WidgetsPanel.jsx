// Painel de Widgets - Organiza todos os widgets e ferramentas visuais
// @param {boolean} isOpen - Estado de visibilidade do painel
// @param {function} onClose - Callback para fechar painel
// @param {Object} widgetStates - Estados de todos os widgets
// @param {Object} handlers - Handlers para controlar widgets

import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle 
} from '@ui/dialog';
import { Button } from '@ui/button';
import { Switch } from '@ui/switch';
import { Label } from '@ui/label';
import { Separator } from '@ui/separator';
import { 
  Clock,
  Hash,
  Music,
  Brain,
  Edit,
  Play,
  Gauge,
  Activity,
  X,
  Navigation,
  BarChart3,
  MousePointer
} from 'lucide-react';

const WidgetsPanel = ({ 
  isOpen, 
  onClose, 
  widgetStates, 
  onWidgetToggle,
  theme 
}) => {
  const widgetCategories = [
    {
      title: "Ferramentas de Partitura",
      widgets: [
        {
          id: 'measureNumbers',
          title: 'Números de Compasso',
          description: 'Exibe numeração dos compassos na partitura',
          icon: Hash,
          state: widgetStates.showMeasureNumbers,
          subState: widgetStates.measureNumbersVisible,
          subStateLabel: 'Visível na interface'
        },
        {
          id: 'tempoMap',
          title: 'Mapa de Tempo',
          description: 'Visualização e controle do mapa de tempo',
          icon: Clock,
          state: widgetStates.showTempoMap,
          subState: null,
          subStateLabel: null
        }
      ]
    },
    {
      title: "Widgets Interativos",
      widgets: [
        {
          id: 'playbackControls',
          title: 'Controles de Reprodução',
          description: 'Widget de controle de playback de áudio',
          icon: Play,
          state: widgetStates.showPlayback,
          subState: null,
          subStateLabel: null
        },
        {
          id: 'navigationControls',
          title: 'Controles de Navegação',
          description: 'Widget de navegação e zoom da partitura',
          icon: Navigation,
          state: widgetStates.showNavigation,
          subState: null,
          subStateLabel: null
        },
        {
          id: 'analysisWidget',
          title: 'Widget de Análise',
          description: 'Análise interativa da partitura musical',
          icon: BarChart3,
          state: widgetStates.showAnalysis,
          subState: null,
          subStateLabel: null
        }
      ]
    },
    {
      title: "Painéis e Editores",
      widgets: [
        {
          id: 'analysisPanel',
          title: 'Painel de Análise IA',
          description: 'Análise inteligente da partitura musical',
          icon: Brain,
          state: widgetStates.showAnalysisPanel,
          subState: null,
          subStateLabel: null
        },
        {
          id: 'audioEngine',
          title: 'Motor de Áudio',
          description: 'Controles avançados de reprodução de áudio',
          icon: Activity,
          state: widgetStates.showAudioEngine,
          subState: null,
          subStateLabel: null
        },
        {
          id: 'practiceMode',
          title: 'Modo de Prática',
          description: 'Ferramentas para prática e estudo',
          icon: Play,
          state: widgetStates.showPracticeMode,
          subState: null,
          subStateLabel: null
        },
        {
          id: 'notationEditor',
          title: 'Editor de Notação',
          description: 'Editor para modificar partituras',
          icon: Edit,
          state: widgetStates.showNotationEditor,
          subState: null,
          subStateLabel: null
        }
      ]
    }
  ];

  // Flatten all widgets for the "toggle all" functionality
  const allWidgets = widgetCategories.flatMap(category => category.widgets);

  const handleWidgetToggle = (widgetId, isSubState = false) => {
    console.log('🎛️ WidgetsPanel - Handler called!', { widgetId, isSubState, onWidgetToggle: typeof onWidgetToggle });
    
    if (typeof onWidgetToggle !== 'function') {
      console.error('❌ onWidgetToggle is not a function!', onWidgetToggle);
      return;
    }
    
    console.log('🎛️ WidgetsPanel - Calling parent toggle:', { widgetId, isSubState });
    onWidgetToggle(widgetId, isSubState);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto widgets-panel-content ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700 text-white' 
          : 'bg-white border-gray-200'
      }`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Gauge className="h-5 w-5" />
              <span>Painel de Widgets</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Gerencie a visibilidade e configurações de todos os widgets e ferramentas da aplicação.
          </p>

          <Separator />

          <div className="space-y-6">
            {widgetCategories.map((category, categoryIndex) => (
              <div key={category.title}>
                {/* Category Header */}
                <div className="mb-3">
                  <h4 className={`text-sm font-semibold ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {category.title}
                  </h4>
                  <div className={`h-px mt-1 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`} />
                </div>

                {/* Category Widgets */}
                <div className="space-y-3">
                  {category.widgets.map((widget) => {
                    const Icon = widget.icon;
                    const isActive = widget.state;
                    
                    return (
                      <div
                        key={widget.id}
                        onClick={() => {
                          console.log('🎛️ Widget box clicked for:', widget.id);
                          handleWidgetToggle(widget.id);
                        }}
                        className={`widget-box p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                          isActive
                            ? theme === 'dark'
                              ? 'bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-500/20'
                              : 'bg-blue-50 border-blue-500 shadow-lg shadow-blue-500/20'
                            : theme === 'dark'
                              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`h-6 w-6 mt-0.5 ${
                            isActive 
                              ? 'text-blue-500' 
                              : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-medium ${
                                isActive
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : (theme === 'dark' ? 'text-white' : 'text-gray-900')
                              }`}>
                                {widget.title}
                              </h3>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                isActive
                                  ? 'bg-blue-500 text-white'
                                  : theme === 'dark'
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 text-gray-600'
                              }`}>
                                {isActive ? 'ATIVO' : 'INATIVO'}
                              </div>
                            </div>
                            <p className={`text-sm mt-1 ${
                              isActive
                                ? 'text-blue-600/80 dark:text-blue-300/80'
                                : (theme === 'dark' ? 'text-gray-400' : 'text-gray-600')
                            }`}>
                              {widget.description}
                            </p>
                            
                            {/* Sub-estado para widgets que têm configurações adicionais */}
                            {widget.subState !== null && widget.state && (
                              <div 
                                className="mt-3 p-2 rounded border border-blue-300 dark:border-blue-600 bg-blue-100/50 dark:bg-blue-900/20"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevenir que o clique na caixa pai seja acionado
                                  console.log('🎛️ Sub-option clicked for:', widget.id);
                                  handleWidgetToggle(widget.id, true);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <Label 
                                    htmlFor={`${widget.id}-sub`}
                                    className={`text-sm cursor-pointer ${
                                      theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                                    }`}
                                  >
                                    {widget.subStateLabel}
                                  </Label>
                                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                                    widget.subState
                                      ? 'bg-blue-500 text-white'
                                      : theme === 'dark'
                                        ? 'bg-gray-600 text-gray-300'
                                        : 'bg-gray-300 text-gray-600'
                                  }`}>
                                    {widget.subState ? 'SIM' : 'NÃO'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                // Desativar todos os widgets
                allWidgets.forEach(widget => {
                  if (widget.state) {
                    handleWidgetToggle(widget.id);
                  }
                });
              }}
              className={`text-sm ${
                theme === 'dark'
                  ? 'border-red-600 text-red-400 hover:bg-red-900/20'
                  : 'border-red-500 text-red-600 hover:bg-red-50'
              }`}
            >
              Desativar Todos
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Ativar todos os widgets principais
                  allWidgets.forEach(widget => {
                    if (!widget.state) {
                      handleWidgetToggle(widget.id);
                    }
                  });
                }}
                className={`text-sm ${
                  theme === 'dark'
                    ? 'border-blue-600 text-blue-400 hover:bg-blue-900/20'
                    : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                }`}
              >
                Ativar Todos
              </Button>
              <Button
                onClick={onClose}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetsPanel;
