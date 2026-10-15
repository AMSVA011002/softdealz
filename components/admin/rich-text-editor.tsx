"use client";

import * as React from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Eraser, ImagePlus, Indent,
  Italic, Link2, List, ListOrdered, ListX, Minus, Outdent, Redo2, Strikethrough,
  Subscript, Superscript, Underline, Undo2, Unlink, Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FORMATTING_TAGS = new Set([
  "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "SUB", "SUP", "H1", "H2",
  "H3", "H4", "BLOCKQUOTE", "PRE", "CODE", "DIV", "SPAN", "UL", "OL", "LI",
  "HR", "A", "IMG", "IFRAME", "FONT",
]);
const SAFE_COLORS = /^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-z]{3,20})$/i;
const SAFE_STYLES = new Set(["color", "background-color", "text-align", "font-size", "font-family"]);
const EMBED_HOSTS = new Set(["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"]);
const SIZE_TO_PIXELS: Record<string, string> = {
  "1": "10px", "2": "13px", "3": "16px", "4": "18px", "5": "24px", "6": "32px", "7": "48px",
};

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function safeUrl(value: string | null, protocols: string[]) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin && value.startsWith("/") && !value.startsWith("//")) return value;
    return protocols.includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function safeEmbedUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && EMBED_HOSTS.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function cleanStyle(value: string | null) {
  if (!value) return "";
  return value.split(";").flatMap((declaration) => {
    const separator = declaration.indexOf(":");
    if (separator < 0) return [];
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const setting = declaration.slice(separator + 1).trim();
    if (!SAFE_STYLES.has(property) || /url|expression|[<>;]/i.test(setting)) return [];
    if (property === "color" || property === "background-color") return SAFE_COLORS.test(setting) ? [`${property}:${setting}`] : [];
    if (property === "text-align") return /^(left|center|right|justify)$/i.test(setting) ? [`${property}:${setting}`] : [];
    if (property === "font-size") return /^(?:[8-9]|[1-6]\d|7[0-2])px$|^(?:[5-9]\d|[1-2]\d{2}|300)%$/.test(setting) ? [`${property}:${setting}`] : [];
    if (property === "font-family") return /^(Arial|Georgia|Tahoma|Times New Roman|Trebuchet MS|Verdana|monospace|sans-serif|serif)(,\s*(Arial|Georgia|Tahoma|Times New Roman|Trebuchet MS|Verdana|monospace|sans-serif|serif))*$/i.test(setting) ? [`${property}:${setting}`] : [];
    return [];
  }).join(";");
}

function sanitizeInitialHtml(value: string) {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") ?? "";
    }
    if (!(node instanceof HTMLElement)) return "";
    const children = Array.from(node.childNodes).map(cleanNode).join("");
    if (!FORMATTING_TAGS.has(node.tagName)) return children;
    const tag = node.tagName === "B" ? "strong" : node.tagName === "I" ? "em" : node.tagName.toLowerCase();
    if (tag === "br" || tag === "hr") return `<${tag}>`;

    const attributes: string[] = [];
    if (tag === "a") {
      const href = safeUrl(node.getAttribute("href"), ["http:", "https:", "mailto:"]);
      if (href) attributes.push(`href="${escapeAttribute(href)}"`);
      if (node.getAttribute("target") === "_blank") attributes.push('target="_blank"', 'rel="noopener noreferrer"');
    }
    if (tag === "img") {
      const src = safeUrl(node.getAttribute("src"), ["http:", "https:"]);
      if (!src) return children;
      attributes.push(`src="${escapeAttribute(src)}"`);
      const alt = node.getAttribute("alt");
      if (alt) attributes.push(`alt="${escapeAttribute(alt)}"`);
      return `<img ${attributes.join(" ")}>`;
    }
    if (tag === "iframe") {
      const src = safeEmbedUrl(node.getAttribute("src"));
      if (!src) return children;
      attributes.push(`src="${escapeAttribute(src)}"`, 'title="Embedded media"', 'loading="lazy"', "allowfullscreen");
      return `<iframe ${attributes.join(" ")}></iframe>`;
    }
    const styles = cleanStyle(node.getAttribute("style"));
    if (styles) attributes.push(`style="${escapeAttribute(styles)}"`);
    if (tag === "font") {
      const size = node.getAttribute("size");
      const fontSize = size ? SIZE_TO_PIXELS[size] : undefined;
      const color = node.getAttribute("color");
      const fontFamily = node.getAttribute("face");
      const fontStyles = [
        fontSize ? `font-size:${fontSize}` : "",
        color && SAFE_COLORS.test(color) ? `color:${color}` : "",
        fontFamily && /^(Arial|Georgia|Tahoma|Times New Roman|Trebuchet MS|Verdana|monospace|sans-serif|serif)$/i.test(fontFamily)
          ? `font-family:${fontFamily}`
          : "",
      ].filter(Boolean);
      return fontStyles.length ? `<span style="${escapeAttribute(fontStyles.join(";"))}">${children}</span>` : children;
    }
    return `<${tag}${attributes.length ? ` ${attributes.join(" ")}` : ""}>${children}</${tag}>`;
  };
  return Array.from(parsed.body.childNodes).map(cleanNode).join("");
}

const buttonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-white hover:text-ink-950 focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-40";

export function RichTextEditor({
  id,
  name,
  initialValue,
  invalid,
  minHeight = 180,
  policy = false,
}: {
  id: string;
  name: string;
  initialValue: string;
  invalid?: boolean;
  minHeight?: number;
  policy?: boolean;
}) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const savedSelection = React.useRef<Range | null>(null);
  const [value, setValue] = React.useState(initialValue);
  const [textColor, setTextColor] = React.useState("#111827");
  const [highlightColor, setHighlightColor] = React.useState("#fff59d");

  const rememberSelection = React.useCallback(() => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    savedSelection.current = selection.getRangeAt(0).cloneRange();
  }, []);

  const restoreSelection = React.useCallback(() => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (selection && savedSelection.current && editorRef.current?.contains(savedSelection.current.commonAncestorContainer)) {
      selection.removeAllRanges();
      selection.addRange(savedSelection.current);
    }
  }, []);

  const updateValue = React.useCallback(() => {
    if (!editorRef.current) return;
    setValue(sanitizeInitialHtml(editorRef.current.innerHTML));
    rememberSelection();
  }, [rememberSelection]);

  React.useEffect(() => {
    if (!editorRef.current) return;
    const content = /<(?:p|br|strong|b|em|i|u|s|sub|sup|h[1-4]|blockquote|pre|code|div|span|ul|ol|li|hr|a|img|iframe|font)(?:\s|>|\/)/i.test(initialValue)
      ? sanitizeInitialHtml(initialValue)
      : initialValue
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph) => `<p>${paragraph
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>")}</p>`)
          .join("");
    editorRef.current.innerHTML = content;
    setValue(content);
  }, [initialValue]);

  function runCommand(command: string, argument?: string) {
    restoreSelection();
    document.execCommand(command, false, argument);
    updateValue();
  }

  function insertLink() {
    const url = window.prompt("Enter a web link or email address");
    if (!url) return;
    const normalized = safeUrl(url.trim(), ["http:", "https:", "mailto:"]);
    if (!normalized) {
      window.alert("Use an HTTPS, HTTP, or mailto link.");
      return;
    }
    runCommand("createLink", normalized);
  }

  function insertImage() {
    const url = window.prompt("Enter an HTTPS image URL");
    if (!url) return;
    const normalized = safeUrl(url.trim(), ["https:"]);
    if (!normalized) {
      window.alert("Use a valid HTTPS image URL.");
      return;
    }
    restoreSelection();
    document.execCommand("insertHTML", false, `<img src="${escapeAttribute(normalized)}" alt="">`);
    updateValue();
  }

  function insertVideo() {
    const value = window.prompt("Enter a YouTube or Vimeo video URL");
    if (!value) return;
    let embed: string;
    try {
      const url = new URL(value.trim());
      if (url.protocol !== "https:") throw new Error("Invalid video URL");
      if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname)) {
        const videoId = url.hostname === "youtu.be" ? url.pathname.slice(1) : url.searchParams.get("v");
        if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error("Invalid YouTube video ID");
        embed = `https://www.youtube-nocookie.com/embed/${videoId}`;
      } else if (url.hostname === "vimeo.com" || url.hostname === "www.vimeo.com") {
        const videoId = url.pathname.split("/").filter(Boolean).pop();
        if (!videoId || !/^\d+$/.test(videoId)) throw new Error("Invalid Vimeo video ID");
        embed = `https://player.vimeo.com/video/${videoId}`;
      } else {
        throw new Error("Unsupported video host");
      }
    } catch {
      window.alert("Use a valid YouTube or Vimeo video URL.");
      return;
    }
    restoreSelection();
    document.execCommand("insertHTML", false, `<iframe src="${embed}" title="Embedded video" loading="lazy" allowfullscreen></iframe>`);
    updateValue();
  }

  function removeList() {
    const selectionNode = window.getSelection()?.anchorNode;
    const element = selectionNode instanceof Element ? selectionNode : selectionNode?.parentElement;
    const list = element?.closest("ol, ul");
    if (list) runCommand(list.tagName === "OL" ? "insertOrderedList" : "insertUnorderedList");
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white", invalid ? "border-rose-400" : "border-ink-200")}>
      <div className="space-y-1.5 border-b border-ink-200 bg-ink-50 p-2" role="toolbar" aria-label="Rich text formatting">
        <div className="flex flex-wrap items-center gap-1" aria-label="Text styling and typography">
          <button type="button" aria-label="Bold" title="Bold" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}><Bold className="size-4" /></button>
          <button type="button" aria-label="Italic" title="Italic" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}><Italic className="size-4" /></button>
          <button type="button" aria-label="Underline" title="Underline" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")}><Underline className="size-4" /></button>
          {policy && <button type="button" aria-label="Strikethrough" title="Strikethrough" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("strikeThrough")}><Strikethrough className="size-4" /></button>}
          {policy && <button type="button" aria-label="Subscript" title="Subscript" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("subscript")}><Subscript className="size-4" /></button>}
          {policy && <button type="button" aria-label="Superscript" title="Superscript" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("superscript")}><Superscript className="size-4" /></button>}
          <span className="mx-1 h-6 border-l border-ink-300" aria-hidden />
          <label className="sr-only" htmlFor={`${id}-block`}>Text style</label>
          <select id={`${id}-block`} title="Text style" className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-xs text-ink-700" defaultValue="p" onChange={(event) => runCommand("formatBlock", `<${event.target.value}>`)}>
            <option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option><option value="pre">Code</option>
          </select>
          <label className="sr-only" htmlFor={`${id}-font`}>Font family</label>
          <select id={`${id}-font`} title="Font family" className="h-8 max-w-36 rounded-lg border border-ink-200 bg-white px-2 text-xs text-ink-700" defaultValue="Arial" onChange={(event) => runCommand("fontName", event.target.value)}>
            <option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Tahoma">Tahoma</option><option value="Times New Roman">Times New Roman</option><option value="Trebuchet MS">Trebuchet MS</option><option value="Verdana">Verdana</option><option value="monospace">Monospace</option>
          </select>
          <label className="sr-only" htmlFor={`${id}-size`}>Font size</label>
          <select id={`${id}-size`} title="Font size" className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-xs text-ink-700" defaultValue="3" onChange={(event) => runCommand("fontSize", event.target.value)}>
            <option value="1">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="7">Extra large</option>
          </select>
          {policy && <>
            <label className="ml-1 flex items-center gap-1 text-[0.68rem] text-ink-600" title="Text color">Text <input type="color" aria-label="Text color" defaultValue={textColor} className="size-7 cursor-pointer rounded border border-ink-200 bg-white p-0.5" onMouseDown={rememberSelection} onChange={(event) => { setTextColor(event.target.value); runCommand("foreColor", event.target.value); }} /></label>
            <label className="flex items-center gap-1 text-[0.68rem] text-ink-600" title="Highlight color">Highlight <input type="color" aria-label="Highlight color" defaultValue={highlightColor} className="size-7 cursor-pointer rounded border border-ink-200 bg-white p-0.5" onMouseDown={rememberSelection} onChange={(event) => { setHighlightColor(event.target.value); runCommand("hiliteColor", event.target.value); }} /></label>
          </>}
        </div>
        <div className="flex flex-wrap items-center gap-1" aria-label="Alignment, spacing, lists, links, media, and history">
          <button type="button" aria-label="Align left" title="Align left" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("justifyLeft")}><AlignLeft className="size-4" /></button>
          <button type="button" aria-label="Align center" title="Align center" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("justifyCenter")}><AlignCenter className="size-4" /></button>
          <button type="button" aria-label="Align right" title="Align right" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("justifyRight")}><AlignRight className="size-4" /></button>
          <button type="button" aria-label="Justify" title="Justify" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("justifyFull")}><AlignJustify className="size-4" /></button>
          <button type="button" aria-label="Decrease indent" title="Decrease indent" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("outdent")}><Outdent className="size-4" /></button>
          <button type="button" aria-label="Increase indent" title="Increase indent" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("indent")}><Indent className="size-4" /></button>
          <span className="mx-1 h-6 border-l border-ink-300" aria-hidden />
          <button type="button" aria-label="Bulleted list" title="Bulleted list" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}><List className="size-4" /></button>
          <button type="button" aria-label="Numbered list" title="Numbered list" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}><ListOrdered className="size-4" /></button>
          {policy && <button type="button" aria-label="Remove list" title="Remove list" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={removeList}><ListX className="size-4" /></button>}
          <span className="mx-1 h-6 border-l border-ink-300" aria-hidden />
          <button type="button" aria-label="Insert link" title="Insert link" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={insertLink}><Link2 className="size-4" /></button>
          {policy && <>
            <button type="button" aria-label="Remove link" title="Remove link" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("unlink")}><Unlink className="size-4" /></button>
            <button type="button" aria-label="Insert image" title="Insert image" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={insertImage}><ImagePlus className="size-4" /></button>
            <button type="button" aria-label="Embed video" title="Embed YouTube/Vimeo video" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={insertVideo}><Video className="size-4" /></button>
            <button type="button" aria-label="Horizontal rule" title="Horizontal rule" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertHorizontalRule")}><Minus className="size-4" /></button>
            <span className="mx-1 h-6 border-l border-ink-300" aria-hidden />
            <button type="button" aria-label="Undo" title="Undo" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("undo")}><Undo2 className="size-4" /></button>
            <button type="button" aria-label="Redo" title="Redo" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("redo")}><Redo2 className="size-4" /></button>
            <button type="button" aria-label="Clear formatting" title="Clear formatting" className={buttonClass} onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("removeFormat")}><Eraser className="size-4" /></button>
          </>}
        </div>
      </div>
      <div
        ref={editorRef}
        id={id}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={name === "description" ? "Full product description" : name === "specs" ? "Product specifications" : "Policy content"}
        aria-multiline="true"
        className="prose prose-sm max-w-none px-3.5 py-3 text-[0.88rem] text-ink-800 outline-none [&_iframe]:my-3 [&_iframe]:aspect-video [&_iframe]:w-full [&_img]:my-2 [&_img]:max-h-96 [&_img]:max-w-full [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
        style={{ minHeight }}
        onInput={updateValue}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
      />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
