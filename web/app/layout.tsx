import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Enterprise Knowledge Assistant",
    template: "%s | Enterprise Knowledge Assistant"
  },
  description: "Grounded answers from your internal knowledge base",
  icons: {
    icon: "/favicon.jpg",
  },
  keywords: ["knowledge base", "enterprise", "AI assistant", "internal knowledge"],
  authors: [{ name: "Enterprise Knowledge Assistant" }],
  openGraph: {
    title: "Enterprise Knowledge Assistant",
    description: "Grounded answers from your internal knowledge base",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider 
      appearance={{
        elements: {
          formButtonPrimary: 
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg hover:shadow-violet-500/30",
          footerActionLink: 
            "text-violet-600 hover:text-indigo-600 transition-colors",
        }
      }}
    >
      <html lang="en" suppressHydrationWarning className={inter.variable} data-scroll-behavior="smooth">
        <body className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 antialiased">
          <div className="relative min-h-screen">
            {children}
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              toastOptions={{
                className: "font-inter",
                duration: 4000,
              }}
            />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}