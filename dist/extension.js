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
function activate(context) {
  vscode.window.showInformationMessage("Extension activated: Type Replacer Mode");
  const replaceCommand = vscode.commands.registerCommand("no-more-any.cleanFile", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    const text = doc.getText();
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
    const selectedType = await vscode.window.showQuickPick(typeOptions, {
      placeHolder: "Select the TypeScript type to replace ': any' with"
    });
    if (!selectedType) {
      vscode.window.showInformationMessage("No type selected \u2014 operation cancelled.");
      return;
    }
    const replaced = text.replace(/:\s*any\b/g, `: ${selectedType}`);
    const fullRange = new vscode.Range(
      doc.positionAt(0),
      doc.positionAt(text.length)
    );
    await editor.edit((editBuilder) => editBuilder.replace(fullRange, replaced));
    vscode.window.showInformationMessage(
      `Replaced all ': any' with ': ${selectedType}'!`
    );
  });
  const saveListener = vscode.workspace.onWillSaveTextDocument(async (event) => {
    const doc = event.document;
    if (doc.languageId !== "typescript" && doc.languageId !== "typescriptreact")
      return;
    const text = doc.getText();
    if (!text.includes(": any")) return;
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
      placeHolder: "Select the replacement type for ': any'"
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
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
