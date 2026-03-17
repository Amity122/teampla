import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Teampla",
  description: "Intelligent IT team formation — balanced, fair, and workload-aware.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 pl-16">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
