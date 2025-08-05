# ScribeChanges Monorepo

A monorepo containing a React-based sheet music application with shared packages.

## Structure

```
.
├── apps/
│   └── web/                    # Main React application (Vite + Tailwind CSS)
│       ├── src/
│       ├── public/
│       ├── index.html
│       └── package.json
├── packages/
│   ├── ui/                     # Shared React UI components
│   │   ├── src/
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   └── ...
│   │   └── package.json
│   └── utils/                  # Shared utility functions
│       ├── src/
│       │   ├── fileUtils.js
│       │   ├── musicXMLService.js
│       │   └── ...
│       └── package.json
├── pnpm-workspace.yaml
├── jsconfig.json              # Path aliases configuration
└── package.json               # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (recommended) or npm

### Installation

Using pnpm (recommended):
```bash
pnpm install
```

Using npm:
```bash
npm install
```

### Development

Start the web application:
```bash
pnpm dev:web
# or
npm run dev:web
```

### Building

Build the web application:
```bash
pnpm build:web
# or
npm run build:web
```

Build all packages:
```bash
pnpm build
# or
npm run build
```

### Testing

Run tests across all packages:
```bash
pnpm test
# or
npm run test
```

### Linting

Run linting across all packages:
```bash
pnpm lint
# or
npm run lint
```

## Packages

### @scribe-changes/web

The main React application built with:
- React 18
- Vite 5
- Tailwind CSS
- OpenSheetMusicDisplay
- Tone.js for audio playback

### @scribe-changes/ui

Shared UI component library including:
- Radix UI components
- Custom styled components
- Tailwind CSS utilities

### @scribe-changes/utils

Shared utility functions including:
- File handling utilities
- MusicXML parsing and processing
- Audio processing helpers

## Path Aliases

The monorepo is configured with the following path aliases:

- `@ui/*` → `packages/ui/src/*`
- `@utils/*` → `packages/utils/src/*`  
- `@web/*` → `apps/web/src/*`

## Package Manager

This project is configured to work with pnpm workspaces, but also supports npm. The `pnpm-workspace.yaml` configuration ensures proper package linking and dependency management.

## Contributing

1. Make changes in the appropriate package
2. Test your changes with `pnpm test`
3. Build to ensure everything works with `pnpm build`
4. Submit a pull request

## Scripts

- `pnpm dev:web` - Start development server for web app
- `pnpm build:web` - Build web app for production
- `pnpm build` - Build all packages
- `pnpm test` - Run tests in all packages
- `pnpm lint` - Run linting in all packages