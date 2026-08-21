import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Group Scheduler",
  description: "Schedule posts to your Facebook groups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
