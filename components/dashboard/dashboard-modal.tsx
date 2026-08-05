"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function DashboardModal({
  open,
  title,
  description,
  children,
  busy = false,
  onClose,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  busy?: boolean;
  onClose: () => void;
  maxWidth?: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 px-4 py-6 backdrop-blur-sm sm:py-10">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={busy ? undefined : onClose}
        aria-label="Close dialog"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative my-auto w-full ${maxWidth} rounded-2xl border border-white/70 bg-white p-5 shadow-2xl outline-none sm:p-7`}
      >
        <div className="mb-6 flex items-start justify-between gap-5 pr-1">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-slate-950 sm:text-2xl">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1.5 max-w-xl text-sm text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
