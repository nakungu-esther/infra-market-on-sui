import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { SuiProvider } from "@/providers/sui-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Sui Discovery - Infrastructure Service Discovery & Onchain Payments",
  description: "Discover, integrate, and pay for Sui blockchain infrastructure services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SuiProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
          <LiveChatWidget />
        </SuiProvider>
      </body>
    </html>
  );
}