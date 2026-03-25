import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movie Watch Party",
  description: "Watch movies together with friends in real-time",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
