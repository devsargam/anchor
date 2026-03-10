# Anchor

Harpoon-like file navigation for VS Code. Anchor the files you keep coming back to and jump between them instantly.

## Why

You're working on a codebase and you keep jumping between the same 3-5 files. Fuzzy finder is slow. Tabs pile up. Anchor lets you pin those files and they stay at the start of your tab bar — then `Cmd+1`, `Cmd+2`, etc. jumps straight to them.

## Usage

### Anchor a file

Open a file and press `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Windows/Linux). The tab gets pinned and moves to the front of the tab bar.

### Jump to a file

Use VS Code's built-in `Cmd+1` through `Cmd+9` (Mac) / `Ctrl+1` through `Ctrl+9` (Windows/Linux). Since anchored files are always pinned at the start, slot numbers stay consistent.

### View all anchors

Press `Cmd+Shift+E` (Mac) / `Ctrl+Shift+E` (Windows/Linux) to open the anchor list. Select a file to jump to it, or click the trash icon to remove it.

### Remove current file

Press `Cmd+Shift+D` (Mac) / `Ctrl+Shift+D` (Windows/Linux) to unpin the current file.

## Keybindings

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Anchor current file | `Cmd+Shift+A` | `Ctrl+Shift+A` |
| Remove current file | `Cmd+Shift+D` | `Ctrl+Shift+D` |
| Open anchor list | `Cmd+Shift+E` | `Ctrl+Shift+E` |
| Jump to slot 1-9 | `Cmd+1-9` (built-in) | `Ctrl+1-9` (built-in) |

## Features

- **Built on VS Code's pin system** -- anchored files are pinned tabs, so they stay at the front of your tab bar
- **Zero keybinding conflicts** -- navigation uses VS Code's default tab switching, no overrides needed
- **Status bar indicator** -- shows the current file's slot number when it's anchored
- **Quick pick list** -- view, jump to, and remove anchors from a single menu
- **Persists across restarts** -- pinned tabs survive VS Code restarts automatically
