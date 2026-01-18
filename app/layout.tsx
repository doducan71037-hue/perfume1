import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteLayout } from "@/components/ui/site-layout";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AI 香水导购 - 通过对话找到心仪的香水",
  description: "通过对话了解您的香水偏好，为您推荐最合适的香水。即使附近没有实体店，也能找到心仪的香味。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
