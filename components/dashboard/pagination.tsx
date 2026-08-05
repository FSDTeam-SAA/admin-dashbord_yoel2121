"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function getPageItems(page: number, totalPages: number) {
  const candidates = [1, page - 1, page, page + 1, totalPages]
    .filter((item) => item >= 1 && item <= totalPages)
    .filter((item, index, values) => values.indexOf(item) === index)
    .sort((first, second) => first - second);

  const items: Array<number | "ellipsis"> = [];
  candidates.forEach((item, index) => {
    const previous = candidates[index - 1];
    if (previous && item - previous > 1) items.push("ellipsis");
    items.push(item);
  });
  return items;
}

export function Pagination({
  page,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const end = Math.min(total, safePage * perPage);
  const items = getPageItems(safePage, totalPages);

  return (
    <div className="flex flex-col gap-4 pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite">
        Showing {start}–{end} of {total} {total === 1 ? "result" : "results"}
      </p>
      {totalPages > 1 ? (
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="inline-flex h-10 min-w-8 items-center justify-center text-slate-500" aria-hidden="true">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === safePage ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === safePage ? "page" : undefined}
              >
                {item}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
