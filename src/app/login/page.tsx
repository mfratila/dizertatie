"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

function mapAuthError(error?: string | null) {
  // NextAuth folosește param `error` în query string pe redirect
  // Pentru Credentials e frecvent: "CredentialsSignin"
  if (!error) return null;
  if (error === "CredentialsSignin") return "Email sau parola incorecte.";
  return "Autentificarea a esuat. Incearca din nou.";
}

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorMsg = useMemo(() => mapAuthError(searchParams.get("error")), [searchParams]);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLocalError(null);

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !normalizedEmail.includes("@")) {
            setLocalError("Introdu un email valid.");
            return;
        }

        if (!password || password.length < 3) {
            setLocalError("Introdu parola.");
            return;
        }

        setLoading(true);
        const res = await signIn("credentials", {
            email: normalizedEmail,
            password,
            redirect: false,
            callbackUrl: "/dashboard",
        });
        setLoading(false);

        if (!res) {
            setLocalError("Autentificarea a esuat. Incearca din nou.");
            return;
        }
        if (res.error) {
            setLocalError(mapAuthError(res.error) ?? "Autentificarea a esuat");
            return;
        }

        router.push(res.url ?? "/dashboard");
    }

    return (
        <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
            <h1>Login</h1>

            {(errorMsg || localError) && (
                <p style={{ color: "crimson" }}>{localError ?? errorMsg}</p>
            )}

            <form onSubmit={onSubmit}>

                <label style={{ display: "block", marginTop: 12 }}>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        style={{ width: "100%", padding: 8, marginTop: 6 }}
                    />
                </label>

                <label style={{ display: "block", marginTop: 12 }}>
                    Parola
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        style={{ width: "100%", padding: 8, marginTop: 6 }}
                    />
                </label>

                <button type="submit" disabled={loading} style={{ marginTop: 16, padding: 10, width: "100%" }}>
                    {loading ? "Se autentifica..." : "Autentificare"}
                </button>
            </form>
        </main>
    )
}