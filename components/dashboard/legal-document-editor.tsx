"use client";

import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bold,
  Clock3,
  Eye,
  FileText,
  Heading1,
  Heading2,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  getApiMessage,
  getLegalDocument,
  type LegalDocument,
  type LegalDocumentType,
  updateLegalDocument,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { QueryError } from "@/components/dashboard/query-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const MAX_CONTENT_LENGTH = 100000;

type EditorAction =
  | "heading-1"
  | "heading-2"
  | "bold"
  | "italic"
  | "bullet-list"
  | "numbered-list"
  | "quote"
  | "link";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "numbered-list"; items: string[] }
  | { type: "quote"; text: string };

const editorTools: Array<{
  action: EditorAction;
  label: string;
  icon: typeof Bold;
}> = [
  { action: "heading-1", label: "Heading 1", icon: Heading1 },
  { action: "heading-2", label: "Heading 2", icon: Heading2 },
  { action: "bold", label: "Bold", icon: Bold },
  { action: "italic", label: "Italic", icon: Italic },
  { action: "bullet-list", label: "Bullet list", icon: List },
  { action: "numbered-list", label: "Numbered list", icon: ListOrdered },
  { action: "quote", label: "Quote", icon: Quote },
  { action: "link", label: "Link", icon: Link },
];

export function LegalDocumentEditor({
  type,
  heading,
  description,
}: {
  type: LegalDocumentType;
  heading: string;
  description: string;
}) {
  const documentQuery = useQuery({
    queryKey: ["admin-legal-document", type],
    queryFn: async () => (await getLegalDocument(type)).data,
  });

  if (documentQuery.isLoading) return <LegalDocumentSkeleton heading={heading} />;
  if (documentQuery.isError || !documentQuery.data) {
    return (
      <section className="mx-auto max-w-7xl">
        <QueryError
          title={`Couldn't load ${heading.toLowerCase()}`}
          onRetry={() => documentQuery.refetch()}
        />
      </section>
    );
  }

  return (
    <LoadedLegalDocumentEditor
      key={`${type}:${documentQuery.data.updatedAt || "draft"}`}
      type={type}
      heading={heading}
      description={description}
      document={documentQuery.data}
    />
  );
}

