<<<<<<< HEAD
# ScribeChanges
This is a web based music app with some features
=======
# 🎼 Music Score Editor - Professional Sheet Music Editor

A modern, professional music score editor built with React 18, featuring a dynamic header system and magnetic widgets for an enhanced user experience.

![Music Score Editor](https://img.shields.io/badge/React-18-blue) ![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-green) ![Vite](https://img.shields.io/badge/Vite-6-purple) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎨 **Modern UI Design**
- **Golden Theme**: Beautiful color scheme with #FFD700 accent color
- **Dark/Light Mode**: Toggle between themes
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Professional Interface**: Clean, modern design with smooth animations

### 🎛️ **Dynamic Header System**
- **Auto-Hide**: Header automatically hides for immersive score viewing
- **Hover Zone**: 3px invisible zone at top to reveal header
- **Keyboard Shortcuts**: F11, Ctrl+Shift+H, Escape for quick control
- **Smooth Animations**: 300ms transitions for professional feel

### 🧲 **Magnetic Widgets System**
- **4 Professional Widgets**: Media controls, editing tools, properties, quick actions
- **6 Snap Zones**: Corners and edges with magnetic attraction
- **Drag & Drop**: Intuitive widget positioning
- **State Persistence**: Widget positions saved between sessions
- **Collision Detection**: Prevents widget overlap

### 🎵 **Music Score Features**
- **OpenSheetMusicDisplay**: Professional score rendering
- **MusicXML Support**: Industry-standard format
- **Zoom Controls**: Adjustable score viewing
- **File Upload**: Drag & drop music files
- **Fullscreen Mode**: Immersive score viewing

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- **Node.js** (version 18 or higher)
- **pnpm** (recommended) or npm/yarn

### Installation

1. **Extract the project files** to your desired directory
2. **Open terminal** in the project directory
3. **Install dependencies**:
   ```bash
   pnpm install
   # or
   npm install
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

5. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
pnpm build
# or
npm run build
```

The built files will be in the `dist/` directory.

## 📁 Project Structure

```
music-editor/
├── public/                 # Static assets
│   ├── favicon.svg        # Custom musical note favicon
│   └── samples/           # Sample MusicXML files
├── src/
│   ├── components/        # React components
│   │   ├── controls/      # Widget components
│   │   ├── layout/        # Layout components
│   │   ├── score/         # Score viewer components
│   │   └── ui/            # UI components (Radix UI)
│   ├── lib/
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand state stores
│   │   └── utils.js       # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── App.jsx            # Main application component
│   ├── App.css            # Global styles
│   └── main.jsx           # Application entry point
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # This file
```

## 🎯 Usage Guide

### Basic Navigation

1. **Header Controls**:
   - File menu: Open, save, export music files
   - View menu: Zoom, fullscreen, theme toggle
   - Help menu: Documentation and shortcuts

2. **Dynamic Header**:
   - Press `F11` to toggle header visibility
   - Move mouse to top edge to reveal hidden header
   - Use `Ctrl+Shift+H` to show/hide header

3. **Widgets**:
   - Drag widgets to reposition them
   - Widgets snap to corners and edges automatically
   - Right-click widgets for context menu
   - Pin widgets to prevent accidental movement

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F11` | Toggle header visibility |
| `Ctrl+Shift+H` | Show/hide header |
| `Escape` | Show header (if hidden) |
| `Ctrl+H` | Hide all widgets |
| `Ctrl+Shift+H` | Show all widgets |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+Plus` | Zoom in |
| `Ctrl+Minus` | Zoom out |
| `Ctrl+0` | Reset zoom |

### Widget System

#### Media Controls Widget
- Play/pause music playback
- Volume control
- BPM adjustment
- Metronome toggle
- Repeat modes

#### Editing Tools Widget
- Selection tool
- Note input tools
- Rest input tools
- Undo/redo actions

#### Properties Widget
- Score properties
- Element properties
- Key signature
- Time signature

#### Quick Actions Widget
- File operations
- View controls
- Export options
- Share functions

## 🛠️ Development

### Tech Stack

- **Frontend**: React 18 with hooks
- **Build Tool**: Vite 6 for fast development
- **Styling**: Tailwind CSS 4 with custom theme
- **UI Components**: Radix UI for accessibility
- **State Management**: Zustand for lightweight state
- **Music Rendering**: OpenSheetMusicDisplay
- **Audio**: Tone.js for web audio

### Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm lint         # Run ESLint

# Package management
pnpm install      # Install dependencies
pnpm add <pkg>    # Add new dependency
pnpm remove <pkg> # Remove dependency
```

### Environment Variables

Create a `.env` file in the root directory for custom configuration:

```env
# Development
VITE_DEV_PORT=5173

# API endpoints (if needed)
VITE_API_BASE_URL=http://localhost:3000

# Feature flags
VITE_ENABLE_DEBUG=true
```

## 🎨 Customization

### Theme Colors

Edit `src/App.css` to customize the color scheme:

```css
:root {
  --color-primary: #FFD700;      /* Golden yellow */
  --color-background: #2D2D2D;   /* Dark gray */
  --color-foreground: #FFFFFF;   /* White text */
  --color-accent: #FFA500;       /* Orange accent */
}
```

### Widget Configuration

Modify `src/lib/stores/widget-store.js` to customize widget behavior:

```javascript
// Snap zones configuration
const SNAP_ZONES = {
  TOP_LEFT: { x: 0, y: 0, width: 200, height: 100, priority: 1 },
  // Add custom snap zones...
};

// Magnetic settings
magneticSettings: {
  enabled: true,
  snapDistance: 20,
  snapForce: 0.8,
  animationDuration: 200,
}
```

## 🔧 Troubleshooting

### Common Issues

1. **Application not loading**:
   - Check browser console for errors
   - Ensure all dependencies are installed
   - Try clearing browser cache

2. **Widgets not working**:
   - Verify Zustand stores are properly imported
   - Check for JavaScript errors in console
   - Ensure all widget components are properly exported

3. **Styling issues**:
   - Verify Tailwind CSS is properly configured
   - Check for conflicting CSS rules
   - Ensure all CSS files are imported

4. **Build errors**:
   - Update Node.js to version 18+
   - Clear node_modules and reinstall dependencies
   - Check for TypeScript errors

### Performance Optimization

1. **Large bundle size**:
   - Use dynamic imports for heavy components
   - Optimize images and assets
   - Enable tree shaking in build

2. **Slow rendering**:
   - Use React.memo for expensive components
   - Implement virtualization for large lists
   - Optimize re-renders with useCallback/useMemo

## 📚 Documentation

### API Reference

- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [OpenSheetMusicDisplay](https://opensheetmusicdisplay.github.io/)

### Component Documentation

Each component includes JSDoc comments with usage examples:

```javascript
/**
 * MagneticWidget - Base component for draggable widgets
 * @param {string} widgetId - Unique widget identifier
 * @param {ReactNode} children - Widget content
 * @param {Object} config - Widget configuration
 */
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use ESLint configuration provided
- Follow React best practices
- Use TypeScript for type safety
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenSheetMusicDisplay** for music rendering
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling
- **Zustand** for state management
- **Vite** for fast development experience

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed description
4. Include browser console errors if applicable

---

**Happy coding! 🎵**

Built with ❤️ using React, Tailwind CSS, and modern web technologies.

>>>>>>> a04e600a (Initial commit: music-editor project)
