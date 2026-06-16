"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(total, page * perPage);

  return (
    <div className="flex flex-col gap-4 pt-4 text-sm text-[#666] sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {start} to {end} of {total} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" className="bg-primary text-white">
          {page}
        </Button>
        {totalPages > 2 && (
          <Button type="button" variant="outline" size="icon" disabled>
            ...
          </Button>
        )}
        {totalPages > 1 && (
          <Button type="button" variant="outline" size="icon" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
