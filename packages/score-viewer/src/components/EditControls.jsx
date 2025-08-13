import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Eye, EyeOff, Ruler } from 'lucide-react';
import { useEditMode } from '../hooks/useEditMode';

const EditControls = ({ osmdInstance, containerRef }) => {
  const {
    editMode,
    toggleEditMode,
    toggleDistances,
    hideElement,
    restoreAllElements
  } = useEditMode();

  if (!editMode.isActive) {
    return (
      <div className="absolute top-5 left-5 z-30">
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => toggleEditMode(osmdInstance, containerRef?.current)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Modo Edição
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-5 left-5 z-30 flex flex-col gap-2">
      {/* Main edit mode toggle */}
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={() => toggleEditMode(osmdInstance, containerRef?.current)}
        className="bg-red-600 hover:bg-red-700"
      >
        <Edit3 className="w-4 h-4 mr-2" />
        Sair da Edição
      </Button>

      {/* Edit controls */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleDistances}
          title="Mostrar/Ocultar Linhas de Distância"
          className={editMode.showDistances ? 'bg-blue-100' : ''}
        >
          <Ruler className="w-4 h-4" />
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => hideElement()}
          title="Ocultar elemento selecionado"
          disabled={!editMode.selectedElement}
        >
          <EyeOff className="w-4 h-4" />
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={restoreAllElements}
          title="Restaurar todos os elementos"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </div>

      {/* Info panel */}
      {editMode.musicalAnalysis && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs text-sm">
          <div className="font-medium mb-1">Análise Musical</div>
          <div className="text-xs text-gray-600">
            <div>Compasso: {editMode.musicalAnalysis.timeSignature.numerator}/{editMode.musicalAnalysis.timeSignature.denominator}</div>
            <div>Compassos: {editMode.musicalAnalysis.measures.length}</div>
            <div>Pontos de controlo: {editMode.controlPoints.length}</div>
          </div>
          
          {editMode.selectedElement && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="font-medium text-xs">Elemento Selecionado:</div>
              <div className="text-xs text-gray-600">
                {editMode.selectedElement.replace(/^(barline|beat|staff|corner)-/, '').replace(/-/g, ' ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EditControls;
