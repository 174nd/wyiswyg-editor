# Tiptap Text Editor Playground

A polished text-editor playground built with **React 19**, **TypeScript**, and **Vite**.  
It showcases Tiptap’s rich-text capabilities, complete with bubble menus, slash commands, image handling, table tools, and a live HTML preview.

## ✨ Features

- **Rich editing experience** powered by Tiptap Starter Kit (headings, lists, code, blockquotes, etc.).
- **Context-aware bubble menus**:
  - Text formatting menu (bold, italic, underline, strike, alignment, color & highlight, sub/superscript, code).
  - List utilities (switch list types, indent/outdent, clear).
  - Heading selector.
  - Image-only controls with a Radix slider to resize images (10–100%) while the main menu hides.
- **Slash commands** (`/`) for quick insertion of headings, lists, quotes, tables, inline code, images (upload or URL), and more.
- **Image handling**:
  - Upload via file dialog, drag & drop, clipboard paste.
  - Insert from URL.
  - Automatic centering and resizable width through the dedicated slider bubble menu.
- **Table helper tools** for inserting tables, adding/removing rows/columns, toggling header rows, and deleting tables.
- **Task list layout** aligned with checkboxes.
- **Live HTML preview** that mirrors editor output (including blank lines).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (or Bun if you prefer)
- npm, pnpm, or bun for dependency management

### Installation

```bash
pnpm install        # or npm install / bun install
```

### Development

```bash
pnpm run dev        # start Vite dev server with HMR
```

The editor lives in `src/App.tsx` and the reusable component resides at `src/components/TextEditor.tsx`.

### Production Build

```bash
pnpm run build      # runs tsc -b && vite build
pnpm run preview    # serve the production build locally
```

## 🧭 Tips & Shortcuts

- Type `/` to open the command palette (supports `/image`, `/image dari url`, `/table`, `/task`, etc.).
- Select text to reveal the formatting bubble; select an image to access the image-resize slider bubble.
- Drag files or paste images straight into the editor.
- Tables can be resized using the new column handles and managed via the table bubble dropdown.

## 🛠️ Tech Stack

- React 19 + TypeScript + Vite
- Tiptap editor extensions
- Radix UI (dropdown menu & slider components)
- Tailwind CSS base (via `@tailwindcss/vite`)

Feel free to tweak the editor configuration in `src/components/TextEditor.tsx` to experiment with additional Tiptap extensions or custom behavior. Have fun exploring! 🎉
