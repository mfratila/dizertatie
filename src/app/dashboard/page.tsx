import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const role = (session.user as any).role ?? "UNKNOWN";
    const userId = (session.user as any).id ?? "n/a";

    return (
        <main style = {{ padding: 16 }}>
            <h1>Dashboard (Protected)</h1>
            <p>Authenticated: yes</p>
            <p>User ID: {userId}</p>
            <p>Email: {session.user.email}</p>
            <p>Role: {role}</p>
        </main>
    );
}