# AI Agent Code Analysis & Improvement Guide

## 1. Project Overview (Expanded)

### 1.1 Purpose & Main Features
- Describe the main goal of the project (e.g., "A web-based music sheet editor and viewer supporting MusicXML files, with advanced zoom, pan, and editing capabilities.").
- List core features:
  - Upload and render MusicXML files
  - Interactive score navigation (zoom, pan, scroll)
  - Custom toolbars and controls
  - Real-time editing and engraving settings
  - Responsive design for desktop and mobile
  - Integration with OpenSheetMusicDisplay (OSMD)

### 1.2 Key Technologies & Frameworks
- React (UI framework)
- Zustand (state management)
- OpenSheetMusicDisplay (music sheet rendering)
- Tailwind CSS (styling)
- Lucide React (icons)
- Radix UI (UI components)
- Vite (build tool)

### 1.3 Folder Structure Example
```
src/
  components/
    ScoreViewer.jsx
    CustomScrollbar.jsx
    controls/
    layout/
    providers/
    score/
    ui/
  hooks/
    useViewportInteractions.js
    useEditMode.js
    ...
  lib/
    stores/
      score-store.js
    utils/
  styles/
    score.css
  types/
    music.ts
    widgets.ts
public/
  samples/
    simple-melody.xml
```

### 1.4 Main File Locations
- Main component: `src/components/ScoreViewer.jsx`
- State store: `src/lib/stores/score-store.js`
- Main hooks: `src/hooks/useViewportInteractions.js`, `src/hooks/useEditMode.js`
- Styles: `src/styles/score.css`
- Entry point: `src/main.jsx`

### 1.5 How to Use This Section
- Update this overview whenever the project structure or main features change.
- Use this as a reference for where to add or improve features.

## 2. Coding Standards (Expanded)

### 2.1 JavaScript & React Best Practices
- Use ES6+ syntax (arrow functions, destructuring, spread/rest operators).
- Prefer functional components and React hooks over class components.
- Avoid direct DOM manipulation; use refs and React state.
- Use PropTypes or TypeScript for type safety.

### 2.2 State Management
- Use Zustand for global state (e.g., score, zoom, pan, UI state).
- Keep local state in components for UI-specific logic.
- Avoid prop drilling; use context or store when needed.

### 2.3 Styling
- Use Tailwind CSS utility classes for layout and design.
- Keep custom CSS modular and scoped (e.g., in `score.css`).
- Avoid inline styles except for dynamic values.

### 2.4 Imports & Organization
- Use relative imports for project files (e.g., `../hooks/useEditMode`).
- Group imports: external libraries first, then internal modules, then styles.
- Remove unused imports and code regularly.

### 2.5 Naming Conventions
- Use descriptive, camelCase names for variables and functions.
- Use PascalCase for components (e.g., `ScoreViewer`).
- Prefix custom hooks with `use` (e.g., `useViewportInteractions`).

### 2.6 Documentation & Comments
- Add JSDoc/type annotations for functions and components.
- Use comments to explain complex logic, not obvious code.
- Keep documentation up to date with code changes.

### 2.7 Example
```jsx
// Good example
function CustomScrollbar({ visible }) {
  // ...component logic
}

// Bad example
function cs(v) {
  // unclear naming, no comments
}
```

### 2.8 How to Use This Section
- Review these standards before adding or refactoring code.
- Use linting tools (ESLint, Prettier) to enforce style and catch issues.
- Update this section if project conventions change.

## 3. Feature Implementation Checklist (Expanded)

### 3.1 Modular Implementation
- Create new features as separate components, hooks, or utilities.
- Place new files in the appropriate folder (e.g., `src/components/`, `src/hooks/`).
- Avoid mixing unrelated logic in the same file.

### 3.2 Props & State Management
- Define clear props for each component; document expected types and defaults.
- Use Zustand for shared/global state, local state for UI-specific logic.
- Avoid prop drilling; use context or store when needed.

### 3.3 Error Handling & User Feedback
- Validate user input and handle errors gracefully.
- Show error messages or fallback UI when needed.
- Log errors for debugging (console or error boundary).

### 3.4 Responsiveness & Accessibility
- Use Tailwind CSS for responsive layouts (e.g., `flex`, `grid`, `md:`, `lg:`).
- Ensure keyboard navigation and screen reader support.
- Add ARIA attributes and semantic HTML where appropriate.

### 3.5 Comments & Documentation
- Add comments for complex logic, edge cases, or non-obvious code.
- Document new features in README or internal docs.

### 3.6 Testing
- Write unit tests for new functions/components (e.g., with Vitest, Jest).
- Add integration tests for user flows if possible.
- Test manually in the browser for UI/UX validation.

### 3.7 Example Workflow
1. Create new component in `src/components/`.
2. Add props and state logic.
3. Implement error handling and feedback.
4. Style with Tailwind and test responsiveness.
5. Add comments and update documentation.
6. Write and run tests.
7. Integrate with main app and validate.

### 3.8 How to Use This Section
- Use this checklist before, during, and after implementing a new feature.
- Mark completed items and document any deviations or decisions.

## 4. Code Quality & Maintainability (Expanded)

