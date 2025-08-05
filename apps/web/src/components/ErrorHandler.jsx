// Sistema de gestão de erros user-friendly para aplicação de partitura musical
// Integra com todos os componentes para capturar e exibir erros de forma amigável
// @param {Error} error - Objeto de erro capturado
// @param {function} onRetry - Callback para tentar novamente
// @param {function} onDismiss - Callback para dispensar erro
// @param {string} context - Contexto onde o erro ocorreu (audio, file, render, etc)
import React, { useState, useEffect } from 'react';
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from '@ui/alert';
import { Button } from '@ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@ui/dialog';
import { Badge } from '@ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@ui/collapsible';
import { 
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  RefreshCw,
  X,
  ChevronDown,
  Copy,
  Bug,
  Volume2,
  FileX,
  Wifi
} from 'lucide-react';

/**
 * ErrorHandler - Sistema completo de gestão de erros
 * Categoriza erros e fornece soluções específicas para contexto musical
 */
const ErrorHandler = ({ 
  error, 
  onRetry, 
  onDismiss, 
  context = 'general',
  showDetailed = true 
}) => {
  const [isDetailedOpen, setIsDetailedOpen] = useState(showDetailed);
  const [copied, setCopied] = useState(false);

  // Categorização de erros baseada no contexto e mensagem
  const categorizeError = (error, context) => {
    const message = error?.message?.toLowerCase() || '';
    
    // Erros de Audio/AudioContext
    if (context === 'audio' || message.includes('audiocontext') || message.includes('tone')) {
      return {
        type: 'audio',
        severity: 'warning',
        icon: Volume2,
        title: 'Erro de Áudio',
        category: 'Audio Engine'
      };
    }
    
    // Erros de Ficheiro
    if (context === 'file' || message.includes('file') || message.includes('xml') || message.includes('musicxml')) {
      return {
        type: 'file',
        severity: 'error',
        icon: FileX,
        title: 'Erro de Ficheiro',
        category: 'File Management'
      };
    }
    
    // Erros de Renderização OSMD
    if (context === 'render' || message.includes('osmd') || message.includes('render')) {
      return {
        type: 'render',
        severity: 'error',
        icon: AlertCircle,
        title: 'Erro de Renderização',
        category: 'Sheet Music Display'
      };
    }
    
    // Erros de Rede
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'network',
        severity: 'warning',
        icon: Wifi,
        title: 'Erro de Rede',
        category: 'Network'
      };
    }
    
    // Erro genérico
    return {
      type: 'general',
      severity: 'error',
      icon: AlertTriangle,
      title: 'Erro da Aplicação',
      category: 'General'
    };
  };

  // Obter sugestões de solução baseadas no tipo de erro
  const getSuggestions = (errorInfo, error) => {
    const suggestions = [];
    
    switch (errorInfo.type) {
      case 'audio':
        suggestions.push(
          'Certifique-se de que interagiu com a página antes de tocar áudio',
          'Verifique se o seu navegador suporta Web Audio API',
          'Tente recarregar a página e tocar novamente',
          'Verifique as configurações de áudio do navegador'
        );
        break;
        
      case 'file':
        suggestions.push(
          'Verifique se o ficheiro é um MusicXML válido',
          'Certifique-se de que o ficheiro não está corrompido',
          'Tente com um ficheiro menor (< 10MB)',
          'Verifique se o formato é suportado (.xml, .mxl, .musicxml)'
        );
        break;
        
      case 'render':
        suggestions.push(
          'Tente recarregar a partitura',
          'Verifique se o MusicXML está bem formado',
          'Experimente alternar entre renderizador básico e avançado',
          'Certifique-se de que o navegador suporta SVG'
        );
        break;
        
      case 'network':
        suggestions.push(
          'Verifique sua conexão com a internet',
          'Tente recarregar a página',
          'Verifique se há bloqueadores de conteúdo ativos',
          'Aguarde alguns minutos e tente novamente'
        );
        break;
        
      default:
        suggestions.push(
          'Tente recarregar a página',
          'Verifique se o navegador está atualizado',
          'Limpe o cache do navegador',
          'Tente usar um navegador diferente'
        );
    }
    
    return suggestions;
  };

  // Copiar detalhes do erro
  const copyErrorDetails = async () => {
    const errorDetails = `
Erro da Aplicação de Partitura Musical
=====================================
Tipo: ${errorInfo.category}
Contexto: ${context}
Timestamp: ${new Date().toISOString()}

Mensagem: ${error?.message || 'Erro desconhecido'}
Stack: ${error?.stack || 'Stack trace não disponível'}

Navegador: ${navigator.userAgent}
URL: ${window.location.href}
=====================================
`;

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const errorInfo = categorizeError(error, context);
  const suggestions = getSuggestions(errorInfo, error);
  const IconComponent = errorInfo.icon;

  // Determinar variante do Alert baseado na severidade
  const alertVariant = errorInfo.severity === 'error' ? 'destructive' : 'default';

  if (!error) return null;

  return (
    <>
      {/* Alert compacto */}
      <Alert variant={alertVariant} className="mb-4">
        <IconComponent className="h-4 w-4" />
        <AlertTitle className="flex items-center justify-between">
          <span>{errorInfo.title}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {errorInfo.category}
            </Badge>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar Novamente
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDetailedOpen(true)}
              className="h-6 px-2"
            >
              <Bug className="h-3 w-3 mr-1" />
              Detalhes
            </Button>
            {onDismiss && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                className="h-6 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </AlertTitle>
        <AlertDescription>
          {error?.message || 'Ocorreu um erro inesperado na aplicação.'}
        </AlertDescription>
      </Alert>

      {/* Dialog detalhado */}
      <Dialog open={isDetailedOpen} onOpenChange={setIsDetailedOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5" />
              {errorInfo.title} - Detalhes
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o erro e sugestões de solução.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informações básicas */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={errorInfo.severity === 'error' ? 'destructive' : 'default'}>
                  {errorInfo.severity === 'error' ? 'Erro' : 'Aviso'}
                </Badge>
                <Badge variant="outline">{errorInfo.category}</Badge>
                <Badge variant="outline">{context}</Badge>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <strong>Mensagem:</strong> {error?.message || 'Erro desconhecido'}
              </div>
            </div>

            {/* Sugestões de solução */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Sugestões de Solução
              </h4>
              <ul className="space-y-1 text-sm">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detalhes técnicos (collapsible) */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                <ChevronDown className="h-4 w-4" />
                Detalhes Técnicos
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                <div className="text-xs space-y-2">
                  <div>
                    <strong>Timestamp:</strong> {new Date().toLocaleString()}
                  </div>
                  <div>
                    <strong>Contexto:</strong> {context}
                  </div>
                  <div>
                    <strong>Navegador:</strong> {navigator.userAgent}
                  </div>
                  {error?.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mt-1">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Ações */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={copyErrorDetails}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copiado!' : 'Copiar Detalhes'}
              </Button>
              
              <div className="flex gap-2">
                {onRetry && (
                  <Button onClick={onRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
                <Button onClick={() => setIsDetailedOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * ErrorBoundary - Componente de classe para capturar erros React
 * Integra com ErrorHandler para mostrar erros de forma user-friendly
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log do erro para debugging
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    // Reportar erro se callback foi fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <ErrorHandler
            error={this.state.error}
            context={this.props.context || 'component'}
            onRetry={this.handleRetry}
            onDismiss={this.props.onDismiss}
            showDetailed={this.state.retryCount > 0}
          />
          
          {/* Fallback UI personalizado */}
          {this.props.fallback ? (
            this.props.fallback
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>Este componente encontrou um erro.</p>
              <p className="text-sm">Tentativas de recuperação: {this.state.retryCount}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorHandler, ErrorBoundary };
export default ErrorHandler;
