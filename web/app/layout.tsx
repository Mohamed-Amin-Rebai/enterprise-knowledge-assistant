import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enterprise Knowledge Assistant",
  description: "Grounded answers from your internal knowledge",
  icons: {
      icon: "/favicon.jpg", // 7otha fi public wfi app
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
            <body>
                {children}
                <Toaster position="top-right" richColors closeButton />
            </body>
        </html>
    </ClerkProvider>
    
  );
}
