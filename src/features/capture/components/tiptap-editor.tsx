"use client";

import * as React from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import { Markdown } from "@tiptap/markdown";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  initialContent?: JSONContent | string;
  placeholder?: string;
  onChange: (data: {
    json: JSONContent;
    text: string;
    markdown: string;
  }) => void;
  className?: string;
}

export function TiptapEditor({
  initialContent,
  placeholder = "Capture a thought, rhyme, chord progression, or creative fragment...",
  onChange,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground/40 before:float-left before:pointer-events-none before:h-0",
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
      Markdown,
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[160px] p-3 text-sm focus:outline-none text-foreground leading-relaxed selection:bg-primary/20",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      const text = ed.getText();
      let markdown = "";
      try {
        const storage = ed.storage as unknown as Record<string, { getMarkdown?: () => string }>;
        if (storage.markdown?.getMarkdown) {
          markdown = storage.markdown.getMarkdown();
        } else {
          markdown = text;
        }
      } catch {
        markdown = text;
      }

      onChange({
        json,
        text,
        markdown,
      });
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className="min-h-[160px] rounded border border-border/60 bg-input/20 p-3 text-xs text-muted-foreground/50">
        Initializing studio editor...
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-md border border-border bg-input/20", className)}>
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border/70 bg-card/50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("heading", { level: 1 }) && "bg-secondary text-primary font-bold"
          )}
          title="Heading 1"
          aria-label="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("heading", { level: 2 }) && "bg-secondary text-primary font-bold"
          )}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-3.5 w-px bg-border" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("bold") && "bg-secondary text-primary font-bold"
          )}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("italic") && "bg-secondary text-primary font-bold"
          )}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("strike") && "bg-secondary text-primary font-bold"
          )}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        <div className="mx-1 h-3.5 w-px bg-border" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("bulletList") && "bg-secondary text-primary font-bold"
          )}
          title="Bullet List"
          aria-label="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("orderedList") && "bg-secondary text-primary font-bold"
          )}
          title="Numbered List"
          aria-label="Numbered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("blockquote") && "bg-secondary text-primary font-bold"
          )}
          title="Blockquote"
          aria-label="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            "rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground",
            editor.isActive("codeBlock") && "bg-secondary text-primary font-bold"
          )}
          title="Code Block"
          aria-label="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
            title="Undo"
            aria-label="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
            title="Redo"
            aria-label="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}
