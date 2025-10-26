import {
  forwardRef,
  type CSSProperties,
  type MouseEvent,
  type ChangeEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
} from "react";
import { BubbleMenu, EditorContent, ReactRenderer, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import type { Editor as TiptapEditor, Range } from "@tiptap/core";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import DragHandle from "@tiptap/extension-drag-handle-react";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Image from "@tiptap/extension-image";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { NodeSelection, Plugin, TextSelection } from "@tiptap/pm/state";
import type { IconType } from "react-icons";
import {
  MdChecklist,
  MdCode,
  MdCloudUpload,
  MdDragIndicator,
  MdFormatBold,
  MdFormatClear,
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatItalic,
  MdFormatIndentDecrease,
  MdFormatIndentIncrease,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdHorizontalRule,
  MdLink,
  MdImage,
  MdLooks3,
  MdLooksOne,
  MdLooksTwo,
  MdOutlineImage,
  MdOutlineSegment,
  MdPalette,
  MdSubscript,
  MdSuperscript,
  MdTitle,
  MdTableChart,
  MdBorderTop,
  MdBorderBottom,
  MdBorderLeft,
  MdBorderRight,
  MdDeleteForever,
} from "react-icons/md";
import { BiCodeBlock } from "react-icons/bi";
import "../styles/tiptap.scss";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import * as Slider from "@radix-ui/react-slider";

type SlashCommandAction = (props: { editor: TiptapEditor; range: Range }) => void;

type SlashCommandItem = {
  title: string;
  description: string;
  icon: IconType;
  action: SlashCommandAction;
};

type SlashCommandListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type SlashCommandListProps = SuggestionProps & {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
};

const promptLink = (editor: TiptapEditor, range?: Range) => {
  if (!editor) {
    return;
  }

  if (range) {
    editor.chain().focus().deleteRange(range).run();
  }

  const previousUrl = editor.getAttributes("link")?.href ?? "https://";
  const inputUrl = window.prompt("Masukkan URL", previousUrl);
  if (inputUrl === null) {
    return;
  }

  const trimmed = inputUrl.trim();
  if (trimmed === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  const href = /^(?:https?|mailto|tel):/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  if (editor.state.selection.empty) {
    const textPrompt = window.prompt("Masukkan teks yang ingin diberi tautan", href);
    if (textPrompt === null) {
      return;
    }

    const label = textPrompt.trim();
    if (label === "") {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: label,
        marks: [
          {
            type: "link",
            attrs: { href, target: "_blank", rel: "noopener noreferrer" },
          },
        ],
      })
      .run();
    return;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href, target: "_blank", rel: "noopener noreferrer" }).run();
};

const normalizeImageUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^(?:https?|data|blob|ftp):/i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const promptImageUrlAndInsert = (editor: TiptapEditor) => {
  const urlInput = window.prompt("Masukkan URL gambar");
  if (urlInput === null) {
    return;
  }

  const normalizedUrl = normalizeImageUrl(urlInput);
  if (!normalizedUrl) {
    window.alert("URL gambar tidak valid.");
    return;
  }

  const altInput = window.prompt("Masukkan teks alt (opsional)", "");
  const alt = altInput ? altInput.trim() || undefined : undefined;

  editor
    .chain()
    .focus()
    .setImage({ src: normalizedUrl, alt })
    .updateAttributes("image", { width: 100 })
    .run();
};

const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(({ items, command }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) {
        return;
      }
      command(item);
    },
    [items, command]
  );

  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = [];
  }, [items]);

  useEffect(() => {
    const selected = itemRefs.current[selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) {
        return false;
      }

      if (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey)) {
        event.preventDefault();
        setSelectedIndex((index) => (index + 1) % items.length);
        return true;
      }

      if (event.key === "ArrowUp" || (event.key === "Tab" && event.shiftKey)) {
        event.preventDefault();
        setSelectedIndex((index) => (index + items.length - 1) % items.length);
        return true;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="slash-command">
        <div className="slash-command__empty">Tidak ada hasil</div>
      </div>
    );
  }

  return (
    <div className="slash-command" ref={containerRef}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === selectedIndex;
        return (
          <button
            type="button"
            key={item.title}
            className={`slash-command__item${isActive ? " is-active" : ""}`}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              selectItem(index);
            }}
          >
            <span className="slash-command__item-icon">
              <Icon size={18} />
            </span>
            <span className="slash-command__item-meta">
              <span className="slash-command__item-title">{item.title}</span>
              <span className="slash-command__item-description">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

