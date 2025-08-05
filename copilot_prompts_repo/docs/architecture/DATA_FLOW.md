# 🔄 Fluxo de Dados

## 📊 **Diagrama de Fluxo Principal**

```
[User Interaction] 
        ↓
    [App.jsx]
        ↓
┌───────────────────┐
│   State Updates   │
│ ┌───────────────┐ │
│ │ isPlaying     │ │
│ │ currentTime   │ │
│ │ zoomLevel     │ │
│ │ selectionInfo │ │
│ └───────────────┘ │
└───────────────────┘
        ↓
┌───────────────────┐
│    Event Flow     │
│ ┌───────────────┐ │
│ │ handlePlay()  │ │
│ │ handleZoom()  │ │
│ │ handleSelect()│ │
│ └───────────────┘ │
└───────────────────┘
        ↓
┌───────────────────┐
│   Component       │
│   Re-renders      │
│ ┌───────────────┐ │
│ │ OSMD Update   │ │
│ │ Audio Update  │ │
│ │ UI Update     │ │
│ └───────────────┘ │
└───────────────────┘
```

## 🎵 **Fluxo de Dados do Audio Engine**

```
[User clicks Play]
        ↓
    [handlePlay() in App.jsx]
        ↓
    [setIsPlaying(true)]
        ↓
┌─────────────────────────────┐
│   AudioEngine Component     │
│                             │
│ [Tone.js initialization]    │
│        ↓                    │
│ [Synth creation]            │
│        ↓                    │
│ [Audio playback]            │
│        ↓                    │
│ [onTimeUpdate callback]     │
└─────────────────────────────┘
        ↓
    [setCurrentTime(newTime)]
        ↓
┌─────────────────────────────┐
│  MagneticPlaybackControls   │
│                             │
│ [Update progress bar]       │
│ [Update time display]       │
└─────────────────────────────┘
```

## 🎯 **Fluxo de Seleção**

```
[User selects notes in OSMD]
        ↓
    [AdvancedSheetMusicOSMD]
        ↓
    [onSelectionChange callback]
        ↓
    [handleSelectionChange() in App.jsx]
        ↓
┌─────────────────────────────┐
│   Selection State Update    │
│                             │
│ setSelectionInfo(selection) │
│ setShowSelectionTool(true)  │
│ setSelectionPosition(...)   │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│     Component Updates       │
│                             │
│ SelectionTool (shows)       │
│ MagneticAnalysisWidget      │
│ AnalysisPanel (if open)     │
└─────────────────────────────┘
```

## 🧲 **Fluxo dos Magnetic Widgets**

```
[Widget Mount]
        ↓
┌─────────────────────────────┐
│      MagneticWidget         │
│                             │
│ [Calculate magnetic zones]  │
│ [Set initial position]      │
│ [Register event listeners]  │
└─────────────────────────────┘
        ↓
[User drags widget]
        ↓
┌─────────────────────────────┐
│    Drag Event Handler       │
│                             │
│ [Calculate new position]    │
│ [Check magnetic zones]      │
│ [Snap to nearest zone]      │
│ [Update position state]     │
└─────────────────────────────┘
        ↓
[Widget repositioned]
```

## 🔄 **Fluxo de Zoom e Navegação**

```
[User changes zoom]
        ↓
    [MagneticNavigationControls]
        ↓
    [onZoomChange callback]
        ↓
    [handleZoomChange() in App.jsx]
        ↓
    [setZoomLevel(newZoom)]
        ↓
┌─────────────────────────────┐
│    OSMD Components          │
│                             │
│ AdvancedSheetMusicOSMD      │
│ SheetMusicOSMD              │
│ FullscreenSheetMusic        │
└─────────────────────────────┘
        ↓
    [OSMD re-renders with new zoom]
```

## 📱 **Fluxo de Fullscreen**

```
[User clicks Fullscreen button]
        ↓
    [handleFullscreen() in App.jsx]
        ↓
    [setIsFullscreen(true)]
        ↓
┌─────────────────────────────┐
│   Conditional Rendering     │
│                             │
│ if (isFullscreen) {         │
│   return <FullscreenMode/>  │
│ } else {                    │
│   return <NormalMode/>      │
│ }                           │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│    FullscreenSheetMusic     │
│                             │
│ [Magnetic widgets pinned]   │
│ [Full viewport usage]       │
│ [Exit button available]     │
└─────────────────────────────┘
```

## 🎨 **Fluxo de Renderização**

```
[App.jsx state change]
        ↓
    [React re-render cycle]
        ↓
┌─────────────────────────────┐
│   Component Tree Update     │
│                             │
│ Header → updated props      │
│ MainContent → updated props │
│ MagneticWidgets → updated   │
│ Footer → static             │
└─────────────────────────────┘
        ↓
┌─────────────────────────────┐
│     OSMD Re-render          │
│                             │
│ [Check if musicXML changed] │
│ [Check if zoom changed]     │
│ [Check if selection changed]│
│ [Update display if needed]  │
└─────────────────────────────┘
```
