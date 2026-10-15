import { storedTextToRichHtml } from "@/lib/rich-text";

export function PolicyText({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm mt-8 max-w-none text-ink-600 [&_a]:font-semibold [&_a]:text-brand-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-brand-300 [&_blockquote]:pl-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_iframe]:my-5 [&_iframe]:aspect-video [&_iframe]:w-full [&_img]:my-4 [&_img]:max-h-[32rem] [&_img]:max-w-full [&_img]:object-contain [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: storedTextToRichHtml(content) }}
    >
    </div>
  );
}
