import React, { useEffect, useRef, useState } from 'react';
import { 
  Music, 
  Sun, 
  Moon, 
  Maximize2, 
  Eye, 
  EyeOff,
  Pin,
  PinOff,
  Settings,
  Download,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAppStore } from '@/lib/stores/app-store';
import { useWidgetStore } from '@/lib/stores/widget-store';
import { useScoreStore } from '@/lib/stores/score-store';

const Header = () => {
  const {
    theme,
    toggleTheme,
    header,
    // toggleHeader, // removido: não utilizado
    hideHeader,
    pinHeader,
    unpinHeader,
    setHeaderHovered,
    startHeaderAutoHide,
    cancelHeaderAutoHide,
    toggleFullscreen,
    openModal,
    getBreakpoint,
  } = useAppStore();

  const { widgets, toggleWidgetVisibility, hideAllWidgets, showAllWidgets } = useWidgetStore();
  const { viewSettings, toggleLockView } = useScoreStore();

  const [widgetsDialogOpen, setWidgetsDialogOpen] = useState(false);
  const headerRef = useRef(null);
  const hoverZoneRef = useRef(null);

  const breakpoint = getBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  // Handle hover zone interactions
  useEffect(() => {
    const hoverZone = hoverZoneRef.current;
    const headerElement = headerRef.current;

    if (!hoverZone || !headerElement) return;

    const handleHoverZoneEnter = () => {
      if (!header.isVisible && !header.isPinned) {
        setHeaderHovered(true);
      }
    };

    const handleHoverZoneLeave = () => {
      if (header.isHovered && !header.isPinned) {
        setHeaderHovered(false);
      }
    };

    const handleHeaderEnter = () => {
      if (header.isHovered) {
        cancelHeaderAutoHide();
      }
    };

    const handleHeaderLeave = () => {
      if (header.isHovered && !header.isPinned) {
        startHeaderAutoHide();
      }
    };

    // Add event listeners
    hoverZone.addEventListener('mouseenter', handleHoverZoneEnter);
    hoverZone.addEventListener('mouseleave', handleHoverZoneLeave);
    headerElement.addEventListener('mouseenter', handleHeaderEnter);
    headerElement.addEventListener('mouseleave', handleHeaderLeave);

    return () => {
      hoverZone.removeEventListener('mouseenter', handleHoverZoneEnter);
      hoverZone.removeEventListener('mouseleave', handleHoverZoneLeave);
      headerElement.removeEventListener('mouseenter', handleHeaderEnter);
      headerElement.removeEventListener('mouseleave', handleHeaderLeave);
    };
  }, [header.isVisible, header.isHovered, header.isPinned, setHeaderHovered, startHeaderAutoHide, cancelHeaderAutoHide]);

  // Also reveal header when mouse is near the top edge even if hover zone is missed
  useEffect(() => {
    const topThreshold = Math.max(header.hoverZoneHeight || 3, 16); // at least 16px

    const handleGlobalMouseMove = (e) => {
      if (header.isPinned) return;
      if (!header.isVisible && e.clientY <= topThreshold) {
        setHeaderHovered(true);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [header.isVisible, header.isPinned, header.hoverZoneHeight, setHeaderHovered]);

  // Touch handling for mobile
  useEffect(() => {
    if (!isMobile && !isTablet) return;

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      const isTopEdge = touch.clientY < 50; // Top 50px for touch

      if (isTopEdge && !header.isVisible) {
        event.preventDefault();
        setHeaderHovered(true);
      }
    };

    const handleTouchEnd = () => {
      if (header.isHovered && !header.isPinned) {
        startHeaderAutoHide();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isTablet, header.isVisible, header.isHovered, header.isPinned, setHeaderHovered, startHeaderAutoHide]);

  const handleHideHeader = () => {
    hideHeader();
  };

  const handlePinToggle = () => {
    if (header.isPinned) {
      unpinHeader();
    } else {
      pinHeader();
    }
  };

  const handleExport = () => {
    openModal('export');
  };

  const handleSettings = () => {
    openModal('settings');
  };

  // Calculate header classes and styles
  const headerClasses = [
    'app-header',
    'fixed top-0 left-0 right-0 z-50',
    'bg-background/95 backdrop-blur-sm',
    'border-b border-border/20',
    'transition-all duration-300 ease-in-out',
    header.isVisible || header.isHovered ? 'translate-y-0' : '-translate-y-full',
    header.isHovered && !header.isPinned ? 'shadow-lg' : 'shadow-sm',
  ].filter(Boolean).join(' ');

  const overlayClasses = [
    'fixed inset-0 z-40',
    'bg-black/10 backdrop-blur-[1px]',
    'transition-opacity duration-200',
    'pointer-events-none',
    header.isHovered && !header.isPinned ? 'opacity-100' : 'opacity-0',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Hover Zone - Invisible area at top of screen */}
      <div
        ref={hoverZoneRef}
        className="fixed top-0 left-0 right-0 z-40 pointer-events-auto"
        style={{ height: `${header.hoverZoneHeight}px` }}
      />

      {/* Header Overlay - Semi-transparent background when hovering */}
      <div className={overlayClasses} />

      {/* Main Header */}
      <header ref={headerRef} className={headerClasses}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-primary-foreground" />
              </div>
              {!isMobile && (
                <span className="font-semibold text-lg">Editor de Partituras</span>
              )}
            </div>

            {/* Navigation Menu - Desktop */}
            {!isMobile && !isTablet && (
              <nav className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Ficheiro
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>Novo</DropdownMenuItem>
                    <DropdownMenuItem>Abrir</DropdownMenuItem>
                    <DropdownMenuItem>Guardar</DropdownMenuItem>
                    <DropdownMenuItem>Guardar Como</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem>Desfazer</DropdownMenuItem>
                    <DropdownMenuItem>Refazer</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Copiar</DropdownMenuItem>
                    <DropdownMenuItem>Cortar</DropdownMenuItem>
                    <DropdownMenuItem>Colar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={toggleFullscreen}>
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Ecrã Completo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Zoom In</DropdownMenuItem>
                    <DropdownMenuItem>Zoom Out</DropdownMenuItem>
                    <DropdownMenuItem>Zoom 100%</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* New: direct Widgets button that opens the dialog */}
                <Button variant="ghost" size="sm" onClick={() => setWidgetsDialogOpen(true)}>
                  Widgets
                </Button>
              </nav>
            )}
          </div>

          {/* Right Section - Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0"
              title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </Button>

            {/* Fullscreen Toggle - Desktop only */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="w-9 h-9 p-0"
                title="Ecrã Completo (F11)"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            )}

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSettings}
              className="w-9 h-9 p-0"
              title="Configurações"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* View Mode Toggle: Locked vs Free (moved from main content) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLockView}
              className="w-9 h-9 p-0"
              title={`Alternar para ${viewSettings.lockView ? 'Horizontal Mode' : 'Vertical Mode'}`}
            >
              {viewSettings.lockView ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>

            {/* Header Controls */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border/20">
              {/* Pin/Unpin Header - Only show when hovering and not mobile */}
              {header.isHovered && !header.isPinned && !isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePinToggle}
                  className="w-9 h-9 p-0 text-primary"
                  title="Fixar Header"
                >
                  <Pin className="w-4 h-4" />
                </Button>
              )}

              {/* Unpin Header - Only show when pinned */}
              {header.isPinned && !isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePinToggle}
                  className="w-9 h-9 p-0 text-primary"
                  title="Desafixar Header"
                >
                  <PinOff className="w-4 h-4" />
                </Button>
              )}

              {/* Hide Header Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHideHeader}
                className="w-9 h-9 p-0"
                title={`Ocultar Header ${isMobile ? '(Duplo toque no topo para mostrar)' : '(F11 ou hover no topo)'}`}
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Compact */}
        {(isMobile || isTablet) && (
          <div className="border-t border-border/20 px-4 py-2">
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                Ficheiro
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Editar
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Ver
              </Button>
              {/* New: Widgets button on mobile/tablet opens the same dialog */}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setWidgetsDialogOpen(true)}>
                Widgets
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" onClick={handleExport}>
                Exportar
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Widgets Dialog */}
      <Dialog open={widgetsDialogOpen} onOpenChange={setWidgetsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Widgets</DialogTitle>
            <DialogDescription>
              Ative ou desative a visualização de cada widget.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 max-h-[60vh] overflow-auto pr-1">
            {Object.values(widgets).map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => toggleWidgetVisibility(w.id)}
                aria-pressed={!!w.isVisible}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${w.isVisible ? 'bg-primary/10 border-primary/40 text-primary hover:bg-primary/15' : 'bg-card/60 border-border/20 hover:bg-accent/40'}`}
              >
                <div className="min-w-0 text-left">
                  <div className="text-sm font-medium truncate">{w.title}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {w.isVisible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Ativo</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span className="text-xs">Oculto</span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={hideAllWidgets}>Desativar todos</Button>
            <Button variant="default" size="sm" onClick={showAllWidgets}>Ativar todos</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;

