import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { Sidebar } from "./_components/sidebar";
import { supabase } from "@/lib/supabase";
import { logout } from "./actions";

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
  const pathname = (await headers()).get("x-pathname") || "";
  const isReport = pathname.startsWith("/r/");
  const jar = await cookies();
  const adminAuth = jar.get("admin_auth")?.value;
  const isAdmin = adminAuth === "1";
  const isViewer = adminAuth === "viewer";
  const hasAdminUI = isAdmin || isViewer;
  const pending = isAdmin && !isReport ? await getPendingCount() : 0;
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={isViewer ? "viewer" : ""}
        style={isReport
          ? { margin: 0, fontFamily: "'Inter', sans-serif" }
          : { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}
      >
        {isReport ? (
          children
        ) : (
          <>
            {hasAdminUI && <Sidebar pendingCount={pending} role={isViewer ? "viewer" : "admin"} />}
            <main style={{ flex: 1, marginLeft: hasAdminUI ? 200 : 0, padding: "32px 40px", minWidth: 0 }}>
              {isViewer && (
                <div style={{
                  background: "var(--purple-dim)", color: "var(--purple)",
                  padding: "8px 14px", fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: 20, display: "flex", justifyContent: "space-between",
                }}>
                  <span>Viewer mode — read-only</span>
                  <form action={logout}>
                    <button className="safe" type="submit" style={{ color: "var(--purple)", background: "none", border: "none", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>
                      Sign out
                    </button>
                  </form>
                </div>
              )}
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  );
}
