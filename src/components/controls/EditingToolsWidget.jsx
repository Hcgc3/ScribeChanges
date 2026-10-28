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
import { Button } from '../ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TooltipProvider } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import MagneticWidget from './MagneticWidget';
import { ToolbarRoot, ToolbarGroup, ToolbarSeparator, ToolbarButton } from './WidgetToolbar';
import { useWidgetOrientation } from '@/lib/stores/widget-store';
import { useScoreStore } from '@/lib/stores/score-store';

const EditingToolsWidget = ({ widgetId }) => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [noteValue, setNoteValue] = useState('quarter');
  const { orientation, tooltipSide } = useWidgetOrientation(widgetId);

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
    { value: 'whole', label: 'Semibreve', short: '1' },
    { value: 'half', label: 'Mínima', short: '1/2' },
    { value: 'quarter', label: 'Semínima', short: '1/4' },
    { value: 'eighth', label: 'Colcheia', short: '1/8' },
    { value: 'sixteenth', label: 'Semicolcheia', short: '1/16' },
  ];

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    // The note tool is note input (same as N); other tools leave it
    if (toolId === 'note') useScoreStore.getState().startEditing();
    else useScoreStore.getState().stopEditing();
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

  const currentNote = noteValues.find((n) => n.value === noteValue);

  return (
    <MagneticWidget widgetId={widgetId}>
      <TooltipProvider>
        <ToolbarRoot orientation={orientation}>
          {/* Tool Selection */}
          <ToolbarGroup orientation={orientation}>
            {tools.map((tool) => (
              <ToolbarButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                tooltipSide={tooltipSide}
                active={selectedTool === tool.id}
                onClick={() => handleToolSelect(tool.id)}
              />
            ))}
          </ToolbarGroup>

          {/* Note Value Selection (when note tool is selected) */}
          {selectedTool === 'note' && (orientation === 'vertical' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 text-[10px] font-medium" title={`Valor da nota: ${currentNote?.label}`}>
                  {currentNote?.short}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side={tooltipSide} align="start">
                <DropdownMenuRadioGroup value={noteValue} onValueChange={setNoteValue}>
                  {noteValues.map((note) => (
                    <DropdownMenuRadioItem key={note.value} value={note.value}>
                      {note.label}
                      <span className="ml-auto text-xs text-muted-foreground">{note.short}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Select value={noteValue} onValueChange={setNoteValue}>
              <SelectTrigger className="h-8 w-32 ml-1" aria-label="Valor da nota">
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
          ))}

          <ToolbarSeparator orientation={orientation} />

          {/* Edit Actions */}
          <ToolbarGroup orientation={orientation}>
            <ToolbarButton icon={RotateCcw} label="Desfazer" shortcut="Ctrl+Z" tooltipSide={tooltipSide} onClick={handleUndo} disabled={!canUndo} />
            <ToolbarButton icon={RotateCw} label="Refazer" shortcut="Ctrl+Y" tooltipSide={tooltipSide} onClick={handleRedo} disabled={!canRedo} />
          </ToolbarGroup>
          <ToolbarGroup orientation={orientation}>
            <ToolbarButton icon={Copy} label="Copiar" shortcut="Ctrl+C" tooltipSide={tooltipSide} onClick={handleCopy} disabled={!hasSelection} />
            <ToolbarButton icon={Scissors} label="Cortar" shortcut="Ctrl+X" tooltipSide={tooltipSide} onClick={handleCut} disabled={!hasSelection} />
            <ToolbarButton icon={Trash2} label="Eliminar" shortcut="Delete" tooltipSide={tooltipSide} onClick={handleDelete} disabled={!hasSelection} destructive />
          </ToolbarGroup>

          <ToolbarSeparator orientation={orientation} />

          {/* Measure Actions */}
          <ToolbarGroup orientation={orientation}>
            <ToolbarButton icon={Plus} label="Adicionar compasso" tooltipSide={tooltipSide} onClick={handleAddMeasure} />
            <ToolbarButton icon={Minus} label="Remover compasso" tooltipSide={tooltipSide} onClick={handleRemoveMeasure} />
          </ToolbarGroup>

          {/* Selection Info */}
          {hasSelection && orientation === 'horizontal' && (
            <div className="pl-2 text-xs text-muted-foreground whitespace-nowrap">
              {selection.type}
              {selection.startMeasure && ` · c. ${selection.startMeasure}`}
            </div>
          )}
        </ToolbarRoot>
      </TooltipProvider>
    </MagneticWidget>
  );
};

export default EditingToolsWidget;

