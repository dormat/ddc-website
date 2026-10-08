import { redirect } from "next/navigation";
import { GoogleSignIn } from "@/components/google-sign-in";
import { firebaseWebConfig, isLoggedIn } from "@/lib/auth";

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/");

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>DDC Admin</h1>
        <p>Sign in with an invited Google account to manage the website, assistant, and clients.</p>
        <GoogleSignIn config={firebaseWebConfig()} />
      </div>
    </div>
  );
}
