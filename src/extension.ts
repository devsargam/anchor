import * as vscode from "vscode";
import * as path from "path";

const STORAGE_KEY = "anchor.files";

let statusBarItem: vscode.StatusBarItem;
let anchors: string[] = [];

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function getRelativePath(filePath: string): string {
  const root = getWorkspaceRoot();
  if (root && filePath.startsWith(root)) {
    return path.relative(root, filePath);
  }
  return filePath;
}

function loadAnchors(context: vscode.ExtensionContext): void {
  anchors = context.workspaceState.get<string[]>(STORAGE_KEY, []);
}

function saveAnchors(context: vscode.ExtensionContext): void {
  context.workspaceState.update(STORAGE_KEY, anchors);
  updateStatusBar();
}

function updateStatusBar(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const index = anchors.indexOf(filePath);

  if (index >= 0) {
    statusBarItem.text = `$(anchor) ${index + 1}`;
    statusBarItem.tooltip = `Anchored at slot ${index + 1}`;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

function addFile(context: vscode.ExtensionContext): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active file to anchor.");
    return;
  }

  const filePath = editor.document.uri.fsPath;

  if (anchors.includes(filePath)) {
    const slot = anchors.indexOf(filePath) + 1;
    vscode.window.showInformationMessage(`Already anchored at slot ${slot}.`);
    return;
  }

  if (anchors.length >= 9) {
    vscode.window.showWarningMessage(
      "Maximum 9 anchors reached. Remove one first.",
    );
    return;
  }

  anchors.push(filePath);
  saveAnchors(context);

  const slot = anchors.length;
  const name = path.basename(filePath);
  vscode.window.showInformationMessage(`${name} anchored at slot ${slot}.`);
}

function removeFile(context: vscode.ExtensionContext): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active file to remove.");
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const index = anchors.indexOf(filePath);

  if (index < 0) {
    vscode.window.showInformationMessage("This file is not anchored.");
    return;
  }

  anchors.splice(index, 1);
  saveAnchors(context);

  const name = path.basename(filePath);
  vscode.window.showInformationMessage(`${name} removed from anchors.`);
}

async function goToFile(index: number): Promise<void> {
  if (index >= anchors.length) {
    return;
  }

  const filePath = anchors[index];
  try {
    const doc = await vscode.workspace.openTextDocument(
      vscode.Uri.file(filePath),
    );
    await vscode.window.showTextDocument(doc);
  } catch {
    vscode.window.showWarningMessage(
      `Anchored file not found: ${getRelativePath(filePath)}`,
    );
  }
}

async function toggleList(context: vscode.ExtensionContext): Promise<void> {
  if (anchors.length === 0) {
    vscode.window.showInformationMessage(
      "No anchored files. Use Ctrl+Shift+A to anchor a file.",
    );
    return;
  }

  const items: vscode.QuickPickItem[] = anchors.map((filePath, i) => ({
    label: `${i + 1}  ${path.basename(filePath)}`,
    description: getRelativePath(filePath),
  }));

  const pick = vscode.window.createQuickPick();
  pick.items = items;
  pick.placeholder = "Jump to an anchored file (or use button to remove)";

  pick.buttons = [
    {
      iconPath: new vscode.ThemeIcon("trash"),
      tooltip: "Remove selected anchor",
    },
  ];

  pick.onDidAccept(() => {
    const selected = pick.selectedItems[0];
    if (selected) {
      const idx = items.indexOf(selected);
      if (idx >= 0) {
        goToFile(idx);
      }
    }
    pick.dispose();
  });

  pick.onDidTriggerButton(() => {
    const selected = pick.activeItems[0];
    if (selected) {
      const idx = items.indexOf(selected);
      if (idx >= 0) {
        const removed = anchors.splice(idx, 1)[0];
        saveAnchors(context);
        vscode.window.showInformationMessage(
          `Removed ${path.basename(removed)} from anchors.`,
        );

        const newItems = anchors.map((filePath, i) => ({
          label: `${i + 1}  ${path.basename(filePath)}`,
          description: getRelativePath(filePath),
        }));
        pick.items = newItems;
        items.length = 0;
        items.push(...newItems);

        if (anchors.length === 0) {
          pick.dispose();
        }
      }
    }
  });

  pick.onDidHide(() => pick.dispose());
  pick.show();
}

export function activate(context: vscode.ExtensionContext) {
  loadAnchors(context);

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.command = "anchor.toggleList";
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => updateStatusBar()),
  );
  updateStatusBar();

  context.subscriptions.push(
    vscode.commands.registerCommand("anchor.addFile", () => addFile(context)),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("anchor.removeFile", () =>
      removeFile(context),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("anchor.toggleList", () =>
      toggleList(context),
    ),
  );

  for (let i = 1; i <= 9; i++) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`anchor.goToFile${i}`, () =>
        goToFile(i - 1),
      ),
    );
  }
}

export function deactivate() {}