SlashCommandList.displayName = "SlashCommandList";

const createSlashCommandItems = (): SlashCommandItem[] => [
  {
    title: "Paragraph",
    description: "Gunakan teks paragraf biasa",
    icon: MdOutlineSegment,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).clearNodes().setParagraph().run();
    },
  },
  {
    title: "Heading 1",
    description: "Judul besar",
    icon: MdLooksOne,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Subjudul",
    icon: MdLooksTwo,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Judul bagian",
    icon: MdLooks3,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet list",
    description: "Daftar tak berurut",
    icon: MdFormatListBulleted,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Ordered list",
    description: "Daftar bernomor",
    icon: MdFormatListNumbered,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Todo list",
    description: "Daftar tugas dengan checkbox",
    icon: MdChecklist,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Table",
    description: "Sisipkan tabel 3x4 dengan header",
    icon: MdTableChart,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      insertDefaultTable(editor);
    },
  },
  {
    title: "Align left",
    description: "Ratakan teks ke kiri",
    icon: MdFormatAlignLeft,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign("left").run();
    },
  },
  {
    title: "Align center",
    description: "Ratakan teks ke tengah",
    icon: MdFormatAlignCenter,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign("center").run();
    },
  },
  {
    title: "Align right",
    description: "Ratakan teks ke kanan",
    icon: MdFormatAlignRight,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign("right").run();
    },
  },
  {
    title: "Justify",
    description: "Ratakan teks ke kedua sisi",
    icon: MdFormatAlignJustify,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setTextAlign("justify").run();
    },
  },
  {
    title: "Quote",
    description: "Soroti teks sebagai kutipan",
    icon: MdFormatQuote,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Tambahkan garis pemisah",
    icon: MdHorizontalRule,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Image",
    description: "Unggah atau tempel gambar",
    icon: MdImage,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      editor.commands.command(({ tr }) => {
        const event = new CustomEvent("tiptap-trigger-image-upload", {
          detail: { position: tr.selection.from },
        });
        document.dispatchEvent(event);
        return true;
      });
    },
  },
  {
    title: "Image dari URL",
    description: "Sisipkan gambar menggunakan URL",
    icon: MdOutlineImage,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      promptImageUrlAndInsert(editor);
    },
  },
  {
    title: "Code block",
    description: "Format kode multi-baris",
    icon: BiCodeBlock,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Inline code",
    description: "Sorot potongan kode",
    icon: MdCode,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCode().run();
    },
  },
  {
    title: "Bold",
    description: "Tebalkan teks",
    icon: MdFormatBold,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBold().run();
    },
  },
  {
    title: "Italic",
    description: "Miringkan teks",
    icon: MdFormatItalic,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleItalic().run();
    },
  },
  {
    title: "Underline",
    description: "Garis-bawahi teks",
    icon: MdFormatUnderlined,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleUnderline().run();
    },
  },
  {
    title: "Strikethrough",
    description: "Coret teks",
    icon: MdFormatStrikethrough,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleStrike().run();
    },
  },
  {
    title: "Subscript",
    description: "Turunkan teks",
    icon: MdSubscript,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleSubscript().run();
    },
  },
  {
    title: "Superscript",
    description: "Naikkan teks",
    icon: MdSuperscript,
    action: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleSuperscript().run();
    },
  },
  {
    title: "Link",
    description: "Sisipkan tautan",
    icon: MdLink,
    action: ({ editor, range }) => {
      promptLink(editor, range);
    },
  },
];

const SlashCommandExtension = Extension.create({
  name: "slash-command",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: TiptapEditor; range: Range; props: SlashCommandItem }) => {
          const item = props;
          if (!item) {
            return;
          }

          item.action({ editor, range });

          window.setTimeout(() => {
            editor.chain().focus(range.to).run();
          }, 0);
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })];
  },
});

