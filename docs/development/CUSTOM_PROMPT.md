# 🤖 Prompt Personalizado para GitHub Copilot

## 📋 **Instruções Personalizadas**

### **Contexto do Projeto**
- Aplicação de partitura musical interativa
- React + Vite + OpenSheetMusicDisplay + Tone.js
- Sistema de widgets magnéticos arrastáveis
- Interface responsiva com Tailwind CSS + Radix UI
- Arquitetura de componentes modulares

### **🎯 Melhores Práticas Obrigatórias**
```
SEMPRE QUE TRABALHARES NESTE PROJETO:

🔍 ANÁLISE:
1. Seja específico e conciso nos prompts
2. Forneça contexto relevante com código circundante
3. Divida tarefas complexas em subtarefas menores
4. Use nomes descritivos para variáveis/funções/componentes

💻 DESENVOLVIMENTO:
5. Indique sempre o tipo de saída esperada
6. Use comentários JSDoc como prompts para guiar código
7. Implemente error boundaries e tratamento de erros
8. Mantenha padrões de acessibilidade (a11y)

🎼 CONTEXTO MUSICAL:
9. Prioriza funcionalidades musicais e performance audio
10. Mantém consistência com widgets magnéticos
11. Considera latência < 50ms para interações audio
12. Testa compatibilidade AudioContext após gestos

📱 UX/UI:
13. Considera responsividade mobile
14. Segue design system estabelecido (Tailwind + Radix)
15. Implementa feedback visual para ações
16. Mantém consistência na navegação magnética
```

### **📝 Padrões de Código Específicos**

#### **Estrutura de Comentários JSDoc:**
```javascript
// Função/Componente para [descrição específica do propósito musical]
// Integra com [sistemas relacionados: OSMD, Tone.js, widgets magnéticos]
// @param {Type} param - Descrição detalhada
// @returns {Type} Descrição do retorno esperado
// @example Exemplo de uso quando relevante
```

#### **Componentes React:**
```jsx
// Componente React para [funcionalidade musical específica]
// Deve ser [widget magnético | modal | overlay | controle] 
// @param {boolean} isActive - Estado de ativação
// @param {function} onStateChange - Callback para mudanças
// @param {Object} musicData - Dados musicais estruturados
const ComponentName = ({ isActive, onStateChange, musicData }) => {
    // Implementação com hooks, refs, e lógica musical
};
```

#### **Tratamento de Audio:**
```javascript
// AudioContext deve ser inicializado apenas após gesto do utilizador
// Implementar lazy loading e error handling para Web Audio API
// Manter latência < 50ms para interações em tempo real
```

### **🧪 Testes e Validação Obrigatórios**

#### **Antes de cada implementação:**
1. ✅ AudioContext funciona após gestos do utilizador
2. ✅ Widgets são draggable e mantêm estado
3. ✅ Partitura carrega e renderiza corretamente
4. ✅ Performance audio < 50ms latency
5. ✅ Componentes são acessíveis (a11y)
6. ✅ Responsividade mobile básica

#### **Validação de Código:**
- Error boundaries implementados
- PropTypes ou TypeScript definidos
- Componentes exportados corretamente
- Imports/exports verificados

### **📊 Metodologia de Trabalho**

#### **Para Tarefas Complexas:**
1. **Análise**: Quebrar em 3-5 subtarefas máximo
2. **Contexto**: Ler ficheiros relacionados antes de começar  
3. **Implementação**: Uma subtarefa de cada vez
4. **Teste**: Validar cada parte antes de continuar
5. **Documentação**: Atualizar docs relevantes

#### **Para Debugging:**
1. **Reprodução**: Entender o problema específico
2. **Isolamento**: Identificar componente/função afetada
3. **Correção**: Implementar fix mínimo necessário
4. **Validação**: Confirmar que fix resolve problema
5. **Prevenção**: Sugerir melhorias para evitar recorrência

### **💬 Formato de Comunicação**

#### **Sempre que vou trabalhar:**
1. 🔍 **Explicar primeiro**: O que vou fazer e porquê
2. 📖 **Contexto**: Que ficheiros vou ler/modificar
3. ⚠️ **Impactos**: Que outros componentes podem ser afetados
4. 🎯 **Resultado esperado**: O que deve funcionar após mudanças

#### **Ao mostrar código:**
- Usar comentários JSDoc detalhados
- Explicar decisões arquiteturais
- Mencionar integrações com OSMD/Tone.js
- Sugerir melhorias futuras quando relevante

#### **Para resolução de problemas:**
- Identificar causa raiz antes de propor soluções
- Explicar multiple abordagens quando aplicável
- Priorizar soluções que não quebrem funcionalidades existentes
- Documentar soluções para referência futura

### **🔗 Integração com Repositório de Prompts**
- Seguir padrões de `copilot_prompts_repo/best_practices/`
- Aplicar estruturas de `prompts_by_category/development.md`
- Usar exemplos de `use_cases/musicxml_import.md` como referência
- Manter consistência com metodologias estabelecidas

---
**Base**: Repositório copilot_prompts_repo + Contexto Sheet Music App  
**Criado**: 3 de agosto de 2025  
**Última atualização**: 3 de agosto de 2025
