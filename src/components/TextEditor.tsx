import { useEffect } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { MdCode, MdFormatBold, MdFormatItalic, MdFormatStrikethrough } from "react-icons/md";
import "../styles/tiptap.scss";

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
      }),
      Placeholder.configure({
        placeholder,
      }),
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
              appendTo: () => document.body,
            }}
            className="bubble-menu"
          >
            <button
              type="button"
              title="Bold"
              aria-label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "is-active" : ""}
            >
              <MdFormatBold size={18} />
            </button>
            <button
              type="button"
              title="Italic"
              aria-label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "is-active" : ""}
            >
              <MdFormatItalic size={18} />
            </button>
            <button
              type="button"
              title="Strikethrough"
              aria-label="Strikethrough"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "is-active" : ""}
            >
              <MdFormatStrikethrough size={18} />
            </button>
            <button
              type="button"
              title="Code"
              aria-label="Code"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? "is-active" : ""}
            >
              <MdCode size={18} />
            </button>
          </BubbleMenu>
          <DragHandle editor={editor} className="drag-handle">
            <button type="button" className="drag-handle__button" aria-label="Pindahkan blok">
              <span aria-hidden>⋮⋮</span>
            </button>
          </DragHandle>
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEditor;
