"use client";

import type { FormEvent, ReactNode } from "react";
import { SubmitButton } from "@/components/submit-button";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  children: ReactNode;
  hiddenFields: Record<string, string>;
  pendingLabel?: string;
  className?: string;
  buttonClassName?: string;
  inline?: boolean;
};

export function ConfirmDeleteForm({
  action,
  confirmMessage,
  children,
  hiddenFields,
  pendingLabel = "Deleting…",
  className = "form-danger",
  buttonClassName = "btn danger",
  inline = false,
}: Props) {
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    if (!confirm(confirmMessage)) {
      e.preventDefault();
    }
  }

  return (
    <form
      action={action}
      className={inline ? undefined : className}
      style={inline ? { display: "inline" } : undefined}
      onSubmit={onSubmit}
    >
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton className={buttonClassName} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
    </form>
  );
}