function LoadedLegalDocumentEditor({
  type,
  heading,
  description,
  document,
}: {
  type: LegalDocumentType;
  heading: string;
  description: string;
  document: LegalDocument;
}) {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const dirty = title !== document.title || content !== document.content;
  const previewBlocks = useMemo(() => parseMarkdownBlocks(trimmedContent), [trimmedContent]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateLegalDocument(type, {
        title: trimmedTitle,
        content: trimmedContent,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(["admin-legal-document", type], response.data);
      toast.success(response.message);
    },
    onError: (error) => toast.error(getApiMessage(error)),
  });

  function resetForm() {
    setTitle(document.title);
    setContent(document.content);
  }

  function updateContent(nextContent: string, nextSelectionStart?: number, nextSelectionEnd?: number) {
    setContent(nextContent.slice(0, MAX_CONTENT_LENGTH));

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      if (nextSelectionStart !== undefined) {
        textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd ?? nextSelectionStart);
      }
    });
  }

  function replaceSelection(replacement: string, selectionStart: number, selectionEnd: number) {
    const nextContent = `${content.slice(0, selectionStart)}${replacement}${content.slice(selectionEnd)}`;
    updateContent(nextContent, selectionStart, selectionStart + replacement.length);
  }

  function wrapSelection(prefix: string, suffix: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selected = content.slice(selectionStart, selectionEnd) || fallback;
    const replacement = `${prefix}${selected}${suffix}`;
    const nextContent = `${content.slice(0, selectionStart)}${replacement}${content.slice(selectionEnd)}`;
    updateContent(nextContent, selectionStart + prefix.length, selectionStart + prefix.length + selected.length);
  }

  function formatSelectedLines(formatLine: (line: string, index: number) => string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selected = content.slice(selectionStart, selectionEnd) || fallback;
    const replacement = selected
      .split("\n")
      .map((line, index) => formatLine(line || fallback, index))
      .join("\n");

    replaceSelection(replacement, selectionStart, selectionEnd);
  }

  function applyEditorAction(action: EditorAction) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (action === "bold") {
      wrapSelection("**", "**", "bold text");
      return;
    }

    if (action === "italic") {
      wrapSelection("_", "_", "italic text");
      return;
    }

    if (action === "link") {
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const selected = content.slice(selectionStart, selectionEnd) || "link text";
      const replacement = `[${selected}](https://example.com)`;
      const nextContent = `${content.slice(0, selectionStart)}${replacement}${content.slice(selectionEnd)}`;
      updateContent(nextContent, selectionStart + 1, selectionStart + 1 + selected.length);
      return;
    }

    if (action === "heading-1") {
      formatSelectedLines((line) => `# ${line.replace(/^#{1,6}\s+/, "")}`, "Main section");
      return;
    }

    if (action === "heading-2") {
      formatSelectedLines((line) => `## ${line.replace(/^#{1,6}\s+/, "")}`, "Section title");
      return;
    }

    if (action === "bullet-list") {
      formatSelectedLines((line) => `- ${line.replace(/^[-*]\s+/, "")}`, "List item");
      return;
    }

    if (action === "numbered-list") {
      formatSelectedLines((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s+/, "")}`, "List item");
      return;
    }

    if (action === "quote") {
      formatSelectedLines((line) => `> ${line.replace(/^>\s+/, "")}`, "Quoted text");
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle || !trimmedContent) {
      toast.error("Title and content are required");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Legal content</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{heading}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          <span className="rounded-full bg-slate-200 px-3 py-1.5">Version {document.version}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-blue-800">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {document.updatedAt ? `Updated ${formatDate(document.updatedAt)}` : "Not published"}
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card>
          <CardContent className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-950">Document editor</h2>
                <p className="text-sm text-slate-600">Saving publishes the latest version immediately.</p>
              </div>
            </div>

            <div className="mt-7">
              <label htmlFor={`${type}-title`} className="text-sm font-semibold text-slate-800">
                Document title
              </label>
              <Input
                id={`${type}-title`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                className="mt-2"
              />
            </div>

            <div className="mt-5">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={`${type}-content`} className="text-sm font-semibold text-slate-800">
                  Content
                </label>
                <span className="text-xs tabular-nums text-slate-500">
                  {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-[#b9c7d6] bg-slate-50 p-2">
                {editorTools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <button
                      key={tool.action}
                      type="button"
                      onClick={() => applyEditorAction(tool.action)}
                      title={tool.label}
                      aria-label={tool.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3]"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
              <Textarea
                ref={textareaRef}
                id={`${type}-content`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={MAX_CONTENT_LENGTH}
                required
                rows={22}
                placeholder={`Write the ${heading.toLowerCase()} here...`}
                className="min-h-[480px] rounded-t-none border-t-slate-200 font-mono leading-7"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Supports headings, bold, italic, lists, quotes, and links. Content is saved as markdown text.
              </p>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={resetForm} disabled={!dirty || saveMutation.isPending}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset changes
              </Button>
              <Button
                type="submit"
                disabled={!dirty || !trimmedTitle || !trimmedContent || saveMutation.isPending}
                aria-busy={saveMutation.isPending}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saveMutation.isPending ? "Publishing..." : "Save & publish"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-[124px] xl:self-start">
          <CardContent className="p-5 sm:p-7">
            <div className="flex items-center gap-2 text-primary">
              <Eye className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-950">Preview</h2>
            </div>
            <div className="mt-5 max-h-[680px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <h3 className="break-words text-2xl font-bold text-slate-950">{trimmedTitle || heading}</h3>
              {previewBlocks.length ? (
                <div className="mt-5 space-y-4 break-words text-sm leading-7 text-slate-700">
                  {previewBlocks.map((block, index) => (
                    <MarkdownBlockView key={`${block.type}:${index}`} block={block} />
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm italic text-slate-500">Your document preview will appear here.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </section>
  );
}

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const headingClassName =
      block.level === 1
        ? "text-xl font-bold text-slate-950"
        : block.level === 2
          ? "text-lg font-bold text-slate-900"
          : "text-base font-bold text-slate-900";

    if (block.level === 1) return <h4 className={headingClassName}>{renderInlineMarkdown(block.text)}</h4>;
    if (block.level === 2) return <h5 className={headingClassName}>{renderInlineMarkdown(block.text)}</h5>;
    return <h6 className={headingClassName}>{renderInlineMarkdown(block.text)}</h6>;
  }

  if (block.type === "bullet-list") {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {block.items.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "numbered-list") {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        {block.items.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </ol>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-slate-600">
        {renderInlineMarkdown(block.text)}
      </blockquote>
    );
  }

  return <p>{renderInlineMarkdown(block.text)}</p>;
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2],
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "bullet-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "numbered-list", items });
      continue;
    }

    if (/^>\s+/.test(line)) {
      const quotes: string[] = [];
      while (index < lines.length && /^>\s+/.test(lines[index].trim())) {
        quotes.push(lines[index].trim().replace(/^>\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", text: quotes.join(" ") });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);

  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (/^_[^_]+_$/.test(part)) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {link[1]}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function LegalDocumentSkeleton({ heading }: { heading: string }) {
  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="mb-7 text-3xl font-bold text-slate-950">{heading}</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[680px] w-full rounded-2xl" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    </section>
  );
}
