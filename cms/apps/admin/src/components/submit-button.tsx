"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "btn primary",
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  const busy = pending || disabled;

  return (
    <button type="submit" className={className} disabled={busy} aria-busy={pending} {...rest}>
      {pending ? (
        <span className="btn-pending">
          <span className="btn-spinner" aria-hidden />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
