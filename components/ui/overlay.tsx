"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Shared behaviour: escape to close, scroll lock, focus management    */
/* ------------------------------------------------------------------ */

function useOverlay(open: boolean, onClose: () => void) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the panel for keyboard + screen-reader users.
    const focusTimer = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        "input:not([type=hidden]), select, textarea, button:not([data-close]), [href], [tabindex]:not([tabindex='-1'])",
      );
      focusable?.focus();
    }, 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  return panelRef;
}

function Backdrop({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-40 bg-ink-900/45 backdrop-blur-[2px] transition-opacity duration-250",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={onClose}
      aria-hidden
    />
  );
}

/* ------------------------------------------------------------------ */
/* Modal — centred on desktop, bottom sheet on phones                  */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const panelRef = useOverlay(open, onClose);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const widths = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl",
    xl: "sm:max-w-5xl",
  };

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50 flex items-end justify-center sm:items-center", !open && "pointer-events-none")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <Backdrop open={open} onClose={onClose} />
      <div
        ref={panelRef}
        className={cn(
          "relative z-50 flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl transition-all duration-250",
          "rounded-t-3xl sm:rounded-2xl",
          open ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:translate-y-0 sm:scale-95",
          widths[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
            <div>
              {title && <h2 className="text-fluid-lg font-bold">{title}</h2>}
              {description && <p className="mt-0.5 text-[0.83rem] text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              data-close
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 grid size-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              <X className="size-4.5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-ink-200 bg-ink-50 px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Drawer — slides from a screen edge                                  */
/* ------------------------------------------------------------------ */

export function Drawer({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  className,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right" | "bottom";
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: string;
}) {
  const panelRef = useOverlay(open, onClose);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const position =
    side === "bottom"
      ? cn(
          "inset-x-0 bottom-0 max-h-[90vh] w-full rounded-t-3xl",
          open ? "translate-y-0" : "translate-y-full",
        )
      : cn(
          "inset-y-0 w-[min(100%,22rem)]",
          width,
          side === "right" ? "right-0" : "left-0",
          open ? "translate-x-0" : side === "right" ? "translate-x-full" : "-translate-x-full",
        );

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50", !open && "pointer-events-none")}
      role="dialog"
      aria-modal={open || undefined}
      aria-hidden={!open}
      inert={!open}
      aria-label={title}
    >
      <Backdrop open={open} onClose={onClose} />
      <div
        ref={panelRef}
        className={cn(
          "absolute z-50 flex max-w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          position,
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-200 px-4 py-3.5 sm:px-5">
          <h2 className="text-fluid-lg font-bold">{title}</h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close panel"
            className="-mr-1 grid size-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="border-t border-ink-200 bg-ink-50 px-4 py-3.5 sm:px-5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Confirm dialog                                                      */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} fullWidth className="sm:w-auto">
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            fullWidth
            className="sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-[0.88rem] text-ink-600">
        This action takes effect immediately and cannot be undone.
      </p>
    </Modal>
  );
}
