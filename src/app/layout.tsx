import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "智能记账",
  description: "管理您的收支，掌握财务动向",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
