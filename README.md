# Tiptap Text Editor Playground

<div align="center">
  <a href="#id">Bahasa Indonesia</a> · <a href="#en">English</a>
</div>

---

## 🇮🇩 Bahasa Indonesia <a id="id"></a>

Sebuah playground editor teks modern berbasis **React 19**, **TypeScript**, dan **Vite**. Proyek ini mendemonstrasikan fitur kaya dari Tiptap: bubble menu kontekstual, slash command, pengaturan tabel, unggah gambar (file atau URL), hingga preview HTML langsung.

### ✨ Fitur Utama

- **Pengalaman menulis lengkap** berkat Tiptap Starter Kit: heading, list, blok kode, blockquote, dsb.
- **Bubble menu cerdas**:
  - Menu formatting teks (bold, italic, underline, strike, alignment, warna, highlight, sub/superscript, kode).
  - Utilitas list (ganti tipe list, indent/outdent, clear).
  - Selector heading.
  - Kontrol khusus gambar dengan slider Radix untuk mengatur lebar gambar (10–100%).
- **Slash command** (`/`) untuk menambahkan heading, daftar, quote, tabel, kode, gambar (unggah & URL), dan lainnya.
- **Manajemen gambar**:
  - Unggah via file dialog, drag & drop, atau paste dari clipboard.
  - Sisipkan gambar melalui URL.
  - Otomatis berada di tengah dan dapat di-resize via slider.
- **Pengaturan tabel** untuk menambah/menghapus baris kolom, toggle header, hingga hapus tabel.
- **Task list** dengan checkbox terselaraskan.
- **Preview HTML langsung** yang menampilkan hasil editor (termasuk baris kosong).

### 🚀 Memulai

#### Prasyarat
- [Node.js](https://nodejs.org/) 18+ (atau Bun).
- npm, pnpm, atau bun untuk manajemen paket.

#### Instalasi
```bash
pnpm install        # bisa juga npm install / bun install
```

#### Pengembangan
```bash
pnpm run dev        # menjalankan Vite + HMR
```
Komponen editor utama: `src/App.tsx`, komponen reusable: `src/components/TextEditor.tsx`.

#### Build Produksi
```bash
pnpm run build      # menjalankan tsc -b && vite build
pnpm run preview    # pratinjau hasil build lokal
```

### 🧭 Tips & Pintasan
- Ketik `/` untuk membuka palette (mis. `/image`, `/image dari url`, `/table`, `/task`).
- Seleksi teks untuk memunculkan bubble menu; seleksi gambar untuk mengakses slider lebar.
- Drag/drop atau paste gambar langsung ke editor.
- Tabel dapat di-resize lewat handle kolom dan menu tabel.

### 🛠️ Teknologi
- React 19 + TypeScript + Vite
- Ekstensi Tiptap (Starter Kit, Bubble Menu, Table, Image, dll.)
- Radix UI (Dropdown Menu & Slider)
- Tailwind CSS (via `@tailwindcss/vite`)

Silakan eksplor konfigurasi di `src/components/TextEditor.tsx` untuk menambahkan fitur baru. Selamat mencoba! 🎉

---

## 🇬🇧 English <a id="en"></a>

A modern text-editor playground built with **React 19**, **TypeScript**, and **Vite**. It demonstrates Tiptap’s advanced features: contextual bubble menus, slash commands, table helpers, image uploads (from files or URLs), and a live HTML preview.

### ✨ Highlights

- **Rich typing experience** courtesy of Tiptap Starter Kit (headings, lists, code blocks, blockquotes, etc.).
- **Context-aware bubble menus**:
  - Text formatting controls (bold, italic, underline, strike, alignment, color, highlight, sub/superscript, code).
  - List utilities (switch list types, indent/outdent, clear).
  - Heading selector.
  - Image-only menu with a Radix slider to adjust width (10–100%).
- **Slash commands** (`/`) to insert headings, lists, quotes, tables, code, images (upload & URL), and more.
- **Image handling**:
  - Upload via file dialog, drag & drop, clipboard paste.
  - Insert from URL.
  - Centered images with adjustable width through the dedicated slider menu.
- **Table helper tools** for adding/removing rows or columns, toggling header rows, deleting tables.
- **Task list alignment** with checkboxes.
- **Live HTML preview** faithfully mirroring editor output (blank lines included).

### 🚀 Getting Started

#### Prerequisites
- [Node.js](https://nodejs.org/) 18+ (or Bun).
- npm, pnpm, or bun as your package manager.

#### Installation
```bash
pnpm install        # or npm install / bun install
```

#### Development
```bash
pnpm run dev        # starts Vite with HMR
```
Main editor component: `src/App.tsx`, reusable editor component: `src/components/TextEditor.tsx`.

#### Production Build
```bash
pnpm run build      # runs tsc -b && vite build
pnpm run preview    # serve the production build locally
```

### 🧭 Tips & Shortcuts
- Type `/` for the command palette (supports `/image`, `/image dari url`, `/table`, `/task`, etc.).
- Select text to show the formatting bubble; select an image to reveal the resize slider bubble.
- Drag & drop or paste images directly into the editor.
- Resize tables using the column handles and the table dropdown tools.

### 🛠️ Tech Stack
- React 19 + TypeScript + Vite
- Tiptap editor extensions
- Radix UI components (Dropdown Menu & Slider)
- Tailwind CSS base (`@tailwindcss/vite`)

Feel free to tweak `src/components/TextEditor.tsx` to explore additional Tiptap extensions or custom behavior. Happy building! 🎉
