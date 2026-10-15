import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "h1", "h2", "h3", "h4", "blockquote", "pre", "code", "div", "span",
  "ul", "ol", "li", "hr", "a", "img", "iframe",
];

const SAFE_COLOR = /^(#[\da-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|[a-z]{3,20})$/i;

export function sanitizeRichTextHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      iframe: ["src", "title", "width", "height", "allow", "allowfullscreen"],
      font: ["size"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: [SAFE_COLOR],
        "background-color": [SAFE_COLOR],
        "text-align": [/^(left|center|right|justify)$/],
        "font-size": [/^(?:[8-9]|[1-6]\d|7[0-2])px$/, /^(?:[5-9]\d|[1-2]\d{2}|300)%$/],
        "font-family": [/^(?:Arial|Georgia|Tahoma|Times New Roman|Trebuchet MS|Verdana|monospace|sans-serif|serif)(?:,\s*(?:Arial|Georgia|Tahoma|Times New Roman|Trebuchet MS|Verdana|monospace|sans-serif|serif))*$/i],
      },
    },
    disallowedTagsMode: "discard",
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    allowedSchemesByTag: {
      img: ["https"],
      iframe: ["https"],
    },
    allowedIframeHostnames: [
      "www.youtube-nocookie.com",
      "www.youtube.com",
      "player.vimeo.com",
    ],
    transformTags: {
      b: "strong",
      i: "em",
      a: (_tagName, attributes) => ({
        tagName: "a",
        attribs: {
          ...attributes,
          ...(attributes.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  });
}

export function richTextPlainText(value: string): string {
  return sanitizeRichTextHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&(?:amp|lt|gt|quot|#39);/gi, "x")
    .trim();
}

export function storedTextToRichHtml(value: string): string {
  if (/<(?:p|br|strong|b|em|i|u|s|sub|sup|h[1-4]|blockquote|pre|code|div|span|ul|ol|li|hr|a|img|iframe)(?:\s|>|\/)/i.test(value)) {
    return sanitizeRichTextHtml(value);
  }

  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
