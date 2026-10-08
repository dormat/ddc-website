import { removeMemberAction, updateMemberAction } from "@/app/actions/members";
import { MemberInviteForm } from "@/components/member-invite-form";
import { SubmitButton } from "@/components/submit-button";
import { requireOwner } from "@/components/shell-auth";
import { Shell } from "@/components/shell";
import { ensureSeedMembers, listMembers } from "@/lib/members-store";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; removed?: string; error?: string }>;
}) {
  await requireOwner();
  const sp = await searchParams;
  await ensureSeedMembers();
  const members = await listMembers();

  return (
    <Shell title="Members">
      {sp.saved ? <p className="flash-ok">Saved.</p> : null}
      {sp.removed ? <p className="flash-ok">Member removed.</p> : null}
      {sp.error ? <p className="error">{sp.error}</p> : null}
      <p className="muted" style={{ marginTop: 0 }}>
        Only invited Google accounts can sign in. Admins add people here and choose Website, Assistant, and Clients for each one.
      </p>
      <MemberInviteForm />
      <div className="card" style={{ marginTop: "1rem" }}>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Access</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <strong>{member.name || member.email}</strong>
                  {member.name ? <div className="muted">{member.email}</div> : null}
                </td>
                <td>
                  <form action={updateMemberAction} className="member-access">
                    <input type="hidden" name="email" value={member.email} />
                    <label className="check-row">
                      <input type="checkbox" name="owner" defaultChecked={member.owner} />
                      Admin
                    </label>
                    <label className="check-row">
                      <input type="checkbox" name="website" defaultChecked={member.owner || member.website} />
                      Website
                    </label>
                    <label className="check-row">
                      <input type="checkbox" name="assistant" defaultChecked={member.owner || member.assistant} />
                      Assistant
                    </label>
                    <label className="check-row">
                      <input type="checkbox" name="clients" defaultChecked={member.owner || member.clients} />
                      Clients
                    </label>
                    <SubmitButton className="btn" pendingLabel="Saving…">
                      Save
                    </SubmitButton>
                  </form>
                </td>
                <td>
                  <form action={removeMemberAction}>
                    <input type="hidden" name="email" value={member.email} />
                    <SubmitButton className="btn danger" pendingLabel="Removing…">
                      Remove
                    </SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {!members.length ? (
              <tr>
                <td colSpan={3} className="muted">
                  No members yet. The owner email signs in once to create the first account.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
