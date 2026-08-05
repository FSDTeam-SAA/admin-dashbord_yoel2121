"use client";

import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QueryError({
  title = "We couldn't load this data",
  message = "Check the connection and try again.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/70 px-6 py-10 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-700">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  message = "New records will appear here when they become available.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-slate-600">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">{message}</p>
    </div>
  );
}
