# 📚 Documentação - Aplicação de Partitura Musical Interativa

## 📁 Estrutura da Documentação

```
docs/
├── README.md                    # Este ficheiro - índice principal
├── architecture/                # Arquitetura e design do sistema
│   ├── COMPONENT_TREE.md       # Hierarquia de componentes
│   ├── ARCHITECTURE.md         # Visão geral da arquitetura
│   └── DATA_FLOW.md            # Fluxo de dados entre componentes
├── development/                 # Documentação de desenvolvimento
│   ├── FILE_INVENTORY.md       # Inventário completo de ficheiros
│   ├── INTEGRATION_COMPLETE.md # Log de integração de componentes
│   ├── SETUP_GUIDE.md          # Guia de configuração inicial
│   └── DEVELOPMENT_LOG.md      # Log de desenvolvimento
├── troubleshooting/            # Resolução de problemas
│   ├── AUDIOCONTEXT_FIX.md     # Fix para AudioContext warnings
│   ├── COMMON_ISSUES.md        # Problemas comuns e soluções
│   └── ERROR_CODES.md          # Códigos de erro e significados
```

## 🤖 **Working with GitHub Copilot**

📋 **Prompt Personalizado**: Para instruções específicas sobre como trabalhar neste projeto, consulta [`CUSTOM_PROMPT.md`](development/CUSTOM_PROMPT.md)
├── api/                        # Documentação da API
│   ├── COMPONENTS_API.md       # API dos componentes
│   └── HOOKS_API.md            # Documentação dos hooks
└── user/                       # Documentação do utilizador
    ├── USER_GUIDE.md           # Guia do utilizador
    └── FEATURES.md             # Lista de funcionalidades
```

## 🎯 **Navegação Rápida**

### **Para Desenvolvedores:**
- [📋 Inventário de Ficheiros](development/FILE_INVENTORY.md) - Lista completa de todos os componentes
- [🌳 Árvore de Componentes](architecture/COMPONENT_TREE.md) - Estrutura hierárquica
- [✅ Log de Integração](development/INTEGRATION_COMPLETE.md) - Histórico de integrações

### **Para Resolução de Problemas:**
- [🔧 Fix AudioContext](troubleshooting/AUDIOCONTEXT_FIX.md) - Solução para warnings de áudio
- [⚠️ Problemas Comuns](troubleshooting/COMMON_ISSUES.md) - FAQ de problemas
- [🚨 Códigos de Erro](troubleshooting/ERROR_CODES.md) - Referência de erros

### **Para Arquitetura:**
- [🏗️ Visão Geral](architecture/ARCHITECTURE.md) - Arquitetura do sistema
- [🔄 Fluxo de Dados](architecture/DATA_FLOW.md) - Como os dados fluem

## 📊 **Estado Atual do Projeto**

- **Componentes Integrados**: 9/9 (100%)
- **Funcionalidades Core**: ✅ Completas
- **Audio Engine**: ✅ Tone.js integrado
- **UI Components**: ✅ Magnetic widgets ativos
- **Documentação**: ✅ Organizada

## 🔄 **Última Atualização**

**Data**: 3 de agosto de 2025  
**Versão**: 1.0.0  
**Status**: Produção ativa  

---

## 📖 **Como Usar Esta Documentação**

### **1. Para Development Rápido:**
```bash
# Consultar componentes disponíveis
cat docs/development/FILE_INVENTORY.md

# Ver estrutura da aplicação
cat docs/architecture/COMPONENT_TREE.md

# Verificar problemas conhecidos
cat docs/troubleshooting/COMMON_ISSUES.md
```

### **2. Para Debug:**
```bash
# Problemas de áudio
cat docs/troubleshooting/AUDIOCONTEXT_FIX.md

# Códigos de erro
cat docs/troubleshooting/ERROR_CODES.md
```

### **3. Para Onboarding:**
```bash
# Guia de setup
cat docs/development/SETUP_GUIDE.md

# Funcionalidades disponíveis
cat docs/user/FEATURES.md
```

---

**💡 Tip**: Use `grep -r "palavra-chave" docs/` para pesquisar rapidamente na documentação!
