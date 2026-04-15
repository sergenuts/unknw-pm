import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "./_components/sidebar";

export const metadata: Metadata = {
  title: "UNKNW PM",
  description: "Project Manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 200, padding: "32px 40px", minWidth: 0 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
