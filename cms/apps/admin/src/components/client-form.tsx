import type { AdminMember } from "@/lib/member-access";
import { CLIENT_STAGES, STAGE_LABELS, type CrmClient } from "@/lib/crm-store";

export function ClientForm({
  action,
  client,
  members,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  client?: CrmClient | null;
  members: AdminMember[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="card card-pad stack-form" style={{ maxWidth: 640 }}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={client?.name || ""} />
      </div>
      <div className="field">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" defaultValue={client?.company || ""} />
      </div>
      <div className="split-fields">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={client?.email || ""} />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={client?.phone || ""} />
        </div>
      </div>
      <div className="split-fields">
        <div className="field">
          <label htmlFor="stage">Stage</label>
          <select id="stage" name="stage" defaultValue={client?.stage || "new"}>
            {CLIENT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ownerMemberId">Owner</label>
          <select id="ownerMemberId" name="ownerMemberId" defaultValue={client?.ownerMemberId || ""}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="nextFollowUp">Next follow-up</label>
        <input id="nextFollowUp" name="nextFollowUp" type="date" defaultValue={client?.nextFollowUp || ""} />
      </div>
      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={4} defaultValue={client?.notes || ""} />
      </div>
      <button className="btn primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
