import React, { useState } from 'react';
import { 
  MousePointer2,
  Edit3,
  Music,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Copy,
  Scissors,
  Trash2,
  Move,
  Type,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MagneticWidget from './MagneticWidget';
import { useScoreStore } from '@/lib/stores/score-store';

const EditingToolsWidget = ({ widgetId }) => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [noteValue, setNoteValue] = useState('quarter');

  const {
    selection,
    // setSelection, // removido: não utilizado
    clearSelection,
    undo,
    redo,
    editHistory,
    editHistoryIndex,
  } = useScoreStore();

  const tools = [
    { id: 'select', label: 'Selecionar', icon: MousePointer2 },
    { id: 'note', label: 'Nota', icon: Music },
    { id: 'rest', label: 'Pausa', icon: Hash },
    { id: 'text', label: 'Texto', icon: Type },
    { id: 'move', label: 'Mover', icon: Move },
  ];

  const noteValues = [
    { value: 'whole', label: 'Semibreve' },
    { value: 'half', label: 'Mínima' },
    { value: 'quarter', label: 'Semínima' },
    { value: 'eighth', label: 'Colcheia' },
    { value: 'sixteenth', label: 'Semicolcheia' },
  ];

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    console.log('Tool selected:', toolId);
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleCopy = () => {
    if (selection) {
      console.log('Copy selection:', selection);
    }
  };

  const handleCut = () => {
    if (selection) {
      console.log('Cut selection:', selection);
    }
  };

  const handleDelete = () => {
    if (selection) {
      console.log('Delete selection:', selection);
      clearSelection();
    }
  };

  const handleAddMeasure = () => {
    console.log('Add measure');
  };

  const handleRemoveMeasure = () => {
    console.log('Remove measure');
  };

  const canUndo = editHistoryIndex > 0;
  const canRedo = editHistoryIndex < editHistory.length - 1;
  const hasSelection = !!selection;

  return (
    <MagneticWidget widgetId={widgetId}>
      <div className="editing-tools-content space-y-3 overflow-hidden">
        {/* Tool Selection */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Ferramenta</div>
          <TooltipProvider>
            <div className="grid grid-cols-4 gap-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const active = selectedTool === tool.id;
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={active ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => handleToolSelect(tool.id)}
                        className={`h-8 w-full p-0 flex items-center justify-center ${active ? '' : ''}`}
                        title={tool.label}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {tool.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Note Value Selection (when note tool is selected) */}
        {selectedTool === 'note' && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Valor da Nota</div>
            <Select value={noteValue} onValueChange={setNoteValue}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteValues.map((note) => (
                  <SelectItem key={note.value} value={note.value}>
                    {note.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Edit Actions */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Ações</div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-8 px-2 flex items-center gap-2 justify-start"
              title="Desfazer (Ctrl+Z)"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-xs truncate">Desfazer</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-8 px-2 flex items-center gap-2 justify-start"
              title="Refazer (Ctrl+Y)"
            >
              <RotateCw className="w-3 h-3" />
              <span className="text-xs truncate">Refazer</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!hasSelection}
              className="h-8 px-2 flex items-center gap-2 justify-start"
              title="Copiar (Ctrl+C)"
            >
              <Copy className="w-3 h-3" />
              <span className="text-xs truncate">Copiar</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCut}
              disabled={!hasSelection}
              className="h-8 px-2 flex items-center gap-2 justify-start"
              title="Cortar (Ctrl+X)"
            >
              <Scissors className="w-3 h-3" />
              <span className="text-xs truncate">Cortar</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={!hasSelection}
              className="h-8 px-2 flex items-center gap-2 justify-start text-destructive hover:text-destructive"
              title="Eliminar (Delete)"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-xs truncate">Eliminar</span>
            </Button>
          </div>
        </div>

        {/* Measure Actions */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Compassos</div>
          <div className="grid grid-cols-2 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddMeasure}
              className="h-8 px-2 flex items-center gap-2 justify-start"
              title="Adicionar Compasso"
            >
              <Plus className="w-3 h-3" />
              <span className="text-xs truncate">Adicionar</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveMeasure}
              className="h-8 px-2 flex items-center gap-2 justify-start"
              title="Remover Compasso"
            >
              <Minus className="w-3 h-3" />
              <span className="text-xs truncate">Remover</span>
            </Button>
          </div>
        </div>

        {/* Selection Info */}
        {hasSelection && (
          <div className="pt-2 border-t border-border/20">
            <div className="text-xs font-medium text-muted-foreground mb-1">Seleção</div>
            <div className="text-xs text-muted-foreground">
              Tipo: {selection.type}
              {selection.startMeasure && (
                <div>Compasso: {selection.startMeasure}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </MagneticWidget>
  );
};

export default EditingToolsWidget;

