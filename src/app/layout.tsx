import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Sidebar } from "./_components/sidebar";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "UNKNW PM",
  description: "Project Manager",
};

async function getPendingCount() {
  const [e, f] = await Promise.all([
    supabase.from("entries").select("id", { count: "exact", head: true }).in("status", ["pending", "submitted"]),
    supabase.from("fixed_costs").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return (e.count || 0) + (f.count || 0);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = (await cookies()).get("admin_auth")?.value === "1";
  const pending = isAdmin ? await getPendingCount() : 0;
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        {isAdmin && <Sidebar pendingCount={pending} />}
        <main style={{ flex: 1, marginLeft: isAdmin ? 200 : 0, padding: "32px 40px", minWidth: 0 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
