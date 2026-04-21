"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";

const NAV = [
  { href: "/", label: "CLIENTS", num: "001" },
  { href: "/approvals", label: "APPROVALS", num: "002" },
  { href: "/settings", label: "SETTINGS", num: "003" },
];

export function Sidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  if (pathname === "/login" || /^\/team\/[^/]+\/login$/.test(pathname || "")) {
    return null;
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/clients");
    return pathname.startsWith(href);
  }

  return (
    <div
      style={{
        width: 200,
        background: "var(--s1)",
        borderRight: "1px solid var(--s2)",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "28px 20px 32px", borderBottom: "1px solid var(--s2)" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "0.2em",
            color: "var(--accent)",
          }}
        >
          UNKNW
        </div>
        <div
          style={{
            fontSize: 9,
            color: "var(--s3)",
            letterSpacing: "0.2em",
            marginTop: 4,
          }}
        >
          PM
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {NAV.map(function (n) {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 20px",
                color: active ? "var(--fg)" : "var(--s4)",
                background: active ? "rgba(255,255,255,.04)" : "transparent",
                borderLeft: active
                  ? "3px solid var(--accent)"
                  : "3px solid transparent",
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: active ? "var(--accent)" : "var(--s3)",
                  minWidth: 24,
                }}
              >
                {n.num}
              </span>
              {n.label}
              {n.href === "/approvals" && pendingCount > 0 && (
                <span
                  style={{
                    marginLeft: 8,
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 9,
                    background: "var(--red, #f66)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--s2)",
          fontSize: 11,
          color: "var(--s3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            AS{" "}
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>SERGE</span>
          </span>
          <button
            onClick={() => logout()}
            style={{
              background: "none",
              border: "none",
              color: "var(--s4)",
              fontSize: 10,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
