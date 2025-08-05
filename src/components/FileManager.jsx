// Sistema de importação e exportação de ficheiros MusicXML
// Integra com aplicação de partitura musical para carregar ficheiros externos
// @param {function} onFileImport - Callback quando ficheiro é carregado com sucesso
// @param {function} onError - Callback para tratamento de erros
// @param {Object} currentFile - Ficheiro atual
// @param {Object} error - Erro atual
import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload,
  Download,
  Music,
  AlertCircle,
  CheckCircle,
  X,
  FolderOpen
} from 'lucide-react';
import musicXMLService from '../services/musicXMLService.js';

/**
 * FileManager - Sistema completo de importação e exportação de ficheiros
 * Integrado com musicXMLService seguindo diretrizes do CUSTOM_PROMPT.md
 */
const FileManager = ({ 
  isVisible, 
  onClose, 
  onFileImport, 
  onError,
  currentFile = null,
  error = null
}) => {
  // Estados para importação
  const [importStatus, setImportStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState(error);
  const [importedFile, setImportedFile] = useState(currentFile);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Estados para exportação
  const [exportFormat, setExportFormat] = useState('musicxml');
  const [exportStatus, setExportStatus] = useState('idle');
  
  // Referência para input de ficheiro
  const fileInputRef = useRef(null);

  // Sincronizar com props externas
  useEffect(() => {
    setImportError(error);
  }, [error]);

  useEffect(() => {
    setImportedFile(currentFile);
  }, [currentFile]);

  // Função para validar ficheiro MusicXML
  const validateMusicXML = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Verificar se é um documento XML válido
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error('Ficheiro XML inválido');
      }
      
      // Verificar se contém elementos MusicXML essenciais
      const scorePartwise = xmlDoc.getElementsByTagName('score-partwise');
      const scoreTimewise = xmlDoc.getElementsByTagName('score-timewise');
      
      if (scorePartwise.length === 0 && scoreTimewise.length === 0) {
        throw new Error('Ficheiro não contém estrutura MusicXML válida');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Erro na validação: ${error.message}`);
    }
  };

  // Função para ler conteúdo do ficheiro
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      // Verificar tamanho do ficheiro (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('Ficheiro muito grande. Máximo permitido: 10MB'));
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler ficheiro'));
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 50; // 50% para leitura
          setImportProgress(progress);
        }
      };
      
      reader.readAsText(file);
    });
  };

  // Processar ficheiro importado usando musicXMLService
  const processImportedFile = async (file) => {
    setImportStatus('uploading');
    setImportProgress(0);
    setImportError(null);
    setProgressMessage('Iniciando importação...');
    
    try {
      // Configurar callback de progresso
      const unsubscribe = musicXMLService.onProgress(({ progress, message }) => {
        setImportProgress(progress);
        setProgressMessage(message);
      });

      setImportStatus('processing');
      
      // Usar musicXMLService para importação completa
      const importedData = await musicXMLService.importFile(file);
      
      // Limpeza
      unsubscribe();
      
      setImportStatus('success');
      setImportProgress(100);
      setProgressMessage('Importação concluída com sucesso!');
      setImportedFile(file);
      
      // Chamar callback do componente pai
      if (onFileImport) {
        onFileImport(file, importedData.rawXML);
      }
      
      return importedData;
      
    } catch (error) {
      setImportStatus('error');
      setImportError(error.message);
      setProgressMessage(`Erro: ${error.message}`);
      
      if (onError) {
        onError(error.message);
      }
      
      throw error;
    }
  };

  // Handler para seleção de ficheiro
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processImportedFile(file);
    }
  };

  // Handler para drag & drop
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processImportedFile(files[0]);
    }
  };

  // Exportar partitura atual
  const handleExport = async () => {
    if (!currentScore) {
      onError?.(new Error('Nenhuma partitura carregada para exportar'));
      return;
    }
    
    setExportStatus('processing');
    
    try {
      let exportData;
      let fileName;
      let mimeType;
      
      switch (exportFormat) {
        case 'musicxml':
          exportData = currentScore.xmlContent || generateMusicXML(currentScore);
          fileName = `partitura_${Date.now()}.xml`;
          mimeType = 'application/xml';
          break;
          
        case 'midi':
          exportData = generateMIDI(currentScore);
          fileName = `partitura_${Date.now()}.mid`;
          mimeType = 'audio/midi';
          break;
          
        case 'json':
          exportData = JSON.stringify(currentScore, null, 2);
          fileName = `partitura_${Date.now()}.json`;
          mimeType = 'application/json';
          break;
          
        default:
          throw new Error('Formato de exportação não suportado');
      }
      
      // Criar e download do ficheiro
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setExportStatus('success');
      
    } catch (error) {
      setExportStatus('error');
      onError?.(error);
    }
  };

  // Função placeholder para gerar MusicXML
  const generateMusicXML = (score) => {
    // Esta função seria implementada com lógica específica para converter
    // a estrutura interna da partitura para MusicXML
    return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work>
    <work-title>Partitura Exportada</work-title>
  </work>
  <identification>
    <creator type="software">Sheet Music App</creator>
    <encoding>
      <software>Sheet Music App</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
  </identification>
  <!-- Conteúdo da partitura seria gerado aqui -->
</score-partwise>`;
  };

  // Função placeholder para gerar MIDI
  const generateMIDI = (score) => {
    // Esta função seria implementada com uma biblioteca como midi-writer-js
    // Por agora, retorna um ficheiro MIDI básico
    return new Uint8Array([
      0x4D, 0x54, 0x68, 0x64, // Cabeçalho MIDI
      0x00, 0x00, 0x00, 0x06, // Tamanho do cabeçalho
      0x00, 0x00, // Formato 0
      0x00, 0x01, // 1 track
      0x00, 0x60, // 96 ticks por quarter note
    ]);
  };

  // Reset do estado
  const resetImportState = () => {
    setImportStatus('idle');
    setImportProgress(0);
    setImportError(null);
    setImportedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Gerenciador de Ficheiros
          </DialogTitle>
          <DialogDescription>
            Importe ficheiros MusicXML ou exporte a partitura atual usando o serviço integrado.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </TabsTrigger>
          </TabsList>

          {/* Tab: Importação */}
          <TabsContent value="import" className="space-y-4">
            {importStatus === 'idle' && (
              <>
                {/* Área de drag & drop */}
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    Arraste ficheiros aqui ou clique para selecionar
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Formatos suportados: .xml, .musicxml (.mxl em desenvolvimento)
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Selecionar Ficheiro
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xml,.musicxml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </>
            )}

            {(importStatus === 'uploading' || importStatus === 'processing') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">{progressMessage}</span>
                </div>
                <Progress value={importProgress} className="w-full" />
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">
                    {importStatus === 'uploading' ? 'A carregar ficheiro...' : 'A processar...'}
                  </h3>
                  <Progress value={importProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {importProgress.toFixed(0)}% concluído
                  </p>
                </div>
              </div>
            )}

            {importStatus === 'success' && importedFile && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ficheiro "{importedFile.name}" carregado com sucesso!
                  <br />
                  Tamanho: {(importedFile.size / 1024).toFixed(1)} KB
                </AlertDescription>
              </Alert>
            )}

            {importStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {importError}
                </AlertDescription>
              </Alert>
            )}

            {(importStatus === 'success' || importStatus === 'error') && (
              <div className="flex justify-center">
                <Button onClick={resetImportState} variant="outline">
                  Importar Outro Ficheiro
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tab: Exportação */}
          <TabsContent value="export" className="space-y-4">
            {!currentScore ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma partitura carregada. Importe um ficheiro primeiro para poder exportar.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato de Exportação:</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="musicxml">MusicXML (.xml)</option>
                    <option value="midi">MIDI (.mid)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p><strong>MusicXML:</strong> Formato padrão para intercâmbio de partituras</p>
                  <p><strong>MIDI:</strong> Para reprodução em software de áudio</p>
                  <p><strong>JSON:</strong> Formato interno da aplicação</p>
                </div>

                <Button 
                  onClick={handleExport} 
                  disabled={exportStatus === 'processing'}
                  className="w-full"
                >
                  {exportStatus === 'processing' ? 'A Exportar...' : 'Exportar Partitura'}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileManager;
