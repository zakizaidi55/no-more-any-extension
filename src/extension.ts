import * as vscode from "vscode";

// running at localhost:11434
async function getOllamaTypeSuggestion(prompt: string): Promise<string> {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3", // change the model according to req
        prompt,
      }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    console.log("decoder ", decoder);
    let fullText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) 
          break;
        fullText += decoder.decode(value, { stream: true });
      }
    }
    console.log("full text ", fullText);
    const match = fullText.match(/"response":"([^"]+)"/g);
    if (!match) return "any";
    const combined = match.map(m => m.replace(/"response":"|"/g, "")).join("");
    return combined.trim().split(/\s+/)[0] || "any";
  } catch (err) {
    console.error("Ollama error:", err);
    return "any";
  }
}

export function activate(context: vscode.ExtensionContext) {
  const typeOptions = [
    "string",
    "number",
    "boolean",
    "unknown",
    "any",
    "object",
    "null",
    "undefined",
    "void",
    "never",
    "symbol",
    "bigint",
    "Date",
    "Array<any>",
    "Record<string, any>",
    "Promise<any>",
    "Function",
    "T",
    "custom interface/type"
  ];

  // Provide AI + manual suggestions when typing ":"
  const colonProvider = vscode.languages.registerCompletionItemProvider(
    ["typescript", "typescriptreact"],
    {
      async provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text;
        if (!/:\s*$/.test(lineText.substring(0, position.character))) 
          return;

        const variableMatch = lineText.match(/(?:let|const|var)\s+([\w$]+)/);
        const variableName = variableMatch ? variableMatch[1] : "value";

        const contextText = document.getText(
          new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            position
          )
        );

        const prompt = `
        You are an expert TypeScript developer.
        Given the variable declaration below, infer the most appropriate TypeScript type after the colon.

        Variable:
        ${lineText}

        Code context:
        ${contextText}

        Respond with ONLY the type name (like string, number, boolean, Array<T>, etc.).
        `;

        const aiType = await getOllamaTypeSuggestion(prompt);

        const aiItem = new vscode.CompletionItem(
          `AI Suggestion → ${aiType}`,
          vscode.CompletionItemKind.TypeParameter
        );
        aiItem.insertText = aiType;
        aiItem.sortText = "0000";
        aiItem.documentation = new vscode.MarkdownString(
          `AI inferred this type from variable name "${variableName}".`
        );

        const manualItems = typeOptions.map(type => {
          const item = new vscode.CompletionItem(
            type,
            vscode.CompletionItemKind.TypeParameter
          );
          item.insertText = type;
          item.sortText = "9999";
          return item;
        });

        return new vscode.CompletionList([aiItem, ...manualItems], true);
      },
    },
    ":" // trigger
  );

  // "<" after hooks like useState, useRef, etc.
  const genericProvider = vscode.languages.registerCompletionItemProvider(
    ["typescript", "typescriptreact"],
    {
      async provideCompletionItems(document, position) {
        const lineText = document.lineAt(position).text.substring(0, position.character);
        if (!/\b(useState|useRef|useMemo|useCallback|useReducer|useDeferredValue|useTransition)\s*<\s*$/.test(lineText)) {
          return;
        }

        const contextText = document.getText(
          new vscode.Range(new vscode.Position(Math.max(0, position.line - 5), 0), position)
        );

        const prompt = `
        You're an expert React + TypeScript developer.
        Given this code, suggest the most likely generic type to place inside the angle brackets.

        Code:
        ${contextText}

        Respond with only the type name (e.g. string, number, boolean, Array<T>, etc.)
        `;

        const aiType = await getOllamaTypeSuggestion(prompt);

        const aiItem = new vscode.CompletionItem(
          `AI Suggestion → ${aiType}`,
          vscode.CompletionItemKind.TypeParameter
        );
        aiItem.insertText = aiType;
        aiItem.documentation = new vscode.MarkdownString(
          `AI inferred this generic type from surrounding code.`
        );

        const manualItems = typeOptions.map(type => {
          const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.TypeParameter);
          item.insertText = type;
          return item;
        });

        return new vscode.CompletionList([aiItem, ...manualItems], true);
      },
    },
    "<" // trigger
  );

  context.subscriptions.push(colonProvider, genericProvider);
}

export function deactivate() {}
