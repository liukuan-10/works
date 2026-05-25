import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "智能记账 - Smart Accounting",
  description: "智能记账软件，轻松管理个人财务",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=1200, initial-scale=1" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              transform: translateZ(0);
              -webkit-transform: translateZ(0);
            }
            @media screen and (-webkit-min-device-pixel-ratio: 1.25) {
              html { zoom: 1; }
            }
            @media screen and (-webkit-min-device-pixel-ratio: 1.5) {
              html { zoom: 1; }
            }
            @media screen and (-webkit-min-device-pixel-ratio: 2) {
              html { zoom: 1; }
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
