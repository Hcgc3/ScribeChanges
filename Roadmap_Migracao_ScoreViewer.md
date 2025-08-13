# Roadmap Completo de Migração Limpa do ScoreViewer (Bota → music-editor)


## 1. Planeamento Inicial
- Levantar todas as dependências (React, Zustand, OSMD, Tailwind, Lucide, etc) e garantir compatibilidade de versões.
- Listar todos os ficheiros da pasta Bota a migrar: ScoreViewer_Final.jsx, CustomScrollbar.jsx, score-store_Updated.js, useViewportInteractions.js, EditControls.jsx, MusicalControlPoint.jsx, DistanceVisualization.jsx.
- Mapear todos os hooks, stores, componentes e estilos usados.
- Identificar diferenças de estrutura, lógica, estilos e dependências entre os projetos.
- Rever instruções e problemas descritos em "Correções do ScoreViewer - Instruções de Implementação.md".


## 2. Preparação do Ambiente
- Criar uma branch dedicada para migração (ex: `feature/migracao-scoreviewer`).
- Garantir ambiente funcional: Node, pnpm, Vite, React 18+, Zustand, Tailwind, OSMD.
- Fazer backup dos ficheiros atuais (especialmente ScoreViewer.jsx, stores, hooks, CustomScrollbar, estilos).
- Validar que o projeto compila e executa antes da migração.


## 3. Migração dos Componentes
### 3.1 Store
- Substituir `src/lib/stores/score-store.js` pelo `score-store_Updated.js` da Bota.
- Validar todos os novos estados e ações: zoom, pan, contentDimensions, viewportDimensions, clampPan, zoomAtPoint, etc.
- Garantir que todos os componentes usam a store corretamente.

### 3.2 Hooks
- Copiar `useViewportInteractions.js` para `src/hooks/`.
- Atualizar todos os componentes para usar o novo hook.
- Remover hooks antigos (`useZoom.js`, `usePan.js`) se não forem usados noutros locais.

### 3.3 Componentes
- Substituir `ScoreViewer.jsx` pelo `ScoreViewer_Final.jsx` da Bota.
- Copiar `CustomScrollbar.jsx`, `EditControls.jsx`, `MusicalControlPoint.jsx`, `DistanceVisualization.jsx` para `src/components/`.
- Validar e corrigir todos os imports relativos e absolutos.
- Garantir que os componentes auxiliares estão integrados e funcionais.

### 3.4 Estilos
- Copiar/atualizar `score.css` e garantir que está importado no componente principal.
- Adicionar otimizações CSS recomendadas (transform-style, backface-visibility, etc).


## 4. Integração e Adaptação
- Ajustar todos os imports para refletir a estrutura do `music-editor`.
- Adaptar classes CSS e garantir compatibilidade com Tailwind.
- Validar toolbar, metadados, botões e ícones (Lucide).
- Garantir que drag & drop, upload, renderização, zoom, pan e scroll funcionam corretamente.
- Testar integração do OSMD e responsividade dos componentes.


## 5. Testes e Validação
### 5.1 Funcionalidades Básicas
- [ ] Carregamento de ficheiros MusicXML/MXL
- [ ] Visualização correta das partituras
- [ ] Toolbar com controlos de zoom funcionais

### 5.2 Interações de Zoom
- [ ] Zoom in/out com botões da toolbar
- [ ] Zoom com Ctrl+Wheel
- [ ] Zoom com gestures (touch/Safari)
- [ ] Fit to width/height funcionais
- [ ] Reset zoom funcional

### 5.3 Interações de Pan (modo livre)
- [ ] Pan com arrastar do mouse
- [ ] Pan com touch gestures
- [ ] Limites de pan respeitados
- [ ] Cursor muda durante o pan

### 5.4 Modo Lock View
- [ ] Scroll vertical com wheel
- [ ] Barra de scroll personalizada visível
- [ ] Drag da barra de scroll funcional
- [ ] Click na track da scrollbar funcional
- [ ] Conteúdo centrado horizontalmente

### 5.5 Performance
- [ ] Sem re-renderizações desnecessárias da OSMD
- [ ] Transformações CSS fluidas
- [ ] Sem conflitos entre scroll nativo e transformações

### 5.6 Testes Gerais
- Validar responsividade e UX em desktop, mobile e tablet.
- Realizar testes cross-browser (Chrome, Firefox, Safari, Edge).
- Testar acessibilidade (teclado, screen reader, gestures).


## 6. Refino e Documentação
- Remover código legado, duplicado e hooks/componentes antigos.
- Atualizar documentação interna, comentários e exemplos de uso.
- Adicionar instruções de migração e uso no README principal.
- Documentar dependências, configurações CSS e dicas de performance.


## 7. Revisão Final e Deploy
- Revisar todo o código migrado com a equipa.
- Realizar code review detalhado e testes finais.
- Validar logs e erros no browser.
- Fazer merge da branch de migração.
- Realizar deploy e monitorizar possíveis problemas.

---

## Checklist Pós-Migração
- [ ] Todos os componentes funcionam sem erros
- [ ] Performance otimizada (sem lags ou re-renderizações desnecessárias)
- [ ] Scrollbar personalizada visível e funcional
- [ ] Zoom e pan funcionam em todos os modos
- [ ] Toolbar e metadados exibidos corretamente
- [ ] Compatibilidade com OSMD, Zustand, Tailwind
- [ ] Testes em todos os browsers e dispositivos
- [ ] Documentação atualizada

## Resolução de Problemas Comuns
- Barra de scroll não aparece: Verificar se `lockView` está ativo e se o conteúdo é maior que a viewport.
- Zoom não funciona: Verificar importação correta do hook `useViewportInteractions`.
- Pan não respeita limites: Validar função `clampPan` na store.
- Performance lenta: Garantir uso de `willChange: 'transform'` e otimizações CSS.

## Dicas Técnicas
- Use commits pequenos e frequentes.
- Teste cada funcionalidade isoladamente.
- Use ferramentas de lint e formatação.
- Documente todas as alterações relevantes.
- Mantenha backups dos ficheiros originais.

## Referências e Suporte
- [OSMD Documentation](https://opensheetmusicdisplay.github.io/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

**Este roadmap cobre todos os detalhes técnicos, passos, verificações, problemas e dicas para garantir uma migração limpa, robusta e sem surpresas.**

---

**Dicas:**
- Faça commits pequenos e frequentes.
- Use ferramentas de lint e formatação.
- Documente todas as alterações relevantes.
- Mantenha backups dos ficheiros originais.

Se precisar de um checklist ou plano mais detalhado para cada etapa, posso criar também.
