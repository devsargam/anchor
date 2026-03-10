# Anchor

Harpoon-like file navigation for VS Code. Anchor the files you keep coming back to and jump between them instantly.

## Why

You're working on a codebase and you keep jumping between the same 3-5 files. Fuzzy finder is slow. Tabs pile up. Anchor lets you bookmark those files into numbered slots and switch between them with a single keystroke.

## Usage

### Anchor a file

Open a file and press `Cmd+Shift+A` (Mac) / `Ctrl+Shift+A` (Windows/Linux). It gets added to the next available slot (1-9).

### Jump to a file

Press `Cmd+1` through `Cmd+9` (Mac) / `Ctrl+1` through `Ctrl+9` (Windows/Linux) to jump directly to the file in that slot.

### View all anchors

Press `Cmd+Shift+E` (Mac) / `Ctrl+Shift+E` (Windows/Linux) to open the anchor list. Select a file to jump to it, or click the trash icon to remove it.

### Remove current file

Press `Cmd+Shift+D` (Mac) / `Ctrl+Shift+D` (Windows/Linux) to remove the current file from anchors.

## Keybindings

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Anchor current file | `Cmd+Shift+A` | `Ctrl+Shift+A` |
| Remove current file | `Cmd+Shift+D` | `Ctrl+Shift+D` |
| Open anchor list | `Cmd+Shift+E` | `Ctrl+Shift+E` |
| Jump to slot 1-9 | `Cmd+1-9` | `Ctrl+1-9` |

## Features

- **Slot-based navigation** -- up to 9 anchored files, each mapped to a number key
- **Status bar indicator** -- shows the current file's slot number when it's anchored
- **Per-workspace** -- anchors are scoped to your workspace and persist across restarts
- **Quick pick list** -- view, jump to, and remove anchors from a single menu

## Notes

- `Cmd+1-9` overrides VS Code's default "switch to Nth tab" behavior. You can rebind these in your keyboard shortcuts settings if needed.
- Anchors are stored in VS Code's workspace state, so they survive restarts but don't sync across machines.
