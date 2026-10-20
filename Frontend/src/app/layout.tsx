import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glossia Analytics",
  description: "Usage and conversion analytics for Glossia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
