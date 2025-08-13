# Musical Sheet Viewer - Code Analysis and Improvement Roadmap

## Table of Contents

1.  [Current Code Analysis](#current-code-analysis)
    *   [Overview](#overview)
    *   [Key Features Currently Implemented](#key-features-currently-implemented)
    *   [Architecture Strengths](#architecture-strengths)
2.  [Performance Bottlenecks and Improvement Opportunities](#performance-bottlenecks-and-improvement-opportunities)
3.  [New Features](#new-features)
4.  [Sheet Engraving Good Practices](#sheet-engraving-good-practices)
5.  [Multiple Instrument Feature](#multiple-instrument-feature)
6.  [Development Roadmap for GPT-5 Copilot Integration](#development-roadmap-for-gpt-5-copilot-integration)
    *   [Phase 1: Core Performance Optimizations (Stability, Responsiveness & Fluid Zoom)](#phase-1-core-performance-optimizations-stability-responsiveness--fluid-zoom)
    *   [Phase 2: Core Feature Development (User Interaction & Basic Functionality)](#phase-2-core-feature-development-user-interaction--basic-functionality)
    *   [Phase 3: Advanced Features & Refinements (Richness & Usability)](#phase-3-advanced-features--refinements-richness--usability)
    *   [Phase 4: Polish, Accessibility & Advanced Optimizations (User Experience & Robustness)](#phase-4-polish-accessibility--advanced-optimizations-user-experience--robustness)
    *   [Phase 5: Sheet Engraving & Multi-Instrument Features (Professionalism & Collaboration)](#phase-5-sheet-engraving--multi-instrument-features-professionalism--collaboration)
7.  [Conclusion](#conclusion)
8.  [References](#references)

---

## Current Code Analysis

### Overview
The provided code is a React component called `ScoreViewer` that displays musical sheets using the OpenSheetMusicDisplay (OSMD) library. It's a sophisticated viewer with zoom, pan, edit capabilities, and dual view modes. The component leverages React hooks for state management and side effects, and integrates with external libraries for UI components and musical rendering.

### Key Features Currently Implemented
1.  **File Loading**: Supports drag & drop and a file picker for `.xml`, `.musicxml`, and `.mxl` file formats, providing flexibility for users to import scores.
2.  **Dual View Modes**: Offers two distinct viewing modes: **Page Viewer** for vertical page-by-page navigation with native scrolling, and **Page Selection** for horizontal page selection with a fixed zoom level, designed to facilitate easier viewing and manual panning.
3.  **Zoom & Pan**: Implements robust zoom functionality via mouse wheel and pinch gestures, along with smooth panning. These interactions are enhanced by CSS transforms for fluid visual feedback.
4.  **Edit Mode**: Includes an edit mode with features like musical control points and distance visualization, suggesting capabilities for score manipulation or analysis.
5.  **Metadata Extraction**: Automatically extracts and displays essential score metadata such as title, composer, key signature, time signature, tempo, and instruments, providing quick insights into the musical piece.
6.  **Error Handling**: Features comprehensive error states with user-friendly messages and recovery options, improving the application's robustness and user experience.
7.  **Responsive Design**: Utilizes an A4 page format and viewport fitting, ensuring the musical score is displayed correctly across various screen sizes and and devices.
8.  **Touch Support**: Provides native touch support, including Safari pinch gestures and general touch events, making the application highly usable on touch-enabled devices.

### Architecture Strengths
-   **Custom Hooks**: The use of custom React hooks (`useZoom`, `usePan`, `useEditMode`) effectively separates concerns, making the codebase modular, readable, and easier to maintain and extend.
-   **State Management**: Centralized state management with `useScoreStore` ensures a single source of truth for application data, simplifying state flow and debugging.
-   **Performance**: The implementation leverages CSS transforms for smooth animations and `requestAnimationFrame` for rendering updates, which are key for achieving high performance in visual applications. The current approach of keeping OSMD zoom at 1 and scaling via CSS is a good strategy for performance.
-   **Cross-platform**: The inclusion of touch and gesture support, alongside responsive design principles, makes the application inherently cross-platform and accessible on both desktop and mobile devices.

---

## Performance Bottlenecks and Improvement Opportunities

While the current implementation demonstrates strong architectural choices and good practices, especially concerning the use of CSS transforms for zoom and pan, there are always areas for performance optimization, particularly when dealing with potentially large and complex musical scores. Addressing these bottlenecks is crucial for ensuring a truly fluid and lag-free user experience.

1.  **OSMD Rendering Optimization**: The `OpenSheetMusicDisplay` library itself, while powerful, can become a bottleneck for very large or intricate scores. Frequent re-renders can lead to perceived lag.
    *   **Current**: `osmdInstance?.render()` is called on every resize and potentially on mode switches. While necessary for layout updates, frequent calls can be expensive.
    *   **Improvement**: Explore `osmd.render()` optimization techniques. For example, check if `osmd.render()` can be debounced or throttled for resize events. Investigate if partial re-renders are possible for minor changes, or if there are specific OSMD options that can improve rendering speed for complex scores (e.g., disabling certain visual elements during interaction).

2.  **Large File Handling**: Reading and processing large `.mxl` files (which are compressed MusicXML) can be memory-intensive and time-consuming, impacting initial load times.
    *   **Current**: `readFileContent` reads the entire file into memory, which is fine for typical files but can be problematic for extremely large ones.
    *   **Improvement**: For extremely large files, consider streaming approaches if OSMD supports it, or processing in chunks. However, this might be an OSMD limitation rather than a direct code issue. Offloading to a Web Worker could also mitigate UI blocking.

3.  **State Updates and Re-renders**: React's rendering mechanism can lead to unnecessary component re-renders if state updates are not managed efficiently, especially in components that are frequently interacted with (like zoom and pan).
    *   **Current**: `useEffect` dependencies are generally well-managed, but subtle changes in `panState` or `zoom` could lead to re-renders of child components that don't strictly need to update.
    *   **Improvement**: Profile the React component tree to identify components that re-render unnecessarily. Use `React.memo` for pure components, `useMemo` for expensive calculations, and `useCallback` for stable function references more aggressively if profiling reveals issues. Ensure that state updates are batched where possible.

4.  **CSS Performance**: While CSS transforms are generally performant due to GPU acceleration, complex CSS rules or an excessive number of DOM elements can still impact rendering performance, leading to layout thrashing or slow repaints.
    *   **Current**: Uses `transform: scale()` for zoom and `translate()` for pan, which are good practices.
    *   **Improvement**: Audit the `score.css` and other styling for any complex selectors or rules that might cause layout thrashing. Ensure that the A4 wrapper and OSMD container are optimized for minimal reflows and repaints. Consider using `will-change` property for elements undergoing frequent transformations.

5.  **Initial Load Time**: The time it takes for a score to fully load and become interactive can be a critical user experience factor, especially for larger scores.
    *   **Current**: `setLoadingState('loading')` is used, but the UI might still feel unresponsive during the `osmdInstance.load(content)` and `osmdInstance.render()` calls.
    *   **Improvement**: Implement more granular loading indicators or skeleton screens to improve perceived performance. Consider Web Workers for `readFileContent` if file parsing becomes a bottleneck. Potentially pre-fetch or cache common scores if applicable to the larger project.

6.  **Memory Usage**: Large scores, particularly those with many staves, measures, or complex notation, can consume significant browser memory. This can lead to sluggish performance or even crashes on devices with limited RAM.
    *   **Current**: The application relies on OSMD's internal memory management.
    *   **Improvement**: Monitor memory usage in the browser's developer tools. If memory becomes an issue, investigate OSMD's memory footprint and explore options for optimizing its internal data structures or rendering strategy. This might involve looking into OSMD's documentation for memory management tips or considering alternative rendering backends if SVG proves too heavy for extreme cases.

7.  **Event Listeners**: While event listeners are correctly cleaned up, a high frequency of events (like `wheel` or `mousemove` during pan) can still trigger expensive operations if not handled carefully.
    *   **Current**: Event listeners are correctly cleaned up in `useEffect` return functions.
    *   **Improvement**: For very high-frequency events, ensure that event handlers are as lightweight as possible and avoid triggering expensive re-renders directly within them. Debounce or throttle handlers if they perform complex calculations or state updates, especially those that interact with the DOM or trigger React state changes.

---

## New Features

Building upon the existing robust foundation, here are some new features that would significantly enhance the musical sheet display application, transforming it into a more powerful and versatile tool for musicians and educators:

1.  **Interactive Playback (MIDI/Audio Sync)**:
    *   **Description**: This feature would allow users to play back the musical score, either through MIDI synthesis or a synthesized audio output, with real-time visual highlighting of the current position on the score. This is a crucial tool for practice, learning, and analysis.
    *   **Technical Considerations**: Requires integration with a robust MIDI playback library (e.g., `Tone.js`, `Midi.js`) or a soundfont player. The core challenge lies in accurately synchronizing the audio playback with the visual representation of the score, which involves mapping playback time to specific musical elements rendered by OSMD.

2.  **Annotation and Markup Tools**:
    *   **Description**: Empower users to personalize their scores by adding various annotations directly onto the musical sheet. This includes text notes, freehand drawing tools (pen, highlighter), and the ability to insert common musical symbols (e.g., fingerings, dynamics, articulations).
    *   **Technical Considerations**: Implementing this would involve creating an SVG overlay or HTML5 Canvas on top of the OSMD rendering. Annotations would need to be stored as structured data (e.g., JSON) associated with specific measures or coordinates, allowing them to be saved, loaded, and edited.

3.  **Part Extraction and Hiding**:
    *   **Description**: For scores containing multiple instruments or voices, this feature would enable users to isolate and view or hide individual instrument parts. This is an invaluable functionality for ensemble musicians, conductors, and students focusing on specific lines.
    *   **Technical Considerations**: `OpenSheetMusicDisplay` provides access to instrument data. This feature would involve dynamically re-rendering the score with only selected parts visible, likely utilizing OSMD's internal APIs for part manipulation and ensuring efficient updates.

4.  **Advanced Transposition Tool (Instrument-Specific)**:
    *   **Description**: Beyond simple key transposition, this feature would allow users to transpose the entire score or selected sections to a different key, specifically accounting for transposing instruments (e.g., Saxophone in Bb, Trumpet in Bb, Clarinet in A, French Horn in F). It would also include a toggle to switch between concert pitch and transposed pitch.
    *   **Technical Considerations**: This is a complex feature requiring deep interaction with OSMD's internal music data model. It might involve modifying the underlying MusicXML data before rendering or leveraging OSMD's transposition capabilities if they are robust enough to handle instrument-specific transpositions and pitch toggling.

5.  **Print and Export Options**:
    *   **Description**: Provide comprehensive options for printing the score (with or without annotations) and exporting it to various formats like PDF or high-resolution image files. This ensures users can easily share or archive their scores.
    *   **Technical Considerations**: For printing, leveraging browser print capabilities with optimized print CSS is a starting point. For PDF export, libraries like `jsPDF` or `html2canvas` combined with `jsPDF` would be necessary to render the SVG/Canvas content to a PDF, ensuring high-quality output.

6.  **Version Control/History for Annotations**:
    *   **Description**: If users make annotations or edits, this feature would allow them to view a history of changes, undo/redo actions, and revert to previous versions of their marked-up score. This provides a safety net and flexibility for experimentation.
    *   **Technical Considerations**: Implementing a robust state management system for annotations that tracks changes over time is essential. This could involve maintaining an undo/redo stack or storing snapshots of annotation states, potentially using `IndexedDB` for larger histories.

7.  **Accessibility Features**:
    *   **Description**: Enhance the application's accessibility for a broader user base, including visually impaired users (e.g., screen reader compatibility for musical elements, high-contrast modes) and those with motor impairments (e.g., comprehensive keyboard navigation).
    *   **Technical Considerations**: Requires careful application of ARIA attributes, meticulous keyboard focus management, and potentially integration with specialized music accessibility tools or techniques to expose musical semantics to screen readers.

8.  **Theming and Customization**:
    *   **Description**: Offer users the ability to customize the visual appearance of the score and the application interface. This includes options for paper color, notehead style, font choices, and overall UI themes.
    *   **Technical Considerations**: Exposing OSMD rendering options through the UI and persisting user preferences in local storage or a user profile. This involves dynamic CSS variable manipulation and potentially re-rendering OSMD with new style parameters.

9.  **Performance Monitoring and Debugging Tools (Developer-facing)**:
    *   **Description**: Integrate in-application tools for developers to monitor rendering performance, memory usage, and React component re-renders. This provides invaluable insights for ongoing optimization and debugging.
    *   **Technical Considerations**: Utilizing React DevTools profiler, browser performance APIs (like `PerformanceObserver`), and potentially custom logging within the OSMD rendering pipeline to gather and visualize performance metrics.

---

## Sheet Engraving Good Practices

Creating a professional and aesthetically pleasing musical score involves adhering to established engraving best practices. These guidelines ensure clarity, readability, and a polished appearance, which are crucial for musicians. While OpenSheetMusicDisplay handles much of the rendering, understanding these principles allows for better configuration and potential post-processing or customization.

1.  **Clarity and Legibility**: The primary goal of engraving is to make the music easy to read. This involves:
    *   **Font Choice**: Use clear, readable music fonts for notes, symbols, and text. Avoid overly decorative or thin fonts that can be difficult to discern.
    *   **Spacing**: Ensure adequate spacing between notes, staves, systems, and pages. Overcrowding makes the score appear cluttered and hard to follow. OSMD's default spacing is generally good, but custom adjustments might be needed for dense passages.
    *   **Symbol Placement**: Place dynamics, articulations, slurs, and other markings precisely. They should be close enough to the notes they affect but not overlap with other elements.

2.  **Consistency**: Maintain consistency in all aspects of engraving throughout the entire score.
    *   **Layout**: Keep consistent margins, staff sizes, and system spacing. Avoid sudden changes in layout unless musically necessary.
    *   **Notation Style**: Apply consistent beaming, stem directions, and accidental placement according to standard music notation rules.
    *   **Text Formatting**: Use consistent font sizes, styles (bold, italic), and alignment for titles, composer names, lyrics, and performance instructions.

3.  **Hierarchy and Emphasis**: Guide the performer's eye by creating a visual hierarchy.
    *   **Titles and Headings**: Use larger, distinct fonts for titles and composer names. Subheadings (e.g., movement titles) should also stand out but be subordinate to the main title.
    *   **Dynamics and Articulations**: Ensure these markings are clearly visible and appropriately sized to convey their importance without overwhelming the notes.
    *   **System Breaks**: Place system breaks (end of a line of music) at musically logical points, typically at the end of a phrase or section, to aid readability.

4.  **Page Turns and Flow**: Optimize the score for performance.
    *   **Avoid Awkward Page Turns**: Ideally, a performer should not have to turn a page in the middle of a critical musical passage. Plan page breaks strategically to allow for comfortable page turns.
    *   **Cue Notes**: For complex ensemble pieces, consider adding small cue notes from other instruments to help a performer re-enter after a long rest or during a difficult passage.

5.  **Cleanliness and Professionalism**: Eliminate clutter and ensure a polished final product.
    *   **Minimal Overlap**: Strive to avoid any overlapping elements (notes, text, symbols). If unavoidable, ensure the overlap is minimal and does not obscure information.
    *   **Alignment**: Ensure all elements (bar lines, clefs, key signatures, time signatures) are perfectly aligned vertically and horizontally.
    *   **Error Checking**: Thoroughly proofread the score for any notation errors, typos, or engraving inconsistencies.

While OSMD provides a strong foundation for rendering, custom CSS, careful configuration of OSMD options, and potentially post-processing of the generated SVG can help achieve these professional engraving standards. For instance, fine-tuning spacing, adjusting font sizes for specific text elements, or adding custom visual cues might be necessary.

---

## Multiple Instrument Feature

This feature aims to provide a comprehensive and flexible way for users to interact with scores containing multiple instruments or parts. It goes beyond simple part hiding to enable detailed examination and manipulation of individual instrument lines, while maintaining the integrity of the full score.

1.  **Full Score View**: The primary view will display the complete musical score with all instruments and parts visible, as it would appear in a traditional orchestral or ensemble score. This view serves as the master reference.

2.  **Individual Part View (Linked)**:
    *   **Description**: For each instrument in the score, users will be able to generate and view a separate, dedicated part. This individual part view will be dynamically linked to the full score. Changes made in the individual part view (e.g., note edits) will automatically reflect in the full score, and vice-versa, ensuring data consistency.
    *   **Editable Notes**: Within the individual part view, users will have the ability to directly edit musical notes (pitch, duration, articulation, dynamics). These edits will propagate to the underlying MusicXML data and, consequently, to the full score view.
    *   **Independent Layout**: While note content changes are linked, the layout of the individual part (e.g., system breaks, page breaks, spacing adjustments, measure numbering) can be independently optimized for that specific instrument without affecting the layout of the full score or other individual parts. This allows for creating performer-friendly parts.
    *   **Annotations**: Annotations made on an individual part will be specific to that part and will not necessarily appear on the full score or other parts, unless explicitly chosen to be shared. This allows musicians to add personal markings without cluttering the master score.

3.  **Part Management UI**: A dedicated user interface will allow users to:
    *   Select which individual part to view.
    *   Toggle between full score view and individual part view.
    *   Generate new individual parts if not already created.
    *   Apply layout optimizations specific to an individual part.
    *   Export individual parts as separate PDF or image files.

4.  **Technical Considerations for Implementation**:
    *   **Data Model**: A robust internal data model is required to manage the MusicXML data. This model must support granular note-level editing and maintain relationships between the full score and individual parts.
    *   **OSMD Interaction**: Deep interaction with OSMD's API will be necessary to render individual parts, handle dynamic updates, and potentially manipulate its internal representation of the score.
    *   **Layout Engine**: For independent layout of individual parts, a custom layout engine or a sophisticated use of OSMD's layout options will be needed. This is a complex aspect, as OSMD primarily focuses on full score rendering.
    *   **Change Propagation**: A mechanism to efficiently propagate changes (note edits) between the individual part view and the full score view, and to other linked parts, without triggering full re-renders of the entire score every time.
    *   **State Management**: Advanced state management will be crucial to handle the complex state of multiple linked parts, their individual layouts, and annotations.

This feature will significantly enhance the application's utility for composers, arrangers, and ensemble musicians, providing a powerful environment for both viewing and manipulating complex scores.

---

## Development Roadmap for GPT-5 Copilot Integration

This roadmap outlines a phased approach for integrating GPT-5 Copilot into the development workflow for the musical sheet viewer. The focus is on incremental improvements and new feature implementation with performance as a paramount consideration. Each step is meticulously broken down into five sub-steps, designed to be a manageable, atomic task for an AI assistant like Copilot, allowing for focused development, easier integration, and clear progress tracking. This granular approach directly addresses the user's concerns about zoom fluidity and overall application responsiveness.

### Phase 1: Core Performance Optimizations (Stability, Responsiveness & Fluid Zoom)

**Goal**: Ensure the existing musical sheet viewer is highly performant, responsive, and provides a fluid, lag-free zoom experience, especially with larger scores, before introducing complex new features.

**Copilot Tasks (One Task at a Time)**:

1.  **Task**: Optimize `osmd.render()` Calls for Fluidity.
    *   **Sub-step 1.1**: Implement Debouncing for Window Resize Events.
        *   **Description**: Modify the `useEffect` hook that listens for window resize events. Introduce a debounce function (e.g., from a utility library like Lodash or a custom implementation) to wrap the `osmdInstance?.render()` call. This will ensure that `render()` is only called once after a short period of inactivity following resize events, preventing excessive and unnecessary re-renders during rapid window resizing.
        *   **Copilot Prompt Example**: "Refactor the `useEffect` hook responsible for handling window resize events in `ScoreViewer`. Implement a debounce function with a delay of 200ms around the `osmdInstance.render()` call to optimize performance during window resizing. Provide a clear comment explaining the debounce logic."
        *   **Performance Impact**: Significantly reduces CPU load during window resizing, leading to a smoother user experience and preventing UI freezes or stuttering that can occur from continuous re-rendering.
    *   **Sub-step 1.2**: Implement Throttling for Zoom and Pan Interactions.
        *   **Description**: Analyze the `handleWheel`, `handleMouseMove`, and `handleTouchMove` functions within the `usePan` and `useZoom` hooks. If `osmdInstance?.render()` or other expensive operations are directly triggered by these high-frequency events, apply throttling. This limits the rate at which these operations can execute, ensuring that the UI remains responsive and fluid during continuous interactive manipulations like zooming and panning.
        *   **Copilot Prompt Example**: "Examine the `handleWheel` and `handleMouseMove` functions. If `osmdInstance.render()` is called directly within these, implement a throttling mechanism with a 50ms delay to ensure smooth, lag-free visual updates during continuous user interaction. Explain the throttling rationale."
        *   **Performance Impact**: Guarantees a fluid and responsive visual experience during interactive zoom and pan operations by preventing the main thread from being overwhelmed, directly addressing potential lagging issues.
    *   **Sub-step 1.3**: Investigate and Apply OSMD Rendering Options for Fluidity.
        *   **Description**: Deep dive into the `OpenSheetMusicDisplay` documentation and source code to identify specific rendering options that can be toggled or configured to prioritize performance and fluidity, especially for large scores. This might include options like `renderSingleHorizontalStaffline`, `drawPartNames`, `drawMeasureNumbers`, or `renderClefs`. Experiment with dynamically disabling non-critical visual elements *during interaction* (e.g., while zooming or panning) and re-enabling them when the interaction stops.
        *   **Copilot Prompt Example**: "Research `OpenSheetMusicDisplay` rendering options that can enhance performance. Propose and implement a configuration within the `osmd` initialization that prioritizes rendering speed and fluidity for large scores, potentially by simplifying some visual elements. Add comments detailing the impact of each chosen option."
        *   **Performance Impact**: Leads to faster initial rendering and significantly smoother interaction with large scores by reducing the complexity of the rendered SVG, directly addressing the user's concern about zoom lagging and overall fluidity.
    *   **Sub-step 1.4**: Optimize OSMD Instance Re-initialization and Re-rendering Logic.
        *   **Description**: Review the `useEffect` hooks related to `osmdInstance` initialization and re-rendering (e.g., when `file` or `lockView` changes). Ensure that `osmdInstance.render()` is called only when absolutely necessary and that the `setOptions` calls are efficient. Avoid full re-initialization of OSMD if only options need to be changed.
        *   **Copilot Prompt Example**: "Analyze the `useEffect` dependencies and logic for `osmdInstance` initialization and updates. Refactor the code to ensure `osmdInstance.render()` is called minimally and efficiently, avoiding unnecessary full re-initializations when only view settings or options change. Focus on optimizing the `useEffect` that depends on `lockView`."
        *   **Performance Impact**: Reduces the overhead of re-rendering the entire score, especially when switching view modes or applying minor settings changes, contributing to a more responsive application.
    *   **Sub-step 1.5**: Implement `requestAnimationFrame` for Critical Visual Updates.
        *   **Description**: For any custom visual updates related to pan or zoom that are not directly handled by OSMD's internal rendering but affect the main score container (e.g., CSS `transform` properties applied to `viewportRef.current`), ensure these updates are batched and executed within `requestAnimationFrame` callbacks. This synchronizes visual changes with the browser's refresh rate, leading to smoother animations.
        *   **Copilot Prompt Example**: "Review the `panTo` function and any direct DOM manipulations related to `panState` or `zoom`. Ensure that all visual updates (e.g., setting `transform` styles) are wrapped within `requestAnimationFrame` to achieve the smoothest possible animations and prevent visual tearing."
        *   **Performance Impact**: Ensures that visual updates are rendered at the optimal time, preventing jank and creating a perceptibly smoother and more fluid user experience, especially during high-frequency interactions.

2.  **Task**: Enhance Zoom Feature Responsiveness and Accuracy.
    *   **Sub-step 2.1**: Refine `useZoom` Hook for Precision and Smoothness.
        *   **Description**: Conduct a detailed review of the `useZoom` hook's internal calculations for zoom levels and `transform-origin`. Ensure that floating-point arithmetic is handled carefully to prevent cumulative errors that could lead to subtle visual glitches or non-fluid transitions over time. Verify that the `smoothZoom` function provides a perceptibly smooth animation curve.
        *   **Copilot Prompt Example**: "Examine the `useZoom` hook, specifically the `smoothZoom` function and how `transform-origin` is calculated. Refine the zoom calculation logic to ensure pixel-perfect precision and a visually smooth interpolation between zoom levels, eliminating any perceived 'jumps' or 'snaps'."
        *   **Performance Impact**: Directly improves the perceived quality and responsiveness of the zoom feature, making it feel professional, intuitive, and truly fluid, addressing the user's feedback about it being 'broken'.
    *   **Sub-step 2.2**: Implement Consistent Hardware Acceleration for Zoom/Pan.
        *   **Description**: Thoroughly audit the CSS properties applied to the score container and its parent elements that are affected by zoom and pan. Confirm that `transform` properties are consistently triggering hardware acceleration across different browsers. Proactively apply the `will-change` CSS property to elements that undergo frequent transformations (e.g., the main score container) to hint to the browser about upcoming changes, promoting consistent GPU utilization.
        *   **Copilot Prompt Example**: "Audit the `score.css` and inline styles related to the main score container and its children. Ensure that `transform` is the primary property used for zoom and pan. Add `will-change: transform;` to the relevant elements to encourage hardware acceleration and prevent layout recalculations."
        *   **Performance Impact**: Leverages the GPU for rendering transformations, leading to significantly smoother and lag-free zoom and pan animations, even on less powerful devices or with complex scores.
    *   !!!!!!**Sub-step 2.3**: Optimize Image/SVG Loading for Adaptive Zoom Levels.
        *   **Description**: Investigate advanced optimization techniques for handling large SVG outputs from OSMD. This involves exploring if OSMD can dynamically render lower-resolution SVG elements or simplified graphical representations at lower zoom levels, and then progressively load higher-resolution details as the user zooms in. This might require custom logic to interact with OSMD's internal rendering pipeline or exploring alternative rendering strategies.
        *   **Copilot Prompt Example**: "Research `OpenSheetMusicDisplay` capabilities for adaptive rendering based on zoom level. If direct support is limited, propose a strategy to simplify the SVG DOM structure or reduce detail when zoomed out, and progressively enhance it when zoomed in, to reduce rendering load at various zoom levels."
        *   **Performance Impact**: Reduces the amount of data the browser needs to render at any given time, preventing lag and improving responsiveness during zoom operations on very complex or large scores.
    *   **Sub-step 2.4**: Implement Zoom Level Caching and Pre-rendering.
        *   **Description**: For frequently used zoom levels or for scores that are often revisited, consider caching the rendered SVG output for specific zoom levels. This could involve storing pre-rendered SVG fragments or even entire score pages in memory or `IndexedDB`, allowing for instant display when switching between cached zoom levels.
        *   **Copilot Prompt Example**: "Design and implement a caching mechanism for rendered OSMD SVG output at common zoom levels (e.g., 50%, 100%, 150%). When a user zooms to a cached level, retrieve the pre-rendered SVG instead of re-rendering, to provide instant visual feedback."
        *   **Performance Impact**: Eliminates rendering delays when switching between common zoom levels, providing an extremely fluid and instantaneous zoom experience.
    *   **Sub-step 2.5**: Refine Pan Boundaries and Content Centering.
        *   **Description**: Ensure that the pan functionality (via `usePan` hook) has well-defined boundaries that prevent the user from panning too far off the score, while also allowing for smooth and intuitive navigation. Refine the `centerContent` function to accurately center the score within the viewport after zoom or mode changes, providing a consistent starting point for interaction.
        *   **Copilot Prompt Example**: "Review and refine the `usePan` hook to implement intelligent pan boundaries, preventing the user from dragging the score endlessly into empty space. Also, enhance the `centerContent` function to precisely center the score within the viewport, accounting for current zoom level and score dimensions."
        *   **Performance Impact**: Improves the usability and perceived fluidity of the pan feature, making navigation more intuitive and less frustrating.

3. !!!!!! **Task**: Optimize State Updates and Prevent Unnecessary Re-renders.
    *   **Sub-step 3.1**: Conduct Comprehensive React Profiling Sessions.
        *   **Description**: Utilize the React DevTools Profiler to systematically identify every instance of unnecessary re-renders within the `ScoreViewer` component and all its direct and indirect children (e.g., `EditControls`, `MusicalControlPoint`, `DistanceVisualization`, and any components within `useScoreStore`, `useZoom`, `usePan`, `useEditMode`). Run profiling sessions during various user interactions (file load, zoom, pan, mode switch, annotation). Document the findings, noting component names, render times, and reasons for re-renders.
        *   **Copilot Prompt Example**: "Perform a series of React profiling sessions on the `ScoreViewer` application under different scenarios: initial load, zooming, panning, switching view modes, and interacting with edit controls. Generate a detailed report identifying all components that re-render unnecessarily and their associated render times."
        *   **Performance Impact**: Provides precise, data-driven insights into where CPU cycles are being wasted, allowing for highly targeted optimization efforts.
    *   **Sub-step 3.2**: Strategically Apply `React.memo` to Pure Components.
        *   **Description**: Based on the profiling results, identify pure functional components that are frequently re-rendered without their props changing. Apply `React.memo` to these components to prevent re-rendering if their props remain shallowly equal. Prioritize components that are rendered many times or have complex render trees.
        *   **Copilot Prompt Example**: "Based on the profiling report from Sub-step 3.1, identify pure functional components within the `ScoreViewer` hierarchy that are re-rendering unnecessarily. Apply `React.memo` to `MusicalControlPoint`, `DistanceVisualization`, and any other suitable components to optimize their rendering behavior."
        *   **Performance Impact**: Reduces the number of component renders, significantly improving overall application performance and responsiveness by avoiding redundant work.
    *   **Sub-step 3.3**: Implement `useCallback` for Stable Function References.
        *   **Description**: Review all functions passed as props from parent components to child components, especially those used in `useEffect` dependencies or as event handlers. Wrap these functions in `useCallback` to memoize them. This ensures that the function reference remains stable across renders, preventing child components wrapped in `React.memo` from re-rendering unnecessarily due to a new function reference.
        *   **Copilot Prompt Example**: "Examine the `ScoreViewer` component and its custom hooks (`usePan`, `useZoom`, `useEditMode`). Apply `useCallback` to all functions that are passed as props to child components or used in `useEffect` dependency arrays, such as `handleMouseDown`, `handleMouseMove`, `handleMouseUp`, `smoothZoom`, `zoomIn`, `zoomOut`, `startDrag`, `updateDrag`, and `endDrag`."
        *   **Performance Impact**: Prevents unnecessary re-renders of memoized child components, leading to a more efficient and performant React component tree.
    *   **Sub-step 3.4**: Utilize `useMemo` for Expensive Calculations and Object Creations.
        *   **Description**: Identify any expensive calculations, complex object creations, or array transformations that occur within the render cycle of `ScoreViewer` or its hooks. Wrap these computations in `useMemo` to cache their results. The cached value will only be re-computed if its dependencies change, avoiding redundant work on subsequent renders.
        *   **Copilot Prompt Example**: "Review the `ScoreViewer` component for any expensive inline object creations or calculations, such as `getSheetTransform`, `getPageTransform`, or any data processing logic. Apply `useMemo` to these sections to memoize their results, ensuring they are only re-computed when their dependencies change."
        *   **Performance Impact**: Minimizes redundant computations, freeing up CPU cycles and contributing to a smoother user experience by reducing the time spent in the render phase.
    *   **Sub-step 3.5**: Implement State Batching and Immutable Updates.
        *   **Description**: Ensure that state updates are batched where possible to minimize the number of React renders. For complex state objects or arrays, enforce immutable update patterns (e.g., using spread syntax `...` or `map`/`filter` for arrays) to prevent accidental mutations that can bypass React's change detection and lead to unexpected re-renders or bugs.
        *   **Copilot Prompt Example**: "Review state update patterns within `useScoreStore` and other stateful hooks. Ensure that all state updates, especially for objects and arrays, are immutable. Where multiple state updates occur in quick succession, investigate if they can be batched using `ReactDOM.unstable_batchedUpdates` (if applicable) or by combining updates into a single `setState` call."
        *   **Performance Impact**: Reduces the total number of renders, leading to a more efficient update cycle and preventing subtle bugs related to mutable state, thereby improving overall application stability and performance.

4.  **Task**: Optimize Large File Handling and Initial Load Time.
    *   **Sub-step 4.1**: Implement Progressive Loading/Parsing Feedback.
        *   **Description**: Enhance the loading state UI to provide more specific and progressive feedback during the score loading process. Instead of a generic 'loading' message, display distinct stages such as 'Reading file...', 'Decompressing MusicXML...', 'Parsing score data...', and 'Rendering musical sheet...'. This improves perceived performance and keeps the user informed during potentially long waits.
        *   **Copilot Prompt Example**: "Modify the `loadScoreFile` function to update the `loadingState` with more granular messages. Introduce new loading states like `reading-file` (during `readFileContent`), `decompressing` (if `.mxl` file), `parsing-data` (during `osmdInstance.load`), and `rendering-sheet` (during `osmdInstance.render`). Update the UI to display these messages sequentially."
        *   **Performance Impact**: Improves perceived performance and user experience by providing clear, step-by-step feedback during potentially long loading processes, reducing user frustration.
    *   **Sub-step 4.2**: Investigate and Implement Web Worker for MusicXML Parsing.
        *   **Description**: Conduct thorough profiling to confirm if the `osmdInstance.load(content)` step (which involves MusicXML parsing) is a significant bottleneck for very large files. If it is, research and implement a Web Worker to offload this CPU-intensive parsing process from the main thread. The Web Worker would parse the MusicXML and send the processed data back to the main thread for rendering by OSMD, ensuring the UI remains responsive.
        *   **Copilot Prompt Example**: "Profile the `osmdInstance.load(content)` call for large MusicXML files. If it blocks the main thread for more than 50ms, create a Web Worker to handle the MusicXML parsing. Implement the communication mechanism between the main thread and the worker to send the raw file content and receive the parsed OSMD data."
        *   **Performance Impact**: Prevents UI freezes and ensures responsiveness during the most CPU-intensive part of large file loading, providing a smoother user experience.
    *   **Sub-step 4.3**: Implement Basic Caching for Recently Viewed Scores.
        *   **Description**: For frequently accessed scores, implement a simple in-memory or `localStorage`/`IndexedDB` caching mechanism. The cache could store the raw MusicXML content, or even a serialized version of the parsed OSMD data (if OSMD provides such an API). When a user attempts to load a score, check the cache first. If found, load from cache; otherwise, load normally and then store the content in the cache for future use.
        *   **Copilot Prompt Example**: "Design and implement a basic caching mechanism for recently viewed scores. Use `localStorage` to store the raw MusicXML content, keyed by a unique identifier (e.g., file hash or a combination of title and composer). Before calling `loadScoreFile`, check if the score exists in the cache and load it if available."
        *   **Performance Impact**: Significantly speeds up subsequent loads of the same score, improving user experience for repeat visitors and reducing server load if scores are fetched remotely.
    *   **Sub-step 4.4**: Optimize `readFileContent` for Different File Types.
        *   **Description**: Review the `readFileContent` function. While it correctly handles `.mxl` as `ArrayBuffer` and others as `Text`, ensure that the file reading process itself is as efficient as possible. For very large text-based MusicXML files, consider if there are ways to read them incrementally or to optimize the `FileReader` usage.
        *   **Copilot Prompt Example**: "Analyze the `readFileContent` function for potential optimizations. Ensure that the `FileReader` usage is efficient for both text and array buffer modes. If performance issues arise with extremely large text files, investigate streaming approaches or chunked reading."
        *   **Performance Impact**: Ensures that the initial file reading process is fast and does not become a bottleneck, especially for large input files.
    *   **Sub-step 4.5**: Implement Placeholder/Skeleton UI for Initial Render.
        *   **Description**: Before the full musical score is rendered, display a lightweight placeholder or skeleton UI. This could be a simplified representation of a musical staff or a generic loading animation that occupies the space where the score will appear. This technique improves perceived loading speed and prevents layout shifts.
        *   **Copilot Prompt Example**: "Implement a skeleton UI or placeholder component that is displayed while the musical score is loading and rendering. This placeholder should mimic the general layout of a musical sheet (e.g., staff lines) to provide immediate visual feedback to the user."
        *   **Performance Impact**: Enhances perceived performance by giving the user immediate visual feedback, making the application feel faster and more responsive during the initial load.

### Phase 2: Core Feature Development (Focus: User Interaction & Basic Functionality)

**Goal**: Implement fundamental new features that enhance user interaction and provide essential musical functionality.

**Copilot Tasks (One Task at a Time)**:

1.  **Task**: Implement Basic Interactive Playback (MIDI).
    *   **Sub-step 1.1**: Integrate MIDI Playback Library and Basic Setup.
        *   **Description**: Select and integrate a suitable MIDI playback library (e.g., `Tone.js`, `Midi.js`, or a simpler Web Audio API-based solution). Set up the necessary audio context, synthesizers, and basic MIDI event handling within the application. Ensure the library can load and play MIDI data.
        *   **Copilot Prompt Example**: "Integrate `Tone.js` into the `ScoreViewer` project. Initialize the `Tone.js` Transport and a basic polyphonic synthesizer (e.g., `Synth`). Create a utility function to load a simple sequence of notes and play it back."
        *   **New Feature**: Establish the foundational audio playback capability for the musical score.
    *   **Sub-step 1.2**: Add Play/Pause/Stop Controls to UI.
        *   **Description**: Design and implement intuitive UI buttons for 'Play', 'Pause', and 'Stop' functionality. Connect these buttons to the integrated MIDI playback library's controls, allowing users to start, pause, and stop the audio playback of the loaded score.
        *   **Copilot Prompt Example**: "Add 'Play', 'Pause', and 'Stop' buttons to the `ScoreViewer` toolbar, using `lucide-react` icons (e.g., `Play`, `Pause`, `Square`). Implement `onClick` handlers for these buttons to control the `Tone.js` Transport (start, pause, stop) based on the current playback state."
        *   **New Feature**: Provides essential user control over the interactive audio playback.
    *   **Sub-step 1.3**: Extract MIDI Data from OSMD Instance.
        *   **Description**: Develop a robust method to extract MIDI-compatible note and timing data (e.g., pitch, duration, start time, instrument) from the `OpenSheetMusicDisplay` instance. This data will be the input for the chosen MIDI playback library. This might involve traversing OSMD's internal data structures (e.g., `sheet.sourceMeasures`, `sheet.instruments`).
        *   **Copilot Prompt Example**: "Create a helper function, `extractMidiData(osmdInstance)`, that processes the `osmdInstance` to generate a structured array of MIDI events (e.g., `{ time: '0:0:0', note: 'C4', duration: '4n' }`) suitable for `Tone.js` or a similar MIDI library. Consider handling multiple instruments and tempo changes."
        *   **New Feature**: Enables the musical score to be heard, bridging the visual and auditory experience.
    *   **Sub-step 1.4**: Connect Extracted MIDI Data to Playback.
        *   **Description**: Once MIDI data is extracted from OSMD, feed this data into the playback library. Ensure that the playback accurately reflects the notes, rhythms, and tempo of the displayed score. Handle any necessary format conversions or sequencing.
        *   **Copilot Prompt Example**: "Modify the 'Play' button's handler to first call `extractMidiData` and then load the resulting MIDI events into the `Tone.js` sequence or part. Ensure that playback starts from the beginning of the score and respects the tempo defined in the score metadata."
        *   **New Feature**: Fully functional basic audio playback of the displayed musical score.
    *   **Sub-step 1.5**: Implement Basic Playback Progress Indicator.
        *   **Description**: Add a simple visual indicator (e.g., a progress bar or a time display) that shows the current playback position within the score. This provides users with feedback on where they are in the music.
        *   **Copilot Prompt Example**: "Implement a simple progress bar or text display (e.g., '0:00 / 3:45') that updates in real-time during playback to show the current position in the score. Connect this to the `Tone.js` Transport's time updates."
        *   **New Feature**: Enhances user experience by providing visual feedback during playback.

2.  **Task**: Develop Basic Annotation Overlay (Text Notes).
    *   **Sub-step 2.1**: Create Scalable SVG Overlay for Annotations.
        *   **Description**: Implement a transparent SVG layer that is positioned precisely over the `OpenSheetMusicDisplay` rendering. This SVG layer must scale and pan synchronously with the underlying musical score, ensuring that annotations remain correctly aligned regardless of zoom or pan. It should also be capable of capturing mouse/touch events.
        *   **Copilot Prompt Example**: "Create a new React component, `AnnotationOverlay`, that renders a transparent SVG element. This SVG should be absolutely positioned over the OSMD container and its `viewBox` and `transform` properties should dynamically update to match the current zoom and pan state of the musical score, ensuring perfect alignment."
        *   **New Feature**: Provides a dedicated, responsive visual layer for user-generated annotations without modifying the core score rendering.
    *   **Sub-step 2.2**: Implement Click-to-Add Text Note Functionality.
        *   **Description**: When the application is in an 'Annotation Mode' (e.g., toggled by a button), allow users to click anywhere on the SVG annotation overlay. At the precise clicked location, a small, editable text input field should appear, enabling them to type a short text note. The input field should automatically gain focus.
        *   **Copilot Prompt Example**: "In `AnnotationOverlay`, when an 'Annotation Mode' is active, implement an `onClick` handler for the SVG element. At the `event.clientX` and `event.clientY` coordinates, render a temporary HTML `<textarea>` or `<input type='text'>` element. This input should be positioned correctly relative to the SVG's coordinate system and automatically focused."
        *   **New Feature**: Enables intuitive and direct creation of text-based annotations on the score.
    *   **Sub-step 2.3**: Display and Temporarily Store Text Annotations.
        *   **Description**: Once a user finishes typing a note (e.g., by pressing Enter or blurring the input), the text should be rendered as a permanent SVG `<text>` element on the annotation overlay. These annotations should be temporarily stored in a React state variable (e.g., `useState` in the `ScoreViewer` or a dedicated annotation store) to manage their presence and properties.
        *   **Copilot Prompt Example**: "When the text input from Sub-step 2.2 loses focus or 'Enter' is pressed, hide the input and render the text as an SVG `<text>` element on the `AnnotationOverlay`. Store the text content, its `x`, `y` coordinates, and a unique ID in a `useState` array within `ScoreViewer` or a new `useAnnotationStore`."
        *   **New Feature**: Makes user-created text annotations visible and manageable within the current session.
    *   **Sub-step 2.4**: Implement Basic Annotation Selection and Deletion.
        *   **Description**: Allow users to select an existing text annotation (e.g., by clicking on its SVG text element). Once selected, provide a simple UI mechanism (e.g., a small 'X' button or a 'Delete' key press) to remove the annotation from the score and the temporary storage.
        *   **Copilot Prompt Example**: "Add `onClick` handlers to the rendered SVG `<text>` annotations. When an annotation is clicked, mark it as 'selected' (e.g., by adding a CSS class or changing its fill color). Implement a 'Delete' button or listen for the 'Delete' key press to remove the selected annotation from the state and the SVG."
        *   **New Feature**: Provides basic management capabilities for user-generated content.
    *   **Sub-step 2.5**: Ensure Annotations Scale and Pan Correctly.
        *   **Description**: Verify that all rendered text annotations on the SVG overlay correctly scale and pan along with the underlying musical score when the user zooms or pans. This requires careful coordination between the `useZoom`, `usePan` hooks, and the `AnnotationOverlay` component to apply the same transformations.
        *   **Copilot Prompt Example**: "Confirm that the SVG `<text>` elements representing annotations correctly inherit or apply the same `transform` (scale and translate) properties as the main musical score. Ensure that `transform-origin` is set appropriately for scaling to maintain relative positions during zoom."
        *   **New Feature**: Guarantees a consistent and intuitive user experience for annotations across all viewing manipulations.

3.  **Task**: Implement Part Selection/Hiding UI.
    *   **Sub-step 3.1**: Extract and Display Instrument List from Score Metadata.
        *   **Description**: Upon successful loading of a musical score, access the `osmdInstance` to extract a comprehensive list of all instruments present in the score. This list should include their names and any unique identifiers. Display these instrument names in a user-friendly UI element, such as a collapsible sidebar or a dropdown menu, allowing for easy selection.
        *   **Copilot Prompt Example**: "After `loadScoreFile` completes, extract the list of instruments from `osmdInstance.sheet.Instruments` or `metadata.instruments`. Create a new React component, `InstrumentSelector`, that displays these instrument names as a list of checkboxes or toggle switches within a sidebar."
        *   **New Feature**: Provides users with an overview of the score's instrumentation and the initial control mechanism.
    *   **Sub-step 3.2**: Implement Toggle Visibility for Individual Parts.
        *   **Description**: For each instrument listed in the UI, add a toggle control (e.g., a checkbox or switch). When a user toggles an instrument, use the `OpenSheetMusicDisplay` API (e.g., `osmdInstance.set and render` methods, or `osmdInstance.setOptions` if applicable) to dynamically hide or show that specific instrument's part on the musical score. Ensure the score re-renders efficiently after each visibility change.
        *   **Copilot Prompt Example**: "In the `InstrumentSelector` component, implement `onChange` handlers for each instrument toggle. When a toggle is activated/deactivated, call `osmdInstance.setOptions` or a similar OSMD API to control the visibility of the corresponding instrument part. Ensure the score re-renders to reflect the change."
        *   **New Feature**: Enables dynamic customization of the score view, allowing musicians to focus on specific parts.
    *   **Sub-step 3.3**: Implement 'Select All' / 'Deselect All' Functionality.
        *   **Description**: Add convenience buttons or toggles to the `InstrumentSelector` UI that allow users to quickly select all instruments (making all parts visible) or deselect all instruments (hiding all parts except perhaps a default lead part, or showing none). This simplifies managing complex scores.
        *   **Copilot Prompt Example**: "Add 'Select All' and 'Deselect All' buttons to the `InstrumentSelector`. Implement their `onClick` handlers to update the visibility state of all instruments simultaneously, and then trigger a re-render of the OSMD instance to apply these changes."
        *   **New Feature**: Improves usability for managing multiple instrument parts.
    *   **Sub-step 3.4**: Persist Part Visibility Settings Across Sessions.
        *   **Description**: Store the user's preferred part visibility settings (i.e., which instruments are currently visible or hidden) in `localStorage` or `IndexedDB`. When the same score is loaded again, or when the user revisits the application, automatically apply these saved settings to maintain a consistent viewing experience.
        *   **Copilot Prompt Example**: "Implement persistence for instrument visibility settings. When the instrument visibility state changes, save the current configuration (e.g., an array of visible instrument IDs) to `localStorage`. On application load, retrieve these settings and apply them to the `osmdInstance` after the score has loaded."
        *   **New Feature**: Provides a personalized and persistent viewing experience, reducing repetitive setup for users.
    *   **Sub-step 3.5**: Handle Scores with No Explicit Instrument Data.
        *   **Description**: For some simpler MusicXML files, explicit instrument data might be minimal or absent. Ensure the `InstrumentSelector` gracefully handles such cases, perhaps by defaulting to a single 'Score' option or inferring parts if possible, to prevent errors or an empty UI.
        *   **Copilot Prompt Example**: "Modify the `InstrumentSelector` to gracefully handle scores where `osmdInstance.sheet.Instruments` might be empty or contain generic data. In such cases, default to a single 'Full Score' option or attempt to infer parts based on staves if OSMD provides that information."
        *   **New Feature**: Enhances robustness and user experience for a wider range of MusicXML files.

4.  **Task**: Basic Print to PDF Functionality.
    *   **Sub-step 4.1**: Add Print Button to UI and Basic Styling.
        *   **Description**: Place a clearly labeled 'Print' button with an appropriate icon (e.g., from `lucide-react`) in a prominent location within the application's toolbar or menu. Apply basic styling to ensure it integrates well with the existing UI.
        *   **Copilot Prompt Example**: "Add a new `Button` component with the text 'Print' and the `Printer` icon from `lucide-react` to the main control bar of the `ScoreViewer` component. Ensure it has appropriate `className` for styling."
        *   **New Feature**: Provides an accessible entry point for printing functionality.
    *   **Sub-step 4.2**: Implement Click Handler to Trigger Browser Print Dialog.
        *   **Description**: Implement the `onClick` handler for the newly added print button. This handler should simply call `window.print()`, which will trigger the browser's native print dialog, allowing the user to select print options and a destination (e.g., physical printer or 'Save as PDF').
        *   **Copilot Prompt Example**: "Implement the `onClick` handler for the 'Print' button. Inside this handler, call `window.print()` to open the browser's native print dialog. Add a comment explaining that this will use the browser's default print capabilities."
        *   **New Feature**: Enables basic print functionality using native browser features.
    *   **Sub-step 4.3**: Create/Optimize CSS Print Styles (`@media print`).
        *   **Description**: Develop or refine a dedicated CSS stylesheet or a `@media print` block within the existing `score.css` file. These styles should ensure that the musical score is rendered optimally for printing. Key considerations include: scaling the score to fit standard paper sizes (e.g., A4), managing page breaks to avoid cutting off measures, and hiding non-essential UI elements (toolbars, sidebars, controls) that should not appear in the printed output.
        *   **Copilot Prompt Example**: "Create or update the `score.css` file with a `@media print` block. Within this block, add CSS rules to ensure that the main musical score container (`.music-sheet-container` or similar) scales correctly to fit the print page. Also, add rules to hide all control buttons, sidebars, and other non-score UI elements when printing."
        *   **New Feature**: Ensures professional-looking and usable printed output of the musical score.
    *   **Sub-step 4.4**: Handle Annotation Visibility in Print Output.
        *   **Description**: Determine how user annotations (text notes, drawings) should appear in the printed output. Provide an option (e.g., a checkbox in the print dialog or a setting) to include or exclude annotations from the print. Ensure annotations are rendered correctly on the printed page if included.
        *   **Copilot Prompt Example**: "Modify the `@media print` styles to control the visibility of annotations. Add a mechanism (e.g., a temporary CSS class toggled before `window.print()`) to allow users to choose whether annotations are included or excluded from the printed output."
        *   **New Feature**: Provides flexibility for users to print clean scores or scores with their personal markups.
    *   **Sub-step 4.5**: Implement Basic Export to Image (PNG/JPEG).
        *   **Description**: Add a button to export the currently displayed score (or a single page) as a high-resolution image file (e.g., PNG or JPEG). This will likely involve using a library like `html2canvas` to render the SVG content to a canvas, which can then be converted to an image data URL and downloaded.
        *   **Copilot Prompt Example**: "Add an 'Export as Image' button. Implement its `onClick` handler to use `html2canvas` to capture the content of the main score container. Convert the resulting canvas to a PNG data URL and trigger a download of the image file (e.g., 'score.png')."
        *   **New Feature**: Provides a simple way to share or use score snippets in other applications.

### Phase 3: Advanced Features & Refinements (Focus: Richness & Usability)

**Goal**: Enhance existing features and introduce more complex functionalities to provide a richer user experience.

**Copilot Tasks (One Task at a Time)**:

1.  **Task**: Implement Real-time Playback Synchronization and Visual Highlighting.
    *   **Sub-step 1.1**: Develop Robust Mapping from MIDI Time to OSMD Elements.
        *   **Description**: Create a sophisticated mapping mechanism that accurately correlates MIDI playback time (e.g., from `Tone.js` Transport) to specific visual elements (notes, rests, measures, beats) within the `OpenSheetMusicDisplay` rendering. This will require deep understanding of OSMD's internal data structures and layout information to identify the SVG elements corresponding to musical events at precise timestamps.
        *   **Copilot Prompt Example**: "Develop a utility function, `getOsmdElementAtTime(timeInSeconds)`, that, given a playback time, returns the corresponding SVG element ID or reference for the note, measure, or beat currently playing. This will involve traversing OSMD's `GraphicSheet` or `GraphicalMusicSheet` and their timing information."
        *   **New Feature**: Establishes the critical link between audio playback and visual score representation, enabling real-time synchronization.
    *   **Sub-step 1.2**: Implement Dynamic Visual Highlighting of Notes/Measures.
        *   **Description**: During MIDI playback, dynamically apply CSS classes or directly manipulate SVG attributes to visually highlight the currently playing notes, chords, or entire measures. The highlighting should be smooth, visually distinct, and performant, ensuring it doesn't introduce lag during playback.
        *   **Copilot Prompt Example**: "Integrate the `getOsmdElementAtTime` function into the `Tone.js` playback loop. For each note or measure that is currently playing, add a CSS class (e.g., `highlighted-note`, `highlighted-measure`) to its corresponding SVG element. Ensure the class is removed when the note ends."
        *   **New Feature**: Provides engaging and informative visual feedback, crucial for practice, learning, and performance analysis.
    *   **Sub-step 1.3**: Implement Playback Cursor/Follow-along Functionality.
        *   **Description**: Add a prominent visual cursor (e.g., a vertical line or a moving highlight bar) that traverses the score in real-time, indicating the exact playback position. The score view should automatically scroll or pan to keep this cursor continuously visible within the viewport, providing a 'follow-along' experience.
        *   **Copilot Prompt Example**: "Implement a vertical line SVG element that moves horizontally across the score, synchronized with the `Tone.js` Transport's time. Ensure the `ScoreViewer` automatically pans or scrolls to keep this playback cursor visible within the viewport, providing a smooth 'follow-along' experience."
        *   **New Feature**: Enhances user guidance and immersion during playback, making it easier to track the music.
    *   **Sub-step 1.4**: Implement Loop Playback for Selected Sections.
        *   **Description**: Allow users to select a specific range of measures or a section of the score and set it to loop continuously. Provide UI controls to define the start and end points of the loop, and to activate/deactivate looping.
        *   **Copilot Prompt Example**: "Add UI controls (e.g., start/end markers, a 'Loop' button) to enable loop playback. When a section is selected, configure the `Tone.js` Transport to loop only that segment of the extracted MIDI data. Visually indicate the looped section on the score."
        *   **New Feature**: Invaluable for practicing difficult passages or analyzing specific musical phrases.
    *   **Sub-step 1.5**: Implement Adjustable Playback Speed (Tempo).
        *   **Description**: Provide a UI control (e.g., a slider or input field) that allows users to adjust the playback tempo of the score dynamically. The tempo change should be reflected in both the audio playback and the visual cursor movement.
        *   **Copilot Prompt Example**: "Add a tempo control (e.g., a slider from 50% to 200% of original tempo) to the playback controls. Connect this control to the `Tone.js` Transport's tempo setting, ensuring that both audio and visual synchronization adapt to the new tempo."
        *   **New Feature**: Enhances practice and learning by allowing users to slow down or speed up music.

2.  **Task**: Develop Advanced Annotation Tools (Drawing, Symbols).
    *   **Sub-step 2.1**: Implement Freehand Drawing with Multiple Tools.
        *   **Description**: Extend the SVG annotation overlay to support freehand drawing with distinct tools: a 'Pen' tool (solid lines, variable thickness), and a 'Highlighter' tool (semi-transparent, broader strokes). Allow users to select colors and stroke widths for each tool. Implement robust mouse and touch event listeners for drawing paths.
        *   **Copilot Prompt Example**: "Enhance the `AnnotationOverlay` to include freehand drawing. Implement `onMouseDown`, `onMouseMove`, `onMouseUp` (and touch equivalents) to capture drawing paths. Provide UI buttons to switch between 'Pen' and 'Highlighter' tools, and color/stroke selectors. Store drawing data as SVG path strings."
        *   **New Feature**: Provides rich, expressive drawing capabilities for personalizing scores.
    *   **Sub-step 2.2**: Implement Musical Symbol Palette and Drag-and-Drop Insertion.
        *   **Description**: Create a comprehensive palette of common musical symbols (e.g., dynamics like `p`, `f`, `cresc.`; articulations like `staccato`, `accent`; fingerings; common chord symbols). Allow users to select a symbol from the palette and drag-and-drop it precisely onto the score. The symbol should be rendered as an SVG element on the annotation layer.
        *   **Copilot Prompt Example**: "Design and implement a draggable palette of common musical symbols. When a symbol is dragged from the palette onto the `AnnotationOverlay`, render it as an SVG `<image>` or `<text>` element at the drop coordinates. Ensure symbols scale correctly with the score."
        *   **New Feature**: Enables specialized musical markup, making annotations more precise and musically relevant.
    *   **Sub-step 2.3**: Implement Annotation Editing (Text, Drawing, Symbols).
        *   **Description**: Develop functionality to edit existing annotations. For text notes, allow users to re-open the text input and modify content. For drawings, enable changing color or stroke properties. For symbols, allow repositioning or resizing. This requires a selection mechanism for annotations.
        *   **Copilot Prompt Example**: "Implement an 'Edit Mode' for annotations. When an existing annotation (text, drawing, or symbol) is clicked, display appropriate editing controls (e.g., a text editor for text notes, color/stroke pickers for drawings, drag handles for symbols). Update the annotation's data in state upon changes."
        *   **New Feature**: Provides full lifecycle management for user-generated content, allowing for corrections and refinements.
    *   **Sub-step 2.4**: Implement Annotation Deletion and Clear All.
        *   **Description**: Provide clear and intuitive ways to delete individual annotations (e.g., a delete button on selection, or a 'Delete' key press). Also, include a 'Clear All Annotations' button to remove all user-generated markups from the current score.
        *   **Copilot Prompt Example**: "Add a 'Delete' button that appears when an annotation is selected. Implement its `onClick` handler to remove the selected annotation from the state. Also, add a 'Clear All Annotations' button to the toolbar that empties the annotation state array."
        *   **New Feature**: Offers control over user-generated content, allowing for cleanup and fresh starts.
    *   **Sub-step 2.5**: Implement Annotation Grouping and Layering.
        *   **Description**: For complex annotations, allow users to group multiple annotations together so they can be moved, scaled, or deleted as a single unit. Also, provide basic layering control (bring to front/send to back) for overlapping annotations.
        *   **Copilot Prompt Example**: "Explore implementing annotation grouping. When multiple annotations are selected, provide an option to 'Group' them, allowing them to be manipulated as one. Investigate SVG `z-index` or reordering elements in the DOM for basic layering control."
        *   **New Feature**: Enhances organization and manipulation of complex annotation sets.

3.  **Task**: Implement Advanced Transposition Tool (Instrument-Specific).
    *   **Sub-step 3.1**: Implement Core Transposition Logic for MusicXML.
        *   **Description**: Develop a robust utility function that takes raw MusicXML content (or OSMD's internal representation) and a specified transposition interval (in semitones) and returns the transposed MusicXML. This function must accurately adjust note pitches, key signatures, and potentially accidentals across all parts of the score. This is a critical backend logic piece.
        *   **Copilot Prompt Example**: "Create a pure JavaScript function, `transposeMusicXml(musicXmlContent, semitones)`, that parses the MusicXML, transposes all notes and updates the key signature based on the `semitones` value, and returns the modified MusicXML string. Consider using a MusicXML parsing library if available."
        *   **New Feature**: Provides the fundamental capability to change the key of the entire musical score.
    *   **Sub-step 3.2**: Add Instrument-Specific Transposition Options to UI.
        *   **Description**: Enhance the transposition UI with a dropdown menu or a list of common transposing instruments (e.g., 'C Instrument', 'Bb Trumpet', 'Eb Alto Saxophone', 'F French Horn', 'A Clarinet'). When an instrument is selected, the application should automatically apply the correct transposition interval (e.g., Bb Trumpet transposes down a major second) to the score using the core transposition logic.
        *   **Copilot Prompt Example**: "Add a dropdown menu to the `ScoreViewer` toolbar labeled 'Transpose for Instrument'. Populate it with common transposing instruments and their corresponding semitone transpositions. When an instrument is selected, call `transposeMusicXml` with the appropriate interval and re-load the score."
        *   **New Feature**: Provides a highly practical utility for musicians working with transposing instruments, simplifying score preparation.
    *   **Sub-step 3.3**: Implement 'Concert Pitch' vs. 'Transposed Pitch' Toggle.
        *   **Description**: Introduce a toggle button (e.g., 'Concert Pitch' / 'Transposed Pitch') that allows users to switch between viewing the score in its actual sounding pitch (concert pitch) and the pitch as it would be written for the selected transposing instrument. This is crucial for both performance and educational contexts.
        *   **Copilot Prompt Example**: "Add a toggle button 'Concert Pitch / Transposed Pitch'. When 'Concert Pitch' is active, display the score in its original (or concert transposed) key. When 'Transposed Pitch' is active, display it in the key appropriate for the currently selected transposing instrument. Ensure OSMD re-renders accordingly."
        *   **New Feature**: Offers flexible viewing options, catering to different musical needs and perspectives.
    *   **Sub-step 3.4**: Display Current Key Signature and Transposition State.
        *   **Description**: Clearly display the current key signature of the score (both concert and transposed, if applicable) in the UI. Also, provide a visual indicator of whether the score is currently being displayed in concert pitch or transposed pitch, and for which instrument.
        *   **Copilot Prompt Example**: "Add a display area near the transposition controls that shows the current key signature (e.g., 'C Major'). If a transposition is active, also display the transposed key (e.g., 'D Major for Bb Trumpet'). Indicate the active pitch mode (Concert/Transposed).
        *   **New Feature**: Enhances user awareness and clarity regarding the score's current key and transposition state.
    *   **Sub-step 3.5**: Handle Transposition of Annotations and Playback.
        *   **Description**: Ensure that any user-added annotations (text notes, symbols) remain correctly aligned and meaningful when the score is transposed. Additionally, if playback is implemented, ensure that the audio playback also reflects the transposed key, not the original.
        *   **Copilot Prompt Example**: "When the score is transposed, verify that existing annotations (text, symbols) maintain their correct relative positions. If playback is active, ensure that the MIDI data extracted for playback is also transposed to match the currently displayed key."
        *   **New Feature**: Guarantees consistency across all features when transposition is applied.

4.  **Task**: Implement Annotation Persistence and Versioning.
    *   **Sub-step 4.1**: Implement Local Storage Persistence for Annotations.
        *   **Description**: Develop a robust mechanism to save user-created annotations (text, drawings, symbols) to `localStorage` or `IndexedDB`. Annotations should be associated with a unique identifier for the musical score (e.g., a hash of the MusicXML content, or a combination of title and composer metadata) to ensure they are loaded correctly when the same score is opened again. Implement 'Save Annotations' and 'Load Annotations' buttons or an auto-save feature.
        *   **Copilot Prompt Example**: "Create a service or utility function to manage annotation persistence. When annotations are created or modified, save them as a JSON string to `localStorage`, keyed by the score's unique ID. On score load, check `localStorage` for existing annotations and load them into the `AnnotationOverlay`."
        *   **New Feature**: Ensures that user-generated content is retained across browser sessions, providing a persistent and personalized experience.
    *   **Sub-step 4.2**: Implement Basic Undo/Redo Functionality for Annotations.
        *   **Description**: Develop a simple undo/redo stack specifically for annotation changes. Each significant modification (e.g., adding a note, drawing a line, deleting a symbol) should be pushed onto this stack as a distinct state. Provide intuitive UI buttons for 'Undo' and 'Redo' that allow users to revert or reapply their annotation actions.
        *   **Copilot Prompt Example**: "Implement an undo/redo mechanism for the `AnnotationOverlay`. Maintain a history array of annotation states. When an annotation is added, edited, or deleted, push the new state onto the history. Add 'Undo' and 'Redo' buttons to the UI that navigate this history stack."
        *   **New Feature**: Provides a crucial safety net for users, allowing them to correct mistakes and experiment freely with annotations.
    *   **Sub-step 4.3**: Implement Annotation Export to JSON File.
        *   **Description**: Add a button to the UI that allows users to export all current annotations for the loaded score into a standard JSON file. This file should contain all necessary data (type, content, position, style) to recreate the annotations. This enables users to back up their markups or share them with others.
        *   **Copilot Prompt Example**: "Add an 'Export Annotations' button. Implement its `onClick` handler to serialize the current annotation state (e.g., the array of annotation objects) into a JSON string. Then, trigger a download of this JSON string as a `.json` file (e.g., 'score_annotations.json')."
        *   **New Feature**: Enhances data portability and sharing capabilities for user-generated content.
    *   **Sub-step 4.4**: Implement Annotation Import from JSON File.
        *   **Description**: Complementing the export feature, add a button that allows users to import annotations from a previously exported JSON file. The application should parse the JSON and render the imported annotations onto the current score, merging them with existing ones or replacing them based on user choice.
        *   **Copilot Prompt Example**: "Add an 'Import Annotations' button and a hidden file input. When a user selects a `.json` file, read its content, parse the JSON, and then add these annotations to the current score's annotation state. Provide a confirmation dialog for merging or replacing existing annotations."
        *   **New Feature**: Facilitates sharing, collaboration, and restoration of personal markups.
    *   **Sub-step 4.5**: Implement Annotation Versioning (Snapshots).
        *   **Description**: Beyond simple undo/redo, implement a more robust versioning system that allows users to create named 'snapshots' of their annotations at different points in time. Users should be able to browse these snapshots and revert to any previous version. This could be stored in `IndexedDB` for larger data.
        *   **Copilot Prompt Example**: "Implement a 'Snapshot' feature for annotations. Allow users to 'Save Snapshot' with a custom name. Store these snapshots (full annotation state) in `IndexedDB`. Provide a UI to 'Load Snapshot' and 'Delete Snapshot', allowing users to manage multiple versions of their annotations."
        *   **New Feature**: Provides advanced version control for user-generated content, enabling complex workflows and historical tracking.

### Phase 4: Polish, Accessibility & Advanced Optimizations (Focus: User Experience & Robustness)

**Goal**: Refine the application, improve accessibility, and implement further performance optimizations for a production-ready experience.

**Copilot Tasks (One Task at a Time)**:

1.  **Task**: Comprehensive Accessibility Audit and Implementation.
    *   **Sub-step 1.1**: Implement ARIA Attributes and Keyboard Navigation for All UI Elements.
        *   **Description**: Conduct a thorough audit of every interactive UI element (buttons, sliders, toggles, input fields, dropdowns) within the `ScoreViewer` and its sub-components. Add appropriate ARIA roles, states, and properties (e.g., `aria-label`, `aria-describedby`, `aria-pressed`, `aria-checked`, `aria-haspopup`). Ensure that all controls are fully navigable and operable using only the keyboard, including proper `tabIndex` management and focus trapping for modals.
        *   **Copilot Prompt Example**: "Review all interactive UI elements in `ScoreViewer` and its child components. For each, add appropriate ARIA attributes to convey its purpose and state to assistive technologies. Ensure that all controls are reachable and operable via keyboard navigation, and that focus management is logical and predictable."
        *   **Improvement**: Significantly enhances usability for users relying on assistive technologies (like screen readers) or keyboard-only navigation, making the application accessible to a wider audience.
    *   **Sub-step 1.2**: Optimize for Screen Reader Compatibility of Musical Content.
        *   **Description**: Investigate and implement strategies to make the musical content rendered by `OpenSheetMusicDisplay` accessible to screen readers. This is a challenging but crucial step. It might involve adding SVG `title` or `desc` elements to musical symbols, notes, and measures, or using `aria-hidden` for purely decorative SVG elements. Explore OSMD's accessibility features or community recommendations.
        *   **Copilot Prompt Example**: "Research how to make the SVG output of `OpenSheetMusicDisplay` semantically accessible to screen readers. For key musical elements (notes, clefs, time signatures, measures), add SVG `<title>` and `<desc>` elements containing descriptive text. Use `aria-hidden='true'` for any purely visual or redundant SVG elements."
        *   **Improvement**: Critical for visually impaired musicians to understand and navigate the musical score content, opening up the application to a significant user group.
    *   **Sub-step 1.3**: Implement High-Contrast Modes and Customizable Color Themes.
        *   **Description**: Provide users with options to switch to high-contrast themes (e.g., black text on white background, white text on black background) or to customize specific color aspects of the score (e.g., paper color, note color, line color) and the UI. These options should be easily accessible through a settings panel and persisted across sessions.
        *   **Copilot Prompt Example**: "Add a 'High Contrast Mode' toggle in the settings. When active, apply a CSS theme that uses strong color contrasts for all UI elements and the musical score. Also, provide color pickers in the settings for users to customize the background, note, and line colors of the score, persisting these preferences."
        *   **Improvement**: Increases readability and comfort for users with various visual impairments (e.g., color blindness, low vision) or simply personal preferences, enhancing overall user experience.
    *   **Sub-step 1.4**: Implement Resizable Text and UI Elements.
        *   **Description**: Ensure that the application's text content and UI elements can be easily resized by the user (e.g., via browser zoom or dedicated in-app controls) without breaking the layout or becoming unusable. This is important for users with low vision.
        *   **Copilot Prompt Example**: "Review the CSS for all text and UI elements. Ensure that font sizes and element dimensions are defined using relative units (e.g., `em`, `rem`, `vw`, `vh`) where appropriate, to allow for graceful scaling with browser zoom or custom text size settings."
        *   **Improvement**: Enhances usability for users with low vision or those who prefer larger text, making the application more adaptable.
    *   **Sub-step 1.5**: Provide Audio Cues for Key Interactions.
        *   **Description**: For key user interactions (e.g., file loaded, error occurred, playback started/stopped, annotation added), provide optional audio cues. These non-intrusive sounds can enhance feedback for all users, especially those with visual impairments.
        *   **Copilot Prompt Example**: "Integrate a small sound library (e.g., `howler.js`) and add subtle audio cues for key events: successful file load, error notification, playback start/stop, and annotation creation. Provide a toggle in settings to enable/disable these sounds."
        *   **New Feature**: Adds an additional layer of feedback, improving the overall user experience and accessibility.

2.  **Task**: Implement Theming and Customization Options.
    *   **Sub-step 2.1**: Create Comprehensive UI for Visual Customization.
        *   **Description**: Design and implement a dedicated settings panel or modal that provides a rich set of controls for customizing the visual appearance of both the musical score and the application interface. This includes controls for paper color, staff line thickness, notehead style, font choices for text elements (title, composer, lyrics), and overall UI theme (light/dark).
        *   **Copilot Prompt Example**: "Develop a 'Settings' modal. Include UI controls such as color pickers for 'Paper Color', 'Note Color', 'Line Color'; sliders for 'Staff Line Thickness'; dropdowns for 'Notehead Style' (if OSMD supports); and font selectors for score text elements. Add a 'Light/Dark Mode' toggle for the UI."
        *   **New Feature**: Provides extensive personalization options, allowing users to tailor the visual experience to their preferences.
    *   **Sub-step 2.2**: Integrate Customization Controls with OSMD Rendering Options.
        *   **Description**: Connect each UI customization control to the appropriate `osmdInstance.setOptions()` calls or direct SVG/CSS manipulations. Ensure that changes made in the settings panel are immediately reflected in the rendered musical score and UI, requiring efficient re-rendering or dynamic styling updates.
        *   **Copilot Prompt Example**: "Link the UI controls in the settings panel to the `osmdInstance`. For example, connect 'Paper Color' to `osmdInstance.setOptions({ pageBackgroundColor: '...' })`. For other properties, dynamically update CSS variables or inline styles on the OSMD container and its elements. Ensure efficient re-renders."
        *   **New Feature**: Enables dynamic and interactive visual customization of the score and interface.
    *   **Sub-step 2.3**: Persist User Preferences Across Sessions.
        *   **Description**: Store all user-chosen theme and customization settings (e.g., colors, thicknesses, styles, light/dark mode preference) in `localStorage` or `IndexedDB`. On application load, retrieve these settings and apply them to the `osmdInstance` and UI components before the score is fully rendered, ensuring a consistent personalized experience.
        *   **Copilot Prompt Example**: "Save all user customization settings (colors, styles, theme preference) to `localStorage` as a JSON object. On application initialization, retrieve these settings and apply them to the `osmdInstance` and the main React components to restore the user's preferred visual state."
        *   **New Feature**: Guarantees a consistent and personalized user experience, reducing repetitive setup for users.
    *   **Sub-step 2.4**: Implement Pre-defined Themes and Save/Load Custom Themes.
        *   **Description**: Provide a selection of pre-defined themes (e.g., 'Classic', 'Dark Mode', 'Sepia') that users can quickly apply. Additionally, allow users to save their own custom combinations of settings as named themes and load them later. This enhances flexibility and sharing of visual preferences.
        *   **Copilot Prompt Example**: "Add a dropdown for 'Pre-defined Themes' (e.g., 'Default', 'Dark', 'Sepia'). Implement logic to apply these themes. Also, add 'Save Custom Theme' and 'Load Custom Theme' buttons, allowing users to save their current settings as a named theme and load previously saved themes from `localStorage`."
        *   **New Feature**: Offers greater flexibility and convenience for managing visual styles.
    *   **Sub-step 2.5**: Ensure Theme Changes are Performant.
        *   **Description**: Optimize the process of applying theme changes to ensure it is performant and does not introduce lag. This might involve using CSS variables extensively, minimizing direct DOM manipulations, and ensuring that OSMD re-renders efficiently when its options are updated.
        *   **Copilot Prompt Example**: "Audit the theme application logic to ensure it's performant. Prioritize using CSS variables for styling changes. When `osmdInstance.setOptions` is called for theme updates, ensure that only necessary re-renders occur and that the process is smooth and jank-free."
        *   **Performance Impact**: Provides a seamless and responsive experience when users switch themes or customize settings.

3.  **Task**: Advanced Memory Usage Monitoring and Optimization.
    *   **Sub-step 3.1**: Integrate Browser Performance Monitoring APIs for Memory.
        *   **Description**: Utilize browser APIs such as `performance.memory` (non-standard but widely supported) and `PerformanceObserver` (for `measure` and `resource` entries) to continuously monitor the application's memory footprint. Log memory usage statistics (e.g., JS heap size, DOM node count) at key points (e.g., after score load, after complex interactions, periodically) for analysis.
        *   **Copilot Prompt Example**: "Implement a `PerformanceObserver` to track memory usage and DOM node count. Log `performance.memory.usedJSHeapSize` and `document.getElementsByTagName('*').length` to the console or a debug panel after `loadScoreFile` completes and every 30 seconds during active use. Provide clear timestamps."
        *   **Performance Impact**: Provides concrete, real-time data for identifying potential memory leaks or excessive memory consumption, which is crucial for long-term stability.
    *   **Sub-step 3.2**: Identify and Resolve Memory Leaks Systematically.
        *   **Description**: Based on the memory monitoring data and extensive use of browser developer tools' memory profilers (e.g., Chrome's Heap Snapshot, Allocation Instrumentation), systematically identify and resolve any memory leaks within the application. Pay particular attention to detached DOM nodes, uncleaned event listeners, and closures holding onto large objects. Focus on ensuring `osmdInstance` and related objects are properly garbage collected when a score is unloaded or replaced.
        *   **Copilot Prompt Example**: "Using Chrome DevTools' Heap Snapshot and Allocation Instrumentation, identify and fix any memory leaks. Specifically, ensure that when a new score is loaded, the previous `osmdInstance` and its associated DOM elements are fully garbage collected. Look for detached DOM nodes and uncleaned event listeners."
        *   **Performance Impact**: Ensures long-term application stability, prevents crashes, and maintains smooth performance, especially for users who open many scores or use the application for extended periods.
    *   **Sub-step 3.3**: Optimize OSMD Data Structures and Rendering Strategy.
        *   **Description**: Research if there are advanced `OpenSheetMusicDisplay` configurations, best practices, or community-contributed strategies for reducing its internal memory footprint, especially for very large and complex scores. This might involve discussions with the OSMD community, analyzing OSMD's source code for memory-intensive operations, or exploring alternative rendering backends (if OSMD supports them) that might be more memory-efficient.
        *   **Copilot Prompt Example**: "Consult OSMD documentation and community forums for strategies to reduce memory consumption for extremely large scores. Implement any recommended practices for optimizing OSMD's internal data structures or rendering pipeline, such as enabling specific options that trade off detail for memory efficiency."
        *   **Performance Impact**: Reduces the overall memory footprint of the application, making it more efficient and accessible on devices with limited RAM, and improving performance for large scores.
    *   **Sub-step 3.4**: Implement Virtualization for Long Scores (if applicable).
        *   **Description**: For extremely long scores that might exceed typical viewport heights, investigate implementing virtualized rendering. This technique only renders the parts of the score that are currently visible in the viewport, significantly reducing the number of DOM elements and memory usage. This is a complex optimization and might require custom rendering logic or a virtualization library.
        *   **Copilot Prompt Example**: "Research the feasibility of implementing virtualization for very long musical scores. If OSMD's structure allows, use a library like `react-window` or `react-virtualized` to render only the visible pages or sections of the score, reducing DOM overhead and memory usage."
        *   **Performance Impact**: Drastically reduces DOM size and memory consumption for very long scores, leading to much smoother scrolling and overall performance.
    *   **Sub-step 3.5**: Proactive Resource Management and Cleanup.
        *   **Description**: Implement explicit resource management and cleanup routines for all external resources (e.g., `FileReader` instances, `Tone.js` audio contexts, large arrays/objects) when they are no longer needed. Ensure that `useEffect` cleanup functions are robust and that any global listeners or timers are properly removed to prevent resource leaks.
        *   **Copilot Prompt Example**: "Conduct a code review to ensure all `useEffect` hooks have proper cleanup functions. Explicitly `dispose()` or `close()` any external library instances (e.g., `Tone.js` context) when the component unmounts or when a new score is loaded. Verify that all global event listeners are removed."
        *   **Performance Impact**: Prevents accumulation of unused resources, ensuring consistent performance and preventing crashes over extended periods of use.

### Phase 5: Sheet Engraving & Multi-Instrument Features (Professionalism & Collaboration)

**Goal**: Implement advanced features for professional sheet engraving and robust multi-instrument management, enhancing the application's utility for composers, arrangers, and ensemble musicians.

**Copilot Tasks (One Task at a Time)**:

1.  **Task**: Implement Advanced Engraving Customization.
    *   **Sub-step 1.1**: Expose OSMD Engraving Options via UI.
        *   **Description**: Identify key engraving options within `OpenSheetMusicDisplay` (e.g., `setOptions` for note spacing, staff line thickness, font sizes for various elements like dynamics, lyrics, titles). Create a dedicated UI panel (e.g., a modal or sidebar) where users can adjust these parameters. Ensure changes are applied dynamically to the `osmdInstance` and trigger a re-render.
        *   **Copilot Prompt Example**: "Research OSMD's `setOptions` method for engraving-related properties. Create a new React component, `EngravingSettingsPanel`, with sliders, dropdowns, and input fields that allow users to modify `noteSpacing`, `staffLineThickness`, `titleFontHeight`, `lyricFontHeight`, etc. Link these UI controls to `osmdInstance.setOptions`."
        *   **New Feature**: Provides users with fine-grained control over the visual appearance of the musical score, enabling adherence to engraving best practices.
    *   **Sub-step 1.2**: Implement Custom Font Loading and Application.
        *   **Description**: Allow users to upload and apply custom music fonts (e.g., SMuFL-compliant fonts) or select from a curated list of pre-installed fonts. Implement the necessary font loading mechanism (e.g., `@font-face` rules dynamically injected) and ensure OSMD can utilize these custom fonts for rendering musical symbols and text.
        *   **Copilot Prompt Example**: "Develop a font management utility. Allow users to upload `.otf` or `.ttf` font files. Dynamically create `@font-face` rules and inject them into the document's stylesheet. Update OSMD's rendering options to use the newly loaded custom font for musical symbols and text elements."
        *   **New Feature**: Enhances the aesthetic quality and personalization of the musical score, aligning with professional engraving standards.
    *   **Sub-step 1.3**: Develop Smart Page Break and System Break Management.
        *   **Description**: Implement advanced logic for managing page and system breaks to optimize readability and avoid awkward page turns. This could involve a manual override UI for users to insert or remove breaks, or an algorithm that suggests optimal break points based on musical phrasing or measure count. This might require interacting with OSMD's layout engine or post-processing its SVG output.
        *   **Copilot Prompt Example**: "Research OSMD's capabilities for controlling page and system breaks. Implement a UI feature that allows users to manually insert or remove system breaks at specific measure numbers. Explore if OSMD provides APIs to suggest optimal page breaks to avoid cutting off phrases."
        *   **New Feature**: Crucial for creating professional-looking scores that are easy to read and perform from, directly addressing a key engraving best practice.
    *   **Sub-step 1.4**: Implement Dynamic Spacing Adjustments.
        *   **Description**: Provide tools for users to fine-tune horizontal and vertical spacing. This includes adjusting spacing between notes, between staves, and between systems. This might involve modifying OSMD's internal layout parameters or applying precise CSS transformations to SVG elements after OSMD renders them.
        *   **Copilot Prompt Example**: "Develop UI controls (e.g., sliders) for adjusting `noteDistance`, `staffDistance`, and `systemDistance` within OSMD. Implement the logic to apply these changes via `osmdInstance.setOptions` and trigger a re-render. Ensure these adjustments are visually intuitive and responsive."
        *   **New Feature**: Allows for meticulous control over score density and readability, essential for high-quality engraving.
    *   **Sub-step 1.5**: Implement Engraving Pre-sets and Save/Load Custom Settings.
        *   **Description**: Create a set of pre-defined engraving style presets (e.g., 'Concert Score', 'Lead Sheet', 'Educational'). Allow users to save their customized engraving settings as named presets and load them later. This facilitates quick application of preferred styles and sharing among users.
        *   **Copilot Prompt Example**: "Design a system for saving and loading engraving presets. Create a few default presets (e.g., 'Standard', 'Compact', 'Spacious'). Implement UI buttons to 'Save Current Settings as Preset' and 'Load Preset', storing/retrieving the engraving options in `localStorage` or `IndexedDB`."
        *   **New Feature**: Streamlines the process of applying complex engraving rules and promotes consistency across multiple scores.

2.  **Task**: Develop Comprehensive Multiple Instrument Feature.
    *   **Sub-step 2.1**: Implement Full Score to Individual Part Generation.
        *   **Description**: Develop the core logic to generate individual instrument parts from a loaded full score. This involves extracting the MusicXML data relevant to a single instrument and creating a new, separate OSMD instance (or a similar rendering mechanism) for that part. Ensure that the generated part accurately reflects the original score's content for that instrument.
        *   **Copilot Prompt Example**: "Create a function `generateIndividualPart(fullScoreMusicXml, instrumentId)` that takes the full score's MusicXML and an instrument identifier. This function should filter the MusicXML to include only the specified instrument's data and return a new MusicXML string suitable for rendering as a separate part."
        *   **New Feature**: Establishes the fundamental capability to isolate and view individual instrument lines from a complex score.
    *   **Sub-step 2.2**: Implement Linked Note Editing and Propagation.
        *   **Description**: Develop a robust system for editing notes (pitch, duration, dynamics, articulation) within an individual part view. Crucially, these edits must automatically propagate and update the corresponding notes in the master full score MusicXML data and, consequently, in all other linked individual parts. This requires a sophisticated data synchronization mechanism.
        *   **Copilot Prompt Example**: "Design a data model that allows for note-level editing in individual parts. When a note is edited in a part, implement a change propagation mechanism that updates the master MusicXML data. After the master data is updated, trigger a re-render of the full score and all other affected individual parts."
        *   **New Feature**: Enables collaborative editing and ensures data consistency across all views of the score.
    *   **Sub-step 2.3**: Implement Independent Part Layout Customization.
        *   **Description**: Allow users to customize the layout of individual parts (e.g., system breaks, page breaks, measure numbering, spacing) independently of the full score and other parts. These layout changes should *not* affect the musical content or the layout of the full score. This will likely require storing layout preferences per part and applying them during rendering.
        *   **Copilot Prompt Example**: "Extend the part generation and rendering logic to allow for independent layout settings for each individual part. Implement UI controls within the individual part view for adjusting its specific system breaks, page breaks, and measure numbering, ensuring these changes are saved and applied only to that part."
        *   **New Feature**: Provides musicians with the flexibility to create highly optimized and readable parts for performance.
    *   **Sub-step 2.4**: Develop Part Management UI and Navigation.
        *   **Description**: Create a comprehensive UI for managing multiple parts. This includes a clear list of all available instruments/parts, buttons to switch between the full score and individual parts, and options to create new parts or delete existing ones. Implement smooth transitions between views.
        *   **Copilot Prompt Example**: "Design a 'Part Manager' sidebar or modal. List all instruments detected in the score. Provide buttons to 'View Full Score' and 'View Part' for each instrument. Implement the state management and rendering logic to smoothly switch between these views, ensuring the correct OSMD instance is displayed."
        *   **New Feature**: Streamlines the workflow for navigating and managing complex multi-instrument scores.
    *   **Sub-step 2.5**: Implement Part-Specific Annotations and Export.
        *   **Description**: Allow users to add annotations (text, drawings, symbols) that are specific to an individual part and do not appear on the full score unless explicitly shared. Implement functionality to export individual parts, including their unique layout and annotations, as separate PDF or image files.
        *   **Copilot Prompt Example**: "Modify the annotation system to support part-specific annotations. When an annotation is created in an individual part view, associate it only with that part. Implement an 'Export Part' button that generates a PDF or image of the current individual part, including its unique layout and annotations."
        *   **New Feature**: Enhances the utility of individual parts for practice and performance, and facilitates sharing of personalized parts.


