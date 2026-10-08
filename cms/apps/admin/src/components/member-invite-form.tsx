"use client";

import { useState } from "react";
import { inviteMemberAction } from "@/app/actions/members";
import { SubmitButton } from "@/components/submit-button";
import { ACCESS_PRESETS } from "@/lib/member-access";

export function MemberInviteForm() {
  const [access, setAccess] = useState({
    owner: false,
    website: true,
    assistant: false,
    clients: false,
  });

  function applyPreset(key: keyof typeof ACCESS_PRESETS) {
    setAccess(ACCESS_PRESETS[key]);
  }

  return (
    <form action={inviteMemberAction} className="card card-pad stack-form">
      <h3>Invite</h3>
      <div className="preset-row">
        <button type="button" className="btn" onClick={() => applyPreset("website")}>
          Website
        </button>
        <button type="button" className="btn" onClick={() => applyPreset("assistant")}>
          Assistant
        </button>
        <button type="button" className="btn" onClick={() => applyPreset("sales")}>
          Sales
        </button>
        <button type="button" className="btn" onClick={() => applyPreset("all")}>
          All
        </button>
      </div>
      <div className="field">
        <label htmlFor="invite-email">Google email</label>
        <input id="invite-email" name="email" type="email" required placeholder="name@company.com" />
      </div>
      <div className="field">
        <label htmlFor="invite-name">Name</label>
        <input id="invite-name" name="name" placeholder="Optional" />
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          name="owner"
          checked={access.owner}
          onChange={(event) => setAccess((prev) => ({ ...prev, owner: event.target.checked }))}
        />
        Admin (can add and change users, and has every area)
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          name="website"
          checked={access.owner || access.website}
          disabled={access.owner}
          onChange={(event) => setAccess((prev) => ({ ...prev, website: event.target.checked }))}
        />
        Website
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          name="assistant"
          checked={access.owner || access.assistant}
          disabled={access.owner}
          onChange={(event) => setAccess((prev) => ({ ...prev, assistant: event.target.checked }))}
        />
        Assistant
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          name="clients"
          checked={access.owner || access.clients}
          disabled={access.owner}
          onChange={(event) => setAccess((prev) => ({ ...prev, clients: event.target.checked }))}
        />
        Clients
      </label>
      <SubmitButton className="btn primary" pendingLabel="Inviting…">
        Invite
      </SubmitButton>
    </form>
  );
}
