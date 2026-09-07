import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme";

export const metadata: Metadata = {
  title: "CrewOS — Hire AI employees, not freelancers",
  description:
    "CrewOS is the operating system for your AI workforce. Outreach, content, and proposal agents that work every day for less than a freelancer's day rate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="bg-white text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
