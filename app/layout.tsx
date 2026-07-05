import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Booty Pacman",
  description: "The classic arcade game gets a cheeky makeover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" style={{ ["--font-sans" as string]: "Inter, system-ui, sans-serif" }}>
      <body>{children}</body>
    </html>
  );
}