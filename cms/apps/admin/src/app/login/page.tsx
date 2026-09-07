import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isLoggedIn()) redirect("/");
  const params = await searchParams;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1>DDC Admin</h1>
        <p>Sign in to manage products, solutions, and site content.</p>
        {params.error ? <div className="error">Invalid username or password.</div> : null}
        <form action={loginAction}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn primary" type="submit" style={{ width: "100%" }}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
