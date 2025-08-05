# Melhores Práticas para Escrever Prompts para o GitHub Copilot

Para aproveitar ao máximo o GitHub Copilot, considere as seguintes diretrizes ao formular seus prompts:

1.  **Seja Específico e Conciso**: Evite prompts vagos. Quanto mais detalhes você fornecer sobre o que deseja, melhor será a sugestão. Use comentários no código para fornecer contexto adicional.
2.  **Forneça Contexto Relevante**: O Copilot usa o código circundante como contexto. Certifique-se de que o código antes do seu prompt seja relevante para a tarefa. Para funções ou classes complexas, adicione comentários que descrevam seu propósito e parâmetros.
3.  **Divida Tarefas Complexas**: Para projetos grandes, divida problemas complexos em subtarefas menores. O Copilot funciona melhor com problemas bem definidos e localizados. Em vez de pedir para 'refatorar todo o módulo', peça para 'refatorar a função `calculateMetrics` para melhorar a performance'.
4.  **Use Nomes Descritivos**: Nomes de variáveis, funções e classes descritivos ajudam o Copilot a inferir a intenção do seu código.
5.  **Indique o Tipo de Saída Esperada**: Se você espera um trecho de código, uma função, uma classe ou um teste, indique isso no prompt.
6.  **Itere e Refine**: Se a primeira sugestão não for satisfatória, refine seu prompt ou adicione mais contexto. Experimente diferentes formulações.
7.  **Comentários como Prompts**: O Copilot é excelente em completar comentários. Use-os para guiar a geração de código, como `// Função para validar email` ou `// TODO: Adicionar tratamento de erro para API call`.
8.  **Exemplos e Padrões**: Se houver um padrão específico que você deseja seguir, forneça um exemplo no código ou no prompt.


