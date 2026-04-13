"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { GalleryExtension } from "./blog/GalleryExtension";
import { FontSizeExtension } from "./blog/FontSizeExtension";
import { LineHeightExtension } from "./blog/LineHeightExtension";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogEditorProps {
  content: object;
  onChange: (json: object) => void;
  placeholder?: string;
  dir?: "rtl" | "ltr";
}

// ── Icon helpers ────────────────────────────────────────────────────────────

function Ico({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ── Toolbar Button ────────────────────────────────────────────────────────────

function Btn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`editor-tool-btn ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="editor-divider" />;
}

// ── Main Editor ───────────────────────────────────────────────────────────────

export default function BlogEditor({
  content,
  onChange,
  placeholder = "ابدأ الكتابة هنا...",
  dir = "rtl",
}: BlogEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [galleryColumns, setGalleryColumns] = useState(2);
  const [editorDir, setEditorDir] = useState<"rtl" | "ltr">(dir);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const slideshowInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        code: {},
        codeBlock: {},
      }),
      TextStyle,
      Color,
      FontSizeExtension,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ controls: true, nocookie: true }),
      GalleryExtension,
      LineHeightExtension,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "editor-content-area",
        dir,
      },
    },
  });

  // Sync direction changes to the ProseMirror DOM
  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute("dir", editorDir);
  }, [editor, editorDir]);

  // ── Upload helpers ────────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: FileList | null, mode: "single" | "gallery" | "slideshow" | "fullwidth") => {
      if (!files || !editor) return;
      setUploading(true);
      try {
        const urls: string[] = [];
        for (const file of Array.from(files)) {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "blog");
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          urls.push(data.url);
        }
        if ((mode === "single" || mode === "fullwidth") && urls[0]) {
          editor
            .chain()
            .focus()
            .setImage({ src: urls[0], ...(mode === "fullwidth" ? { "data-width": "full" } : {}) })
            .run();
        } else if (mode === "gallery" && urls.length) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "gallery",
              attrs: { images: urls, columns: galleryColumns, display: "grid" },
            })
            .run();
        } else if (mode === "slideshow" && urls.length) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "gallery",
              attrs: { images: urls, columns: galleryColumns, display: "slideshow" },
            })
            .run();
        }
      } catch {
        alert("فشل رفع الصورة");
      } finally {
        setUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (galleryInputRef.current) galleryInputRef.current.value = "";
        if (slideshowInputRef.current) slideshowInputRef.current.value = "";
      }
    },
    [editor, galleryColumns]
  );

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    if (editor.state.selection.empty) {
      editor.chain().focus().setLink({ href: linkUrl }).insertContent(linkUrl).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const insertVideo = useCallback(() => {
    if (!editor || !videoUrl) return;
    editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
    setVideoUrl("");
    setShowVideoInput(false);
  }, [editor, videoUrl]);

  if (!editor) return null;

  const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "64px"];
  const LINE_HEIGHTS = ["1", "1.2", "1.4", "1.6", "1.8", "2", "2.4", "2.8", "3"];

  const headingValue =
    editor.isActive("heading", { level: 1 }) ? "h1" :
    editor.isActive("heading", { level: 2 }) ? "h2" :
    editor.isActive("heading", { level: 3 }) ? "h3" :
    editor.isActive("heading", { level: 4 }) ? "h4" : "p";

  return (
    <div className="blog-editor-wrap">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="editor-toolbar">

        {/* Block type */}
        <select
          className="editor-select"
          style={{ minWidth: "90px" }}
          value={headingValue}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: parseInt(v[1]) as 1|2|3|4 }).run();
          }}
        >
          <option value="p">فقرة</option>
          <option value="h1">عنوان 1</option>
          <option value="h2">عنوان 2</option>
          <option value="h3">عنوان 3</option>
          <option value="h4">عنوان 4</option>
        </select>

        {/* Font Size */}
        <select
          className="editor-select"
          style={{ width: "70px" }}
          value=""
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
        >
          <option value="">حجم</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s.replace("px", "")}</option>
          ))}
        </select>

        {/* Line Height */}
        <select
          className="editor-select"
          style={{ width: "62px" }}
          value=""
          title="تباعد الأسطر"
          onChange={(e) => {
            if (e.target.value) editor.chain().focus().setLineHeight(e.target.value).run();
            else editor.chain().focus().unsetLineHeight().run();
          }}
        >
          <option value="">↕</option>
          {LINE_HEIGHTS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <Divider />

        {/* Basic marks */}
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="غامق (Ctrl+B)">
          <strong style={{ fontSize: "0.875rem" }}>B</strong>
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="مائل (Ctrl+I)">
          <em style={{ fontSize: "0.875rem" }}>I</em>
        </Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="تسطير (Ctrl+U)">
          <span style={{ textDecoration: "underline", fontSize: "0.875rem" }}>U</span>
        </Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="شطب">
          <span style={{ textDecoration: "line-through", fontSize: "0.875rem" }}>S</span>
        </Btn>
        <Btn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="كود مضمّن">
          <Ico d="M5 4 L1 8 L5 12 M11 4 L15 8 L11 12" />
        </Btn>

        <Divider />

        {/* Color */}
        <label title="لون النص" className="editor-color-label">
          <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>A</span>
          <input
            type="color"
            className="editor-color-input"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>

        <Divider />

        {/* Text direction */}
        <Btn
          active={editorDir === "rtl"}
          onClick={() => setEditorDir("rtl")}
          title="اتجاه النص: يمين إلى يسار"
        >
          <Ico d="M2 4h8M2 8h8M6 4v8M12 3l3 3-3 3" size={15} />
        </Btn>
        <Btn
          active={editorDir === "ltr"}
          onClick={() => setEditorDir("ltr")}
          title="Text direction: left to right"
        >
          <Ico d="M6 4H14M6 8h8M10 4v8M4 3L1 6l3 3" size={15} />
        </Btn>

        <Divider />

        {/* Alignment */}
        <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="محاذاة يمين">
          <Ico d="M2 4h12M6 8h8M2 12h12" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="توسيط">
          <Ico d="M3 4h10M5 8h6M3 12h10" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="محاذاة يسار">
          <Ico d="M2 4h12M2 8h8M2 12h12" />
        </Btn>
        <Btn active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="ضبط">
          <Ico d="M2 4h12M2 8h12M2 12h12" />
        </Btn>

        <Divider />

        {/* Lists */}
        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="قائمة نقطية">
          <Ico d="M3 4h10M3 8h10M3 12h10M1 4h.5M1 8h.5M1 12h.5" />
        </Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="قائمة مرقمة">
          <Ico d="M4 4h10M4 8h10M4 12h10M1 3v2M1.5 7H1l1 1.5-1 1.5h1.5M1 11h1.5v.75H1v.25h1.5" />
        </Btn>

        <Divider />

        {/* Blockquote / HR / Code block */}
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="اقتباس بارز">
          <Ico d="M3 6q0-2 2-2v1q-1 0-1 1v1h1v3H2zm5 0q0-2 2-2v1q-1 0-1 1v1h1v3H7z" />
        </Btn>
        <Btn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="كتلة كود">
          <Ico d="M5 3L1 8l4 5M11 3l4 5-4 5M9 2l-2 12" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="فاصل أفقي">
          <Ico d="M1 8h14" />
        </Btn>

        <Divider />

        {/* Link */}
        <Btn active={editor.isActive("link")} onClick={() => { setShowLinkInput(!showLinkInput); setShowVideoInput(false); }} title="رابط">
          <Ico d="M7 9a3 3 0 0 0 4.5.3l1.5-1.5a3 3 0 0 0-4.2-4.2L7.5 5M9 7a3 3 0 0 0-4.5-.3L3 8.2a3 3 0 0 0 4.2 4.2l1.3-1.3" />
        </Btn>
        {editor.isActive("link") && (
          <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="إزالة رابط">
            <Ico d="M8 8L5 5M11 5l-6 6M3 8L1 6m8 6 2 2" />
          </Btn>
        )}

        <Divider />

        {/* Single Image */}
        <Btn onClick={() => imageInputRef.current?.click()} disabled={uploading} title="صورة عادية">
          <Ico d="M1 3h14v10H1zM1 10l4-3 3 2.5 2-1.5 4 4M10 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </Btn>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => uploadFiles(e.target.files, "single")}
        />

        {/* Gallery */}
        <select
          className="editor-select"
          style={{ width: "50px" }}
          value={galleryColumns}
          onChange={(e) => setGalleryColumns(Number(e.target.value))}
          title="عدد أعمدة المعرض"
        >
          <option value={2}>٢</option>
          <option value={3}>٣</option>
          <option value={4}>٤</option>
        </select>
        <Btn onClick={() => galleryInputRef.current?.click()} disabled={uploading} title="معرض صور (Grid)">
          <Ico d="M1 3h6v6H1zM9 3h6v6H9zM1 11h6v2H1zM9 11h6v2H9z" />
        </Btn>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => uploadFiles(e.target.files, "gallery")}
        />

        {/* Slideshow */}
        <Btn onClick={() => slideshowInputRef.current?.click()} disabled={uploading} title="معرض سلايد شو">
          <Ico d="M1 4h14v8H1zM5 8l3 2.5L11 8M7 6h.01" />
        </Btn>
        <input
          ref={slideshowInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => uploadFiles(e.target.files, "slideshow")}
        />

        {/* Video */}
        <Btn onClick={() => { setShowVideoInput(!showVideoInput); setShowLinkInput(false); }} title="تضمين فيديو يوتيوب / فيميو">
          <Ico d="M1 3h14v10H1zM6 6l5 2.5L6 11z" />
        </Btn>

        <Divider />

        {/* Undo / Redo */}
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="تراجع (Ctrl+Z)">
          <Ico d="M3 6H9a4 4 0 0 1 0 8H5M3 6L1 4M3 6L1 8" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="إعادة (Ctrl+Y)">
          <Ico d="M13 6H7a4 4 0 0 0 0 8h4M13 6l2-2M13 6l2 2" />
        </Btn>
      </div>

      {/* ── Direction indicator pill ──────────────────────────── */}
      <div className="editor-dir-bar">
        <span className={`dir-pill ${editorDir === "rtl" ? "active" : ""}`} onClick={() => setEditorDir("rtl")}>
          ع RTL
        </span>
        <span className={`dir-pill ${editorDir === "ltr" ? "active" : ""}`} onClick={() => setEditorDir("ltr")}>
          A LTR
        </span>
        {uploading && <span className="editor-uploading-pill">⟳ جاري رفع الصورة...</span>}
      </div>

      {/* ── Link Input ─────────────────────────────────────────── */}
      {showLinkInput && (
        <div className="editor-inline-input">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            dir="ltr"
            onKeyDown={(e) => e.key === "Enter" && insertLink()}
            autoFocus
          />
          <button type="button" onClick={insertLink}>تأكيد</button>
          <button type="button" onClick={() => setShowLinkInput(false)}>إلغاء</button>
        </div>
      )}

      {/* ── Video Input ─────────────────────────────────────────── */}
      {showVideoInput && (
        <div className="editor-inline-input">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="رابط يوتيوب أو فيميو"
            dir="ltr"
            onKeyDown={(e) => e.key === "Enter" && insertVideo()}
            autoFocus
          />
          <button type="button" onClick={insertVideo}>تضمين</button>
          <button type="button" onClick={() => setShowVideoInput(false)}>إلغاء</button>
        </div>
      )}

      {/* ── Content Area ─────────────────────────────────────────── */}
      <EditorContent editor={editor} />

      <style>{`
        .blog-editor-wrap {
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-primary);
          font-size: 0.875rem;
        }

        /* ── Toolbar ── */
        .editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.125rem;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .editor-tool-btn {
          min-width: 28px;
          height: 28px;
          padding: 0 0.375rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast), color var(--transition-fast);
        }
        .editor-tool-btn:hover:not(:disabled) {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        .editor-tool-btn.active {
          background: var(--text-primary);
          color: var(--bg-primary);
        }
        .editor-tool-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .editor-color-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          min-width: 28px;
          height: 28px;
          padding: 0 0.375rem;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          transition: background var(--transition-fast);
        }
        .editor-color-label:hover { background: var(--bg-tertiary); }
        .editor-color-input {
          width: 0;
          height: 0;
          opacity: 0;
          position: absolute;
          pointer-events: none;
        }

        .editor-select {
          height: 28px;
          padding: 0 0.3rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.8rem;
          cursor: pointer;
          outline: none;
        }

        .editor-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
          margin: 0 0.2rem;
          flex-shrink: 0;
        }

        /* ── Direction bar ── */
        .editor-dir-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.75rem;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
        }

        .dir-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.15rem 0.6rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--text-muted);
          transition: all var(--transition-fast);
          user-select: none;
        }
        .dir-pill:hover { color: var(--text-primary); }
        .dir-pill.active {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        .editor-uploading-pill {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-inline-start: auto;
        }

        /* ── Inline inputs ── */
        .editor-inline-input {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }
        .editor-inline-input input {
          flex: 1;
          height: 32px;
          padding: 0 0.625rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
        }
        .editor-inline-input input:focus { border-color: var(--text-primary); }
        .editor-inline-input button {
          height: 32px;
          padding: 0 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--bg-primary);
          color: var(--text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .editor-inline-input button:first-of-type {
          background: var(--text-primary);
          color: var(--bg-primary);
          border-color: var(--text-primary);
        }

        /* ── Content area ── */
        .editor-content-area {
          min-height: 480px;
          padding: 2rem 2.5rem;
          outline: none;
          line-height: 1.85;
          color: var(--text-primary);
          font-size: 1rem;
        }

        @media (max-width: 640px) {
          .editor-content-area { padding: 1.25rem 1rem; }
        }

        /* ── Prose styles — Behance-quality ── */
        .editor-content-area h1 {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 600;
          margin: 2.5rem 0 0.875rem;
          line-height: 1.25;
          letter-spacing: -0.02em;
        }
        .editor-content-area h2 {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 500;
          margin: 2rem 0 0.75rem;
          line-height: 1.3;
        }
        .editor-content-area h3 {
          font-size: 1.35rem;
          font-weight: 600;
          margin: 1.75rem 0 0.6rem;
        }
        .editor-content-area h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 1.5rem 0 0.5rem;
          color: var(--text-secondary);
        }
        .editor-content-area p {
          margin: 0.875rem 0;
          color: var(--text-primary);
        }
        .editor-content-area p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: inline-start;
          color: var(--text-subtle);
          pointer-events: none;
          height: 0;
        }
        .editor-content-area ul,
        .editor-content-area ol {
          padding-inline-start: 1.75rem;
          margin: 1rem 0;
        }
        .editor-content-area li { margin: 0.35rem 0; }
        .editor-content-area li p { margin: 0; }

        /* Behance-style large blockquote */
        .editor-content-area blockquote {
          border: none;
          border-inline-start: 3px solid var(--text-primary);
          padding: 0.75rem 1.5rem;
          margin: 2rem 0;
          background: var(--bg-secondary);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          font-size: 1.2rem;
          font-style: italic;
          color: var(--text-secondary);
          line-height: 1.7;
        }
        [dir="rtl"] .editor-content-area blockquote {
          border-inline-start: none;
          border-inline-end: 3px solid var(--text-primary);
          border-radius: var(--radius-md) 0 0 var(--radius-md);
        }

        .editor-content-area hr {
          border: none;
          height: 1px;
          background: var(--border);
          margin: 3rem 0;
        }
        .editor-content-area a {
          color: var(--text-primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Images — full width by default, like Behance */
        .editor-content-area img {
          max-width: 100%;
          width: 100%;
          border-radius: var(--radius-md);
          margin: 1.5rem 0;
          display: block;
        }
        .editor-content-area img[data-width="full"] {
          width: 100%;
          border-radius: 0;
          margin-inline: -2.5rem;
          width: calc(100% + 5rem);
          max-width: none;
        }
        .editor-content-area iframe {
          max-width: 100%;
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: var(--radius-md);
          margin: 1.5rem 0;
          display: block;
        }

        .editor-content-area strong { font-weight: 700; }
        .editor-content-area em { font-style: italic; }
        .editor-content-area u { text-decoration: underline; text-underline-offset: 2px; }
        .editor-content-area s { text-decoration: line-through; }

        /* Inline & block code */
        .editor-content-area code {
          background: var(--bg-secondary);
          border: 1px solid var(--border-subtle);
          padding: 0.1rem 0.4rem;
          border-radius: var(--radius-sm);
          font-family: "Fira Code", "Cascadia Code", monospace;
          font-size: 0.875em;
        }
        .editor-content-area pre {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1.25rem 1.5rem;
          margin: 1.5rem 0;
          overflow-x: auto;
        }
        .editor-content-area pre code {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
