import "./App.css";
import { useState } from "react";
import TextEditor from "./components/TextEditor";

function App() {
  const [content, setContent] = useState("");

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">174nd - WYSIWYG Editor</h1>
        <p className="app__subtitle">Komponen dasar editor menggunakan Tiptap.</p>
      </header>

      <section className="mx-auto">
        <TextEditor value={content} onChange={setContent} className="w-3xl" placeholder="Mulai mengetik catatanmu di sini..." />
      </section>

      <section className="preview">
        <h2 className="preview__title">Preview HTML</h2>
        <div className="preview__content tiptap" dangerouslySetInnerHTML={{ __html: content }} />
      </section>
    </main>
  );
}

export default App;
