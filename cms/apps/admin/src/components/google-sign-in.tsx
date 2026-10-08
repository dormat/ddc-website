"use client";

import { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { loginWithGoogleAction } from "@/app/actions/auth";

type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export function GoogleSignIn({ config }: { config: FirebaseWebConfig | null }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn() {
    if (!config) return;
    setError("");
    setPending(true);
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(config);
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      const login = await loginWithGoogleAction(idToken);
      if (!login.ok) {
        if (login.error === "not_invited") {
          setError("This Google account is not invited. Ask an owner to add your email.");
        } else {
          setError("Google sign-in could not be verified. Try again.");
        }
        setPending(false);
        return;
      }
      window.location.assign("/");
    } catch (err) {
      console.warn(err);
      setError("Google sign-in was cancelled or failed.");
      setPending(false);
    }
  }

  if (!config) {
    return (
      <div className="error">
        Google sign-in is not configured. Set the Firebase web app keys in the admin environment.
      </div>
    );
  }

  return (
    <div>
      {error ? <div className="error">{error}</div> : null}
      <button type="button" className="btn primary" style={{ width: "100%" }} onClick={signIn} disabled={pending}>
        {pending ? "Signing in…" : "Sign in with Google"}
      </button>
    </div>
  );
}
