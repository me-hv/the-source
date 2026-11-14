// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

describe("Tiptap Rich-Text Canonical Document & Plain Text", () => {
  it("generates canonical JSON and plain text from formatted input", () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({ link: false }),
        Link.configure({ openOnClick: false }),
      ],
      content: "<h2>Verse 1</h2><p>I set my <strong>mind</strong> on the prize</p>",
    });

    const json = editor.getJSON();
    const text = editor.getText();

    // Canonical JSON structure
    expect(json.type).toBe("doc");
    expect(Array.isArray(json.content)).toBe(true);
    expect(json.content?.length).toBe(2);

    // First node is heading level 2
    expect(json.content?.[0].type).toBe("heading");
    expect(json.content?.[0].attrs?.level).toBe(2);

    // Second node is paragraph with bold mark
    expect(json.content?.[1].type).toBe("paragraph");
    const boldNode = json.content?.[1].content?.find(
      (c) => c.marks?.some((m) => m.type === "bold")
    );
    expect((boldNode as any)?.text).toBe("mind");

    // Plain searchable text extracts all visible words
    expect(text).toContain("Verse 1");
    expect(text).toContain("I set my mind on the prize");

    editor.destroy();
  });

  it("handles blockquotes and bullet lists correctly", () => {
    const editor = new Editor({
      extensions: [StarterKit],
      content: "<blockquote>Inspiration quote</blockquote><ul><li>Item 1</li><li>Item 2</li></ul>",
    });

    const json = editor.getJSON();
    const text = editor.getText();

    expect(json.content?.[0].type).toBe("blockquote");
    expect(json.content?.[1].type).toBe("bulletList");
    expect(text).toContain("Inspiration quote");
    expect(text).toContain("Item 1");
    expect(text).toContain("Item 2");

    editor.destroy();
  });
});