const createSlashCommandExtension = () =>
  SlashCommandExtension.configure({
    suggestion: {
      char: "/",
      allowSpaces: false,
      startOfLine: false,
      items: ({ query, editor: _editor }: { query: string; editor: TiptapEditor }) => {
        const normalized = query.toLowerCase().trim();
        const items = createSlashCommandItems();
        if (!normalized.length) {
          return items.slice(0, 10);
        }

        return items
          .filter((item) => item.title.toLowerCase().includes(normalized) || item.description.toLowerCase().includes(normalized))
          .slice(0, 10);
      },
      render: () => {
        let component: ReactRenderer<SlashCommandListRef, SlashCommandListProps> | null = null;
        let popup: TippyInstance | null = null;

        return {
          onStart: (props: SuggestionProps) => {
            component = new ReactRenderer<SlashCommandListRef, SlashCommandListProps>(SlashCommandList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            const instances = tippy(document.body, {
              getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              offset: [0, 8],
            });
            popup = (Array.isArray(instances) ? instances[0] : instances) ?? null;
          },
          onUpdate(props: SuggestionProps) {
            component?.updateProps(props);

            if (!props.clientRect) {
              return;
            }

            popup?.setProps({
              getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
            });
          },
          onKeyDown(props: SuggestionKeyDownProps) {
            if (props.event.key === "Escape") {
              popup?.hide();
              return true;
            }

            return component?.ref?.onKeyDown({ event: props.event }) ?? false;
          },
          onExit() {
            popup?.destroy();
            popup = null;
            component?.destroy();
            component = null;
          },
        };
      },
    },
  });

const slashCommandExtension = createSlashCommandExtension();

const performIndent = (editor: TiptapEditor | null) => {
  if (!editor) {
    return false;
  }

  if (editor.can().sinkListItem("taskItem")) {
    editor.chain().focus().sinkListItem("taskItem").run();
    return true;
  }

  if (editor.can().sinkListItem("listItem")) {
    editor.chain().focus().sinkListItem("listItem").run();
    return true;
  }

  return false;
};

const performOutdent = (editor: TiptapEditor | null) => {
  if (!editor) {
    return false;
  }

  if (editor.can().liftListItem("taskItem")) {
    editor.chain().focus().liftListItem("taskItem").run();
    return true;
  }

  if (editor.can().liftListItem("listItem")) {
    editor.chain().focus().liftListItem("listItem").run();
    return true;
  }

  return false;
};

const TEXT_COLOR_OPTIONS = [
  { name: "Slate", value: "#1f2937" },
  { name: "Gray", value: "#374151" },
  { name: "Zinc", value: "#3f3f46" },
  { name: "Neutral", value: "#3f3f3f" },
  { name: "Stone", value: "#44403c" },
  { name: "Red", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#d97706" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Lime", value: "#65a30d" },
  { name: "Green", value: "#16a34a" },
  { name: "Emerald", value: "#059669" },
  { name: "Teal", value: "#0d9488" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Sky", value: "#0284c7" },
  { name: "Blue", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Purple", value: "#9333ea" },
  { name: "Fuchsia", value: "#c026d3" },
  { name: "Pink", value: "#db2777" },
  { name: "Rose", value: "#e11d48" },
] as const;

const HIGHLIGHT_OPTIONS = [
  { name: "Lemon", value: "#fef9c3" },
  { name: "Daffodil", value: "#fde68a" },
  { name: "Sunset", value: "#fcd34d" },
  { name: "Mint", value: "#bbf7d0" },
  { name: "Aqua", value: "#99f6e4" },
  { name: "Sky", value: "#bae6fd" },
  { name: "Lavender", value: "#ddd6fe" },
  { name: "Blush", value: "#fecdd3" },
] as const;

const DEFAULT_TABLE_CONFIG = {
  rows: 3,
  cols: 4,
  withHeaderRow: true,
};

const insertDefaultTable = (editor: TiptapEditor | null) => {
  if (!editor) return false;
  return editor.chain().focus().insertTable(DEFAULT_TABLE_CONFIG).run();
};

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const insertImagesFromFiles = async (editor: TiptapEditor, files: Iterable<File>, position?: number) => {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) {
    return;
  }

  if (position !== undefined) {
    editor.chain().focus(position).run();
  } else {
    editor.chain().focus().run();
  }

  for (const file of imageFiles) {
    try {
      const src = await readFileAsDataURL(file);
      if (!src) continue;
      const alt = file.name?.replace(/\.[^/.]+$/, "") ?? "Image";
      editor.chain().focus().setImage({ src, alt }).updateAttributes("image", { width: 100 }).run();
    } catch (error) {
      console.error("Failed to read image file", error);
    }
  }
};

const tableCommands = {
  addRowAbove: (editor: TiptapEditor | null) => editor?.chain().focus().addRowBefore().run() ?? false,
  addRowBelow: (editor: TiptapEditor | null) => editor?.chain().focus().addRowAfter().run() ?? false,
  addColumnLeft: (editor: TiptapEditor | null) => editor?.chain().focus().addColumnBefore().run() ?? false,
  addColumnRight: (editor: TiptapEditor | null) => editor?.chain().focus().addColumnAfter().run() ?? false,
  deleteRow: (editor: TiptapEditor | null) => editor?.chain().focus().deleteRow().run() ?? false,
  deleteColumn: (editor: TiptapEditor | null) => editor?.chain().focus().deleteColumn().run() ?? false,
  deleteTable: (editor: TiptapEditor | null) => editor?.chain().focus().deleteTable().run() ?? false,
  toggleHeader: (editor: TiptapEditor | null) => editor?.chain().focus().toggleHeaderRow().run() ?? false,
};

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100,
        renderHTML: (attributes: { width?: number }) => {
          const width = typeof attributes.width === "number" && Number.isFinite(attributes.width)
            ? attributes.width
            : 100;
          const style = [`width: ${width}%;`, "height: auto;"];
          return {
            "data-width": width,
            style: style.join(" "),
          };
        },
        parseHTML: (element: HTMLElement) => {
          const widthAttr =
            element.getAttribute("data-width") ?? element.style.width ?? element.getAttribute("width");
          if (!widthAttr) return 100;
          const parsed = parseFloat(String(widthAttr).replace(/[^\d.]/g, ""));
          return Number.isFinite(parsed) ? parsed : 100;
        },
      },
    } satisfies Record<string, unknown>;
  },
});

