import { requireAuth, Shell } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { saveAssistantNotesAction } from "@/app/actions/assistant";
import { loadAssistantNotes } from "@/lib/assistant-store";

export default async function AssistantNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  const notes = await loadAssistantNotes();

  return (
    <Shell title="Assistant notes" path="/assistant/notes" backHref="/assistant" backLabel="Assistant">
      {sp.saved ? <p className="flash-ok">Notes saved. The bot will use them on the next answer.</p> : null}
      <p className="muted" style={{ marginTop: 0, maxWidth: 640 }}>
        These notes are added to the LT22 manual for every answer. Use them for corrections and facts that are not in the PDF. Do not put technician function codes here.
      </p>
      <form action={saveAssistantNotesAction} className="card card-pad" style={{ maxWidth: 760 }}>
        <div className="field">
          <label htmlFor="notes">Notes (Markdown or plain text)</label>
          <textarea
            id="notes"
            name="notes"
            rows={18}
            defaultValue={notes.text}
            placeholder={"Example:\n- If the visitor asks about BACnet address range, explain…\n"}
            style={{ minHeight: "22rem", fontFamily: "var(--mono)" }}
          />
          <p className="field-hint">
            Last saved: {notes.updatedAt ? new Date(notes.updatedAt).toLocaleString("he-IL", { hour12: false }) : "never"}
          </p>
        </div>
        <div className="form-actions">
          <SubmitButton pendingLabel="Saving…">Save notes</SubmitButton>
        </div>
      </form>
    </Shell>
  );
}