### 4.1 Remove Unused Code
- Regularly delete unused variables, functions, imports, and legacy code.
- Use linting tools (ESLint) to detect dead code.

### 4.2 Refactor Duplicated Logic
- Identify repeated logic and move it to reusable hooks or utility functions.
- Example: Move repeated date formatting to `src/lib/utils/dateUtils.js`.

### 4.3 Component Size & Focus
- Keep components small and focused on a single responsibility.
- Split large components into smaller ones if needed.

### 4.4 Linting & Formatting
- Use ESLint for code style and error detection.
- Use Prettier for consistent formatting.
- Add lint and format scripts to `package.json`:
```json
"scripts": {
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

### 4.5 Documentation of Architecture
- Document architectural decisions (e.g., why Zustand was chosen, folder structure rationale).
- Add comments or markdown files for custom patterns or workflows.

### 4.6 Example Refactor
```js
// Before: duplicated logic
function formatDate(date) { /* ... */ }
function showDate(date) { return formatDate(date); }

// After: reusable utility
// src/lib/utils/dateUtils.js
export function formatDate(date) { /* ... */ }
```

### 4.7 How to Use This Section
- Review code for quality and maintainability after each feature or refactor.
- Use automated tools and peer review to catch issues early.
- Update documentation when architecture or patterns change.

## 5. Integration & Testing (Expanded)

### 5.1 Smooth Integration
- Ensure new features/components do not break existing functionality.
- Use feature branches (or manual backups) for major changes.
- Test integration points (e.g., shared state, props, events).

### 5.2 Update/Add Tests
- Write unit tests for new logic (e.g., with Vitest or Jest).
- Add integration tests for user flows and component interactions.
- Example: Test that ScoreViewer renders a MusicXML file and responds to zoom events.

### 5.3 Cross-Browser & Device Validation
- Test in Chrome, Firefox, Safari, Edge.
- Validate on desktop and mobile devices.
- Use responsive design tools (e.g., browser dev tools, Tailwind breakpoints).

### 5.4 Performance Checks
- Profile components for unnecessary re-renders (React DevTools).
- Optimize large dependencies and lazy-load where possible.
- Monitor bundle size and loading times.

### 5.5 Example Test
```js
// Example Vitest test for ScoreViewer
import { render, screen } from '@testing-library/react';
import ScoreViewer from '../components/ScoreViewer';
test('renders ScoreViewer and toolbar', () => {
  render(<ScoreViewer />);
  expect(screen.getByText(/Carregar Partitura/i)).toBeInTheDocument();
});
```

### 5.6 How to Use This Section
- Run tests after every major change or feature addition.
- Document any integration issues and their solutions.
- Use automated CI/CD pipelines if available.

## 6. Troubleshooting & Debugging (Expanded)

### 6.1 Common Issues
- Import errors (wrong path, missing file, case sensitivity)
- State sync problems (store not updating, stale props)
- CSS conflicts (overlapping classes, specificity issues)
- Performance lags (slow rendering, memory leaks)

### 6.2 Debugging Tools & Techniques
- Use browser dev tools (Elements, Console, Network, Performance tabs)
- Use React DevTools for inspecting component state and props
- Add temporary `console.log` statements for tracing logic
- Use error boundaries for catching runtime errors in React

### 6.3 Example Debugging Workflow
1. Reproduce the issue and note error messages.
2. Check the console and network logs for clues.
3. Inspect component tree and state with React DevTools.
4. Isolate the problem by commenting out or simplifying code.
5. Fix the issue and test thoroughly.
6. Remove temporary debug code.

### 6.4 Document Known Issues
- Keep a section in README or internal docs for known bugs and solutions.
- Example:
```
Known Issue: CustomScrollbar not visible in Safari.
Solution: Add `-webkit-overflow-scrolling: touch;` to CSS.
```

### 6.5 How to Use This Section
- Refer to these steps and tools when encountering bugs or unexpected behavior.
- Update documentation with new issues and solutions as they arise.

## 7. Documentation & Communication (Expanded)

### 7.1 Update README & Internal Docs
- Document new features, components, and hooks in the README.
- Add usage examples and API details for public components/hooks.
- Keep changelogs for major updates and migrations.

### 7.2 Usage Examples
- Provide code snippets for how to use new components/hooks.
- Example:
```jsx
// Usage example for ScoreViewer
<ScoreViewer file={myMusicXMLFile} zoom={1.2} />
```

### 7.3 Communicate Major Changes
- Notify the team of breaking changes, new features, or migrations.
- Use project management tools (e.g., GitHub Issues, Slack, Notion) for tracking and discussion.

### 7.4 Document Architectural Decisions
- Record the rationale for major design or technology choices (e.g., "Zustand chosen for lightweight state management").
- Use ADR (Architecture Decision Record) markdown files if needed.

### 7.5 How to Use This Section
- Update documentation after every major change or feature addition.
- Share documentation and examples with the team to ensure alignment.
- Review docs regularly to keep them current and useful.

## 8. Migration & Refactoring (if applicable)
- Backup original files before major changes.
- Migrate in small, testable steps.
- Document migration steps and rationale.

---

**How to Use This Guide:**
- Before implementing a new feature, review the checklist and standards.
- After coding, validate your changes against this guide.
- Document your work and update the markdown file as needed.

---
