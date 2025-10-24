import {
  forwardRef,
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { BubbleMenu, EditorContent, ReactRenderer, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import type { Editor as TiptapEditor, Range } from "@tiptap/core";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
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
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { NodeSelection } from "@tiptap/pm/state";
import type { IconType } from "react-icons";
import {
  MdChecklist,
  MdCode,
  MdDragIndicator,
  MdFormatBold,
  MdFormatClear,
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatItalic,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdFormatStrikethrough,
  MdFormatUnderlined,
  MdHorizontalRule,
  MdLink,
  MdLooks3,
  MdLooksOne,
  MdLooksTwo,
  MdOutlineSegment,
  MdPalette,
  MdSubscript,
  MdSuperscript,
  MdTitle,
} from "react-icons/md";
import { BiCodeBlock } from "react-icons/bi";
import "../styles/tiptap.scss";
import tippy from "tippy.js";

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

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href, target: "_blank", rel: "noopener noreferrer" })
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
    return <div className="slash-command"><div className="slash-command__empty">Tidak ada hasil</div></div>;
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
        command: ({ editor, range, props }) => {
          const item = props as SlashCommandItem | undefined;
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
      items: ({ query }) => {
        const normalized = query?.toLowerCase().trim() ?? "";
        const items = createSlashCommandItems();
        if (!normalized) {
          return items.slice(0, 10);
        }

        return items
          .filter(
            (item) =>
              item.title.toLowerCase().includes(normalized) || item.description.toLowerCase().includes(normalized)
          )
          .slice(0, 10);
      },
      render: () => {
        let component: ReactRenderer<SlashCommandListRef>;
        let popup: ReturnType<typeof tippy> | null = null;

        return {
          onStart: (props) => {
            component = new ReactRenderer(SlashCommandList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) {
              return;
            }

            popup = tippy(document.body, {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
              offset: [0, 8],
            });
          },
          onUpdate(props) {
            component.updateProps(props);

            if (!props.clientRect) {
              return;
            }

            popup?.setProps({
              getReferenceClientRect: props.clientRect,
            });
          },
          onKeyDown(props) {
            if (props.event.key === "Escape") {
              popup?.hide();
              return true;
            }

            return component.ref?.onKeyDown(props) ?? false;
          },
          onExit() {
            popup?.destroy();
            popup = null;
            component.destroy();
          },
        };
      },
    },
  });

const slashCommandExtension = createSlashCommandExtension();

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

type TextEditorProps = {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
};

const TextEditor = ({ value = "", onChange, placeholder = "Mulai mengetik..." }: TextEditorProps) => {
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
        class: "text-editor__content tiptap focus:outline-none min-h-[180px]",
        // 'text-editor__content tiptap focus:outline-none min-h-[180px] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
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
    <div className="text-editor">
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
          <DragHandle editor={editor} className="drag-handle" onElementDragEnd={handleDragEnd}>
            <button type="button" className="drag-handle__button" aria-label="Pindahkan blok">
              <MdDragIndicator size={18} aria-hidden />
            </button>
          </DragHandle>
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEditor;
