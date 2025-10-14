import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Extension activated: Type Replacer Mode");

  const replaceCommand = vscode.commands.registerCommand("no-more-any.cleanFile", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) 
      return;

    const doc = editor.document;
    const text = doc.getText();

    // Commonly used TypeScript types
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
      "T (generic)",
      "custom interface/type"
    ];

    // Show quick pick for type selection
    const selectedType = await vscode.window.showQuickPick(typeOptions, {
      placeHolder: "Select the TypeScript type to replace ': any' with",
    });

    if (!selectedType) {
      vscode.window.showInformationMessage("No type selected — operation cancelled.");
      return;
    }

    const replaced = text.replace(/:\s*any\b/g, `: ${selectedType}`);

    const fullRange = new vscode.Range(
      doc.positionAt(0),
      doc.positionAt(text.length)
    );

    await editor.edit(editBuilder => editBuilder.replace(fullRange, replaced));

    vscode.window.showInformationMessage(
      `Replaced all ': any' with ': ${selectedType}'!`
    );
  });

  const saveListener = vscode.workspace.onWillSaveTextDocument(async event => {
    const doc = event.document;
    if (doc.languageId !== "typescript" && doc.languageId !== "typescriptreact")
      return;

    const text = doc.getText();
    if (!text.includes(": any")) 
      return;

    // Optional auto-replacement only if user wants
    const choice = await vscode.window.showQuickPick(
      ["Yes", "No"],
      { placeHolder: "Replace ': any' before save?" }
    );

    if (choice !== "Yes") return;

    const typeOptions = [
      "string",
      "number",
      "boolean",
      "unknown",
      "object",
      "null",
      "undefined",
      "void",
      "never",
      "symbol",
      "bigint",
      "Array<any>",
      "Record<string, any>",
      "Promise<any>",
      "Function"
    ];

    const selectedType = await vscode.window.showQuickPick(typeOptions, {
      placeHolder: "Select the replacement type for ': any'",
    });

    if (!selectedType) return;

    const replaced = text.replace(/:\s*any\b/g, `: ${selectedType}`);
    if (replaced === text) return;

    const edit = new vscode.WorkspaceEdit();
    const fullRange = new vscode.Range(
      doc.positionAt(0),
      doc.positionAt(text.length)
    );
    edit.replace(doc.uri, fullRange, replaced);
    vscode.workspace.applyEdit(edit);
  });

  context.subscriptions.push(replaceCommand, saveListener);
}

export function deactivate() {}
