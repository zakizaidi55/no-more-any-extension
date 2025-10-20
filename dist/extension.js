"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));

// src/prompt.ts
var promptManage = (lineText, contextText, contextTextNeeded) => {
  let prompt = `
    You are an expert TypeScript developer.
    Based on the variable name and surrounding code context, infer the most accurate TypeScript type.

    Guidelines:
    - Use variable naming conventions to infer the type.
    - Use context if available to confirm or refine the guess.
    - Prefer primitive types (string, number, boolean) when likely.
    - For plural variable names (ending with 's', 'List', or 'Array'), infer Array<T>.
    - For names containing words like 'count', 'age', 'id', or 'length', infer number.
    - For names containing 'is', 'has', 'should', or 'can', infer boolean.
    - For names like 'phoneNo', 'email', or 'address', infer string.
    - If unclear, default to unknown.
    - Respond with ONLY the TypeScript type name (no explanation, no punctuation).

    Variable:
    ${lineText}`;
  if (contextTextNeeded) {
    prompt += `Code context:${contextText}`;
  }
  console.log("Prompt ", prompt);
  return prompt;
};

// src/extension.ts
async function getOllamaTypeSuggestion(prompt) {
  try {
    const res = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3",
        // change the model according to req
        prompt
      })
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
    const combined = match.map((m) => m.replace(/"response":"|"/g, "")).join("");
    return combined.trim().split(/\s+/)[0] || "any";
  } catch (err) {
    console.error("Ollama error:", err);
    return "any";
  }
}
function activate(context) {
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
        const prompt = promptManage(lineText, contextText, true);
        const aiType = await getOllamaTypeSuggestion(prompt);
        const aiItem = new vscode.CompletionItem(
          `AI Suggestion \u2192 ${aiType}`,
          vscode.CompletionItemKind.TypeParameter
        );
        aiItem.insertText = aiType;
        aiItem.sortText = "0000";
        aiItem.documentation = new vscode.MarkdownString(
          `AI inferred this type from variable name "${variableName}".`
        );
        const manualItems = typeOptions.map((type) => {
          const item = new vscode.CompletionItem(
            type,
            vscode.CompletionItemKind.TypeParameter
          );
          item.insertText = type;
          item.sortText = "9999";
          return item;
        });
        return new vscode.CompletionList([aiItem, ...manualItems], true);
      }
    },
    ":"
    // trigger
  );
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
        const prompt = promptManage(lineText, contextText, false);
        const aiType = await getOllamaTypeSuggestion(prompt);
        const aiItem = new vscode.CompletionItem(
          `AI Suggestion \u2192 ${aiType}`,
          vscode.CompletionItemKind.TypeParameter
        );
        aiItem.insertText = aiType;
        aiItem.documentation = new vscode.MarkdownString(
          `AI inferred this generic type from surrounding code.`
        );
        const manualItems = typeOptions.map((type) => {
          const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.TypeParameter);
          item.insertText = type;
          return item;
        });
        return new vscode.CompletionList([aiItem, ...manualItems], true);
      }
    },
    "<"
    // trigger
  );
  context.subscriptions.push(colonProvider, genericProvider);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