const ImageFileHandlerExtension = Extension.create({
  name: "imageFileHandler",
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const files = event.clipboardData?.files;
            if (!files?.length) return false;
            const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
            if (!imageFiles.length) return false;
            event.preventDefault();
            void insertImagesFromFiles(editor, imageFiles, view.state.selection.from);
            return true;
          },
          handleDrop(view, event) {
            const files = event.dataTransfer?.files;
            if (!files?.length) return false;
            const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
            if (!imageFiles.length) return false;
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const position = coordinates?.pos ?? view.state.selection.from;
            void insertImagesFromFiles(editor, imageFiles, position);
            return true;
          },
        },
      }),
    ];
  },
});

type TextEditorProps = {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
};

const TextEditor = ({
  value = "",
  onChange,
  placeholder = "Mulai mengetik...",
  className,
  contentClassName,
}: TextEditorProps) => {
  const wrapperClassName = ["text-editor", className].filter(Boolean).join(" ");
  const editorContentClassName = [
    "text-editor__content tiptap focus:outline-none min-h-[180px]",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: false,
      }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: "editor-heading",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "editor-table" },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: "editor-table__header" },
      }),
      TableCell.configure({
        HTMLAttributes: { class: "editor-table__cell" },
      }),
      ResizableImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "editor-image",
        },
      }),
      ImageFileHandlerExtension,
      Link.configure({
        openOnClick: false,
        linkOnPaste: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: "task-item" },
      }),
      slashCommandExtension,
      Highlight.configure({ multicolor: true }),
      Underline,
      Subscript,
      Superscript,
    ],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: editorContentClassName,
      },
      handleDOMEvents: {
        keydown: (_view, event) => {
          if (event.key === "Tab") {
            if (event.shiftKey) {
              const handled = performOutdent(editor);
              if (handled) {
                event.preventDefault();
                return true;
              }
            } else {
              const handled = performIndent(editor);
              if (handled) {
                event.preventDefault();
                return true;
              }
            }
          }

          return false;
        },
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (value !== undefined && value !== currentContent) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const handleBubbleButtonMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const headingTriggerIsActive = editor ? editor.isActive("heading") : false;
  const headingLevel = editor?.getAttributes("heading")?.level ?? null;
  const listTriggerIsActive = editor ? ["bulletList", "orderedList", "taskList"].some((name) => editor.isActive(name)) : false;
  const [bubbleMenuContent, setBubbleMenuContent] = useState<HTMLDivElement | null>(null);
  const currentTextColor = editor?.getAttributes("textStyle")?.color ?? null;
  const highlightActive = editor?.isActive("highlight") ?? false;
  const highlightColor = highlightActive ? editor?.getAttributes("highlight")?.color ?? null : null;
  const colorButtonStyle =
    currentTextColor || highlightColor
      ? ({
          ...(currentTextColor ? { "--text-color-chip": currentTextColor } : {}),
          ...(highlightColor ? { "--highlight-color-chip": highlightColor } : {}),
        } as CSSProperties)
      : undefined;
  const currentAlignment = editor?.isActive({ textAlign: "center" })
    ? "center"
    : editor?.isActive({ textAlign: "right" })
    ? "right"
    : editor?.isActive({ textAlign: "justify" })
    ? "justify"
    : "left";
  const alignmentIcons: Record<"left" | "center" | "right" | "justify", IconType> = {
    left: MdFormatAlignLeft,
    center: MdFormatAlignCenter,
    right: MdFormatAlignRight,
    justify: MdFormatAlignJustify,
  };
  const AlignmentIcon = alignmentIcons[currentAlignment];
  const canIndent = editor ? editor.can().sinkListItem("taskItem") || editor.can().sinkListItem("listItem") : false;
  const canOutdent = editor ? editor.can().liftListItem("taskItem") || editor.can().liftListItem("listItem") : false;
  const tableActive = editor?.isActive("table") ?? false;
  const canAddRowAbove = editor ? editor.can().addRowBefore() : false;
  const canAddRowBelow = editor ? editor.can().addRowAfter() : false;
  const canAddColumnLeft = editor ? editor.can().addColumnBefore() : false;
  const canAddColumnRight = editor ? editor.can().addColumnAfter() : false;
  const canDeleteRow = editor ? editor.can().deleteRow() : false;
  const canDeleteColumn = editor ? editor.can().deleteColumn() : false;
  const canDeleteTable = editor ? editor.can().deleteTable() : false;
  const canToggleHeader = editor ? editor.can().toggleHeaderRow() : false;
  const headerRowActive = editor?.isActive("tableHeader") ?? false;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rawImageWidth = editor?.getAttributes("image")?.width;
  const imageWidth = useMemo(() => {
    if (typeof rawImageWidth === "number") {
      return rawImageWidth;
    }
    if (typeof rawImageWidth === "string" && rawImageWidth) {
      const parsed = parseFloat(rawImageWidth.replace(/[^\d.]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return 100;
  }, [rawImageWidth]);

  const clampedImageWidth = Math.min(100, Math.max(10, Math.round(imageWidth)));

  const handleImageInsertion = useCallback(
    async (files: Iterable<File>, position?: number) => {
      if (!editor) return;
      await insertImagesFromFiles(editor, files, position);
    },
    [editor],
  );

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files?.length) {
        return;
      }
      void handleImageInsertion(files);
      event.target.value = "";
    },
    [handleImageInsertion],
  );

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageWidthChange = useCallback(
    (value: number) => {
      if (!editor) return;
      const width = Math.min(100, Math.max(10, Math.round(value)));
      editor.chain().focus().updateAttributes("image", { width }).run();
    },
    [editor],
  );

  const handleInsertImageFromUrl = useCallback(() => {
    if (!editor) return;
    promptImageUrlAndInsert(editor);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const applyPosition = (position?: number) => {
      if (position === undefined) {
        return;
      }
      const doc = editor.state.doc;
      const resolved = doc.resolve(Math.min(Math.max(position, 0), doc.content.size));
      const tr = editor.state.tr.setSelection(TextSelection.near(resolved));
      editor.view.dispatch(tr);
    };

    const uploadListener = (event: Event) => {
      const customEvent = event as CustomEvent<{ position?: number }>;
      applyPosition(customEvent.detail?.position);
      editor.view.focus();
      handleImageButtonClick();
    };

    const urlListener = (event: Event) => {
      const customEvent = event as CustomEvent<{ position?: number }>;
      applyPosition(customEvent.detail?.position);
      editor.view.focus();
      handleInsertImageFromUrl();
    };

    document.addEventListener("tiptap-trigger-image-upload", uploadListener);
    document.addEventListener("tiptap-insert-image-url", urlListener);
    return () => {
      document.removeEventListener("tiptap-trigger-image-upload", uploadListener);
      document.removeEventListener("tiptap-insert-image-url", urlListener);
    };
  }, [editor, handleImageButtonClick, handleInsertImageFromUrl]);

  const handleLinkButtonClick = useCallback(() => {
    if (!editor) return;
    promptLink(editor);
  }, [editor]);

  const handleDragEnd = useCallback(() => {
    if (!editor) return;

    requestAnimationFrame(() => {
      const { state } = editor;
      const { selection } = state;
      const docSize = state.doc.content.size;
      const rawPos = selection instanceof NodeSelection ? Math.max(selection.to - 1, 0) : selection.to;
      const clampedPos = Math.max(0, Math.min(rawPos, docSize));

      editor.chain().focus().setTextSelection(clampedPos).run();
    });
  }, [editor]);

  return (
    <div className={wrapperClassName}>
      {editor && (
        <>
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              placement: "top",
              animation: "shift-away",
              duration: 200,
              appendTo: () => editor?.view.dom.parentElement ?? document.body,
              interactive: true,
            }}
            className="bubble-menu"
            shouldShow={({ editor }) => {
              if (editor.isActive("image")) {
                return false;
              }
              const { selection } = editor.state;
              return selection instanceof TextSelection && !selection.empty;
            }}
          >
            <div ref={setBubbleMenuContent} className="bubble-menu__content">
              <button
                type="button"
                title="Bold"
                aria-label="Bold"
                onClick={() => editor.chain().focus().toggleBold().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("bold") ? "is-active" : ""}
              >
                <MdFormatBold size={18} />
              </button>
              <button
                type="button"
                title="Italic"
                aria-label="Italic"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("italic") ? "is-active" : ""}
              >
                <MdFormatItalic size={18} />
              </button>
              <button
                type="button"
                title="Underline"
                aria-label="Underline"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("underline") ? "is-active" : ""}
              >
                <MdFormatUnderlined size={18} />
              </button>
              <button
                type="button"
                title="Strikethrough"
                aria-label="Strikethrough"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("strike") ? "is-active" : ""}
              >
                <MdFormatStrikethrough size={18} />
              </button>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    title="Alignment"
                    aria-label="Alignment"
                    onMouseDown={handleBubbleButtonMouseDown}
                    className={currentAlignment !== "left" ? "is-active" : ""}
                  >
                    <AlignmentIcon size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={bubbleMenuContent ?? undefined}>
                  <DropdownMenu.Content
                    className="bubble-menu__dropdown"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    avoidCollisions
                  >
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().setTextAlign("left").run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={currentAlignment === "left"}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatAlignLeft size={16} />
                      </span>
                      Align left
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().setTextAlign("center").run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={currentAlignment === "center"}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatAlignCenter size={16} />
                      </span>
                      Align center
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().setTextAlign("right").run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={currentAlignment === "right"}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatAlignRight size={16} />
                      </span>
                      Align right
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().setTextAlign("justify").run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={currentAlignment === "justify"}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatAlignJustify size={16} />
                      </span>
                      Justify
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <button
                type="button"
                title="Indent"
                aria-label="Indent"
                onClick={() => performIndent(editor)}
                onMouseDown={handleBubbleButtonMouseDown}
                disabled={!canIndent}
              >
                <MdFormatIndentIncrease size={18} />
              </button>
              <button
                type="button"
                title="Outdent"
                aria-label="Outdent"
                onClick={() => performOutdent(editor)}
                onMouseDown={handleBubbleButtonMouseDown}
                disabled={!canOutdent}
              >
                <MdFormatIndentDecrease size={18} />
              </button>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    title="Heading"
                    aria-label="Heading"
                    onMouseDown={handleBubbleButtonMouseDown}
                    className={headingTriggerIsActive ? "is-active" : ""}
                    data-heading-level={headingLevel ?? undefined}
                  >
                    <MdTitle size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={bubbleMenuContent ?? undefined}>
                  <DropdownMenu.Content
                    className="bubble-menu__dropdown"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    avoidCollisions
                  >
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().setParagraph().run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={!headingTriggerIsActive}
                    >
                      Paragraph
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().toggleHeading({ level: 1 }).run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={headingLevel === 1}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdLooksOne size={16} />
                      </span>
                      Heading 1
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().toggleHeading({ level: 2 }).run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={headingLevel === 2}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdLooksTwo size={16} />
                      </span>
                      Heading 2
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().toggleHeading({ level: 3 }).run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                      data-active={headingLevel === 3}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdLooks3 size={16} />
                      </span>
                      Heading 3
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <button
                type="button"
                title="Link"
                aria-label="Link"
                onClick={handleLinkButtonClick}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("link") ? "is-active" : ""}
              >
                <MdLink size={18} />
              </button>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    title="Image"
                    aria-label="Image"
                    onMouseDown={handleBubbleButtonMouseDown}
                  >
                    <MdImage size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={bubbleMenuContent ?? undefined}>
                  <DropdownMenu.Content
                    className="bubble-menu__dropdown"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    avoidCollisions
                  >
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        handleImageButtonClick();
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdCloudUpload size={16} />
                      </span>
                      Unggah gambar
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        handleInsertImageFromUrl();
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdOutlineImage size={16} />
                      </span>
                      Gambar dari URL
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <button
                type="button"
                title="Quote"
                aria-label="Quote"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("blockquote") ? "is-active" : ""}
              >
                <MdFormatQuote size={18} />
              </button>
              <button
                type="button"
                title="Divider"
                aria-label="Divider"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                onMouseDown={handleBubbleButtonMouseDown}
              >
                <MdHorizontalRule size={18} />
              </button>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    title="List Tools"
                    aria-label="List Tools"
                    onMouseDown={handleBubbleButtonMouseDown}
                    className={listTriggerIsActive ? "is-active" : ""}
                  >
                    <MdFormatListBulleted size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={bubbleMenuContent ?? undefined}>
                  <DropdownMenu.Content
                    className="bubble-menu__dropdown"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    avoidCollisions
                  >
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().toggleBulletList().run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatListBulleted size={16} />
                      </span>
                      Bullet list
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().toggleOrderedList().run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatListNumbered size={16} />
                      </span>
                      Ordered list
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().toggleTaskList().run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdChecklist size={16} />
                      </span>
                      Todo list
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        if (performIndent(editor)) {
                          window.setTimeout(() => editor.commands.blur(), 0);
                        }
                      }}
                      disabled={!canIndent}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatIndentIncrease size={16} />
                      </span>
                      Indent
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        if (performOutdent(editor)) {
                          window.setTimeout(() => editor.commands.blur(), 0);
                        }
                      }}
                      disabled={!canOutdent}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatIndentDecrease size={16} />
                      </span>
                      Outdent
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="bubble-menu__dropdown-separator" />
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        const lifted = editor.chain().focus().liftListItem("listItem").run();
                        if (!lifted) {
                          editor.chain().focus().setParagraph().run();
                        }
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatClear size={16} />
                      </span>
                      Clear list
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    title="Table Tools"
                    aria-label="Table Tools"
                    onMouseDown={handleBubbleButtonMouseDown}
                    className={tableActive ? "is-active" : ""}
                  >
                    <MdTableChart size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={bubbleMenuContent ?? undefined}>
                  <DropdownMenu.Content
                    className="bubble-menu__dropdown"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    avoidCollisions
                  >
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        insertDefaultTable(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdTableChart size={16} />
                      </span>
                      Insert table
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="bubble-menu__dropdown-separator" />
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.addRowAbove(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canAddRowAbove}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdBorderTop size={16} />
                      </span>
                      Add row above
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.addRowBelow(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canAddRowBelow}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdBorderBottom size={16} />
                      </span>
                      Add row below
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.addColumnLeft(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canAddColumnLeft}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdBorderLeft size={16} />
                      </span>
                      Add column left
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.addColumnRight(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canAddColumnRight}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdBorderRight size={16} />
                      </span>
                      Add column right
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="bubble-menu__dropdown-separator" />
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.toggleHeader(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canToggleHeader}
                      data-active={headerRowActive}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdOutlineSegment size={16} />
                      </span>
                      Toggle header row
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.deleteRow(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canDeleteRow}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdDeleteForever size={16} />
                      </span>
                      Delete row
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.deleteColumn(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canDeleteColumn}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdDeleteForever size={16} />
                      </span>
                      Delete column
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        tableCommands.deleteTable(editor);
                        window.setTimeout(() => editor?.commands.blur(), 0);
                      }}
                      disabled={!canDeleteTable}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdDeleteForever size={16} />
                      </span>
                      Delete table
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    title="Color & Highlight"
                    aria-label="Color & Highlight"
                    onMouseDown={handleBubbleButtonMouseDown}
                    className={currentTextColor || highlightActive ? "is-active" : ""}
                    data-text-color-active={currentTextColor ? "true" : undefined}
                    data-highlight-active={highlightActive ? "true" : undefined}
                    style={colorButtonStyle}
                  >
                    <MdPalette size={18} />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal container={bubbleMenuContent ?? undefined}>
                  <DropdownMenu.Content
                    className="bubble-menu__dropdown bubble-menu__dropdown--colors"
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    collisionPadding={8}
                    avoidCollisions
                  >
                    <DropdownMenu.Label className="bubble-menu__dropdown-label">Text color</DropdownMenu.Label>
                    <div className="bubble-menu__color-grid" role="none">
                      {TEXT_COLOR_OPTIONS.map((color) => (
                        <DropdownMenu.Item
                          key={color.value}
                          className="bubble-menu__dropdown-color"
                          onSelect={() => {
                            editor.chain().focus().setColor(color.value).run();
                            window.setTimeout(() => editor.commands.blur(), 0);
                          }}
                          data-active={editor.isActive("textStyle", { color: color.value })}
                          style={{ "--color-chip": color.value } as CSSProperties}
                        >
                          <span aria-hidden />
                          {color.name}
                        </DropdownMenu.Item>
                      ))}
                    </div>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().unsetColor().run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatClear size={16} />
                      </span>
                      Reset text color
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="bubble-menu__dropdown-separator" />
                    <DropdownMenu.Label className="bubble-menu__dropdown-label">Highlight</DropdownMenu.Label>
                    <div className="bubble-menu__color-grid" role="none">
                      {HIGHLIGHT_OPTIONS.map((color) => (
                        <DropdownMenu.Item
                          key={color.value}
                          className="bubble-menu__dropdown-color bubble-menu__dropdown-color--highlight"
                          onSelect={() => {
                            editor.chain().focus().setHighlight({ color: color.value }).run();
                            window.setTimeout(() => editor.commands.blur(), 0);
                          }}
                          data-active={editor.isActive("highlight", { color: color.value })}
                          style={{ "--color-chip": color.value } as CSSProperties}
                        >
                          <span aria-hidden />
                          {color.name}
                        </DropdownMenu.Item>
                      ))}
                    </div>
                    <DropdownMenu.Item
                      className="bubble-menu__dropdown-item"
                      onSelect={() => {
                        editor.chain().focus().unsetHighlight().run();
                        window.setTimeout(() => editor.commands.blur(), 0);
                      }}
                    >
                      <span className="bubble-menu__dropdown-icon" aria-hidden>
                        <MdFormatClear size={16} />
                      </span>
                      Reset highlight
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <button
                type="button"
                title="Subscript"
                aria-label="Subscript"
                onClick={() => editor.chain().focus().toggleSubscript().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("subscript") ? "is-active" : ""}
              >
                <MdSubscript size={18} />
              </button>
              <button
                type="button"
                title="Superscript"
                aria-label="Superscript"
                onClick={() => editor.chain().focus().toggleSuperscript().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("superscript") ? "is-active" : ""}
              >
                <MdSuperscript size={18} />
              </button>
              <button
                type="button"
                title="Code"
                aria-label="Code"
                onClick={() => editor.chain().focus().toggleCode().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("code") ? "is-active" : ""}
              >
                <MdCode size={18} />
              </button>
              <button
                type="button"
                title="Code Block"
                aria-label="Code Block"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                onMouseDown={handleBubbleButtonMouseDown}
                className={editor.isActive("codeBlock") ? "is-active" : ""}
              >
              <BiCodeBlock size={18} />
              </button>
            </div>
          </BubbleMenu>
          <BubbleMenu
            editor={editor}
            tippyOptions={{
              placement: "bottom",
              animation: "shift-away",
              duration: 200,
              appendTo: () => editor?.view.dom.parentElement ?? document.body,
              interactive: true,
              offset: [0, 16],
            }}
            className="bubble-menu bubble-menu--image"
            shouldShow={({ editor }) => editor.isActive("image")}
            pluginKey="imageControls"
          >
            <div className="image-resizer-menu" onMouseDown={(event) => event.preventDefault()}>
              <span className="image-resizer-menu__label">Lebar {clampedImageWidth}%</span>
              <Slider.Root
                className="image-resizer-menu__slider"
                min={10}
                max={100}
                step={1}
                value={[clampedImageWidth]}
                onValueChange={([value]) => handleImageWidthChange(value ?? clampedImageWidth)}
              >
                <Slider.Track className="image-resizer-menu__track">
                  <Slider.Range className="image-resizer-menu__range" />
                </Slider.Track>
                <Slider.Thumb className="image-resizer-menu__thumb" aria-label="Image width" />
              </Slider.Root>
            </div>
          </BubbleMenu>
          <DragHandle editor={editor} className="drag-handle" onElementDragEnd={handleDragEnd}>
            <button type="button" className="drag-handle__button" aria-label="Pindahkan blok">
              <MdDragIndicator size={18} aria-hidden />
            </button>
          </DragHandle>
    </>
  )}
  <EditorContent editor={editor} />
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    multiple
    className="text-editor__file-input"
    onChange={handleFileInputChange}
  />
</div>
  );
};

export default TextEditor;
