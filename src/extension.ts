import * as vscode from "vscode";
import * as path from "path";

let statusBarItem: vscode.StatusBarItem;

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

function getPinnedTabs(): vscode.Tab[] {
  const pinned: vscode.Tab[] = [];
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (tab.isPinned) {
        pinned.push(tab);
      }
    }
  }
  return pinned;
}

function getTabFilePath(tab: vscode.Tab): string | undefined {
  const input = tab.input;
  if (input instanceof vscode.TabInputText) {
    return input.uri.fsPath;
  }
  return undefined;
}

function updateStatusBar(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const pinned = getPinnedTabs();
  const index = pinned.findIndex((tab) => getTabFilePath(tab) === filePath);

  if (index >= 0) {
    statusBarItem.text = `$(anchor) ${index + 1}`;
    statusBarItem.tooltip = `Anchored at slot ${index + 1}`;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

async function addFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active file to anchor.");
    return;
  }

  // Check if already pinned
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  if (activeTab?.isPinned) {
    const pinned = getPinnedTabs();
    const slot =
      pinned.findIndex(
        (tab) => getTabFilePath(tab) === editor.document.uri.fsPath,
      ) + 1;
    vscode.window.showInformationMessage(`Already anchored at slot ${slot}.`);
    return;
  }

  await vscode.commands.executeCommand("workbench.action.pinEditor");

  const name = path.basename(editor.document.uri.fsPath);
  const pinned = getPinnedTabs();
  const slot =
    pinned.findIndex(
      (tab) => getTabFilePath(tab) === editor.document.uri.fsPath,
    ) + 1;
  vscode.window.showInformationMessage(`${name} anchored at slot ${slot}.`);
  updateStatusBar();
}

async function removeFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("No active file to remove.");
    return;
  }

  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  if (!activeTab?.isPinned) {
    vscode.window.showInformationMessage("This file is not anchored.");
    return;
  }

  await vscode.commands.executeCommand("workbench.action.unpinEditor");

  const name = path.basename(editor.document.uri.fsPath);
  vscode.window.showInformationMessage(`${name} removed from anchors.`);
  updateStatusBar();
}

async function toggleList(): Promise<void> {
  const pinned = getPinnedTabs();

  if (pinned.length === 0) {
    vscode.window.showInformationMessage(
      "No anchored files. Use Cmd+Shift+A to anchor a file.",
    );
    return;
  }

  const items: vscode.QuickPickItem[] = pinned.map((tab, i) => {
    const filePath = getTabFilePath(tab);
    return {
      label: `${i + 1}  ${tab.label}`,
      description: filePath ? getRelativePath(filePath) : "",
    };
  });

  const pick = vscode.window.createQuickPick();
  pick.items = items;
  pick.placeholder = "Jump to an anchored file (or use button to remove)";

  pick.buttons = [
    {
      iconPath: new vscode.ThemeIcon("trash"),
      tooltip: "Remove selected anchor",
    },
  ];

  pick.onDidAccept(async () => {
    const selected = pick.selectedItems[0];
    if (selected) {
      const idx = items.indexOf(selected);
      if (idx >= 0) {
        const filePath = getTabFilePath(pinned[idx]);
        if (filePath) {
          const doc = await vscode.workspace.openTextDocument(
            vscode.Uri.file(filePath),
          );
          await vscode.window.showTextDocument(doc);
        }
      }
    }
    pick.dispose();
  });

  pick.onDidTriggerButton(async () => {
    const selected = pick.activeItems[0];
    if (selected) {
      const idx = items.indexOf(selected);
      if (idx >= 0) {
        const tab = pinned[idx];
        const filePath = getTabFilePath(tab);

        // Open the file first so we can unpin it
        if (filePath) {
          const doc = await vscode.workspace.openTextDocument(
            vscode.Uri.file(filePath),
          );
          await vscode.window.showTextDocument(doc);
          await vscode.commands.executeCommand(
            "workbench.action.unpinEditor",
          );

          vscode.window.showInformationMessage(
            `Removed ${tab.label} from anchors.`,
          );

          // Refresh the list
          const newPinned = getPinnedTabs();
          const newItems = newPinned.map((t, i) => {
            const fp = getTabFilePath(t);
            return {
              label: `${i + 1}  ${t.label}`,
              description: fp ? getRelativePath(fp) : "",
            };
          });
          pick.items = newItems;
          items.length = 0;
          items.push(...newItems);
          pinned.length = 0;
          pinned.push(...newPinned);

          if (newPinned.length === 0) {
            pick.dispose();
          }
        }
      }
    }
  });

  pick.onDidHide(() => pick.dispose());
  pick.show();
}

export function activate(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.command = "anchor.toggleList";
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => updateStatusBar()),
  );

  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs(() => updateStatusBar()),
  );

  updateStatusBar();

  context.subscriptions.push(
    vscode.commands.registerCommand("anchor.addFile", () => addFile()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("anchor.removeFile", () => removeFile()),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("anchor.toggleList", () => toggleList()),
  );
}

export function deactivate() {}
