// Componente React para edição básica de partituras MusicXML
// Integra com OSMD para renderização dinâmica e validação
// @param {string} musicXML - MusicXML atual para editar
// @param {function} onMusicXMLChange - Callback para alterações
// @param {function} onError - Callback para erros de validação
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/card';
import { Button } from '@ui/button';
import { Textarea } from '@ui/textarea';
import { Alert, AlertDescription } from '@ui/alert';
import { ErrorBoundary } from './ErrorHandler.jsx';
import { Pencil, Save, Music, AlertCircle } from 'lucide-react';

/**
 * NotationEditor - Editor básico de MusicXML
 * Permite editar o XML da partitura e validar em tempo real
 */
const NotationEditor = ({ musicXML = '', onMusicXMLChange, onError }) => {
  const [xmlValue, setXmlValue] = useState(musicXML);
  const [validationError, setValidationError] = useState(null);

  // Validação básica de MusicXML
  const validateMusicXML = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error('MusicXML inválido: erro de parsing XML');
      }
      const scorePartwise = xmlDoc.getElementsByTagName('score-partwise');
      if (scorePartwise.length === 0) {
        throw new Error('MusicXML inválido: estrutura score-partwise ausente');
      }
      return true;
    } catch (error) {
      setValidationError(error.message);
      onError?.(error);
      return false;
    }
  };

  // Handler para alterações
  const handleChange = (e) => {
    const value = e.target.value;
    setXmlValue(value);
    setValidationError(null);
  };

  // Handler para salvar
  const handleSave = () => {
    if (validateMusicXML(xmlValue)) {
      onMusicXMLChange?.(xmlValue);
    }
  };

  return (
    <ErrorBoundary context="notation-editor">
      <Card className="max-w-2xl mx-auto my-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editor de Partitura (MusicXML)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={xmlValue}
            onChange={handleChange}
            rows={16}
            className="font-mono text-xs"
            aria-label="Editor MusicXML"
          />
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2 justify-end">
            <Button onClick={handleSave} variant="default" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
            <Button onClick={() => setXmlValue(musicXML)} variant="outline" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Repor Original
            </Button>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

export default NotationEditor;
