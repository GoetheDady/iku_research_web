import type { Metadata, Viewport } from "next";
import { ResearchHistoryProvider } from "@/hooks/ResearchHistoryContext";
import "./globals.css";

let title = "湘信研读";
let description =
  "基于大语言模型的自主代理，可对任何主题进行本地和网络研究，并生成带有引用的综合报告。";
let url = "https://github.com/assafelovic/gpt-researcher";
let ogimage = "/favicon.ico";
let sitename = "湘信研读";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/deep_research_show/img/gptr-black-logo.png",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#111827',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html className="gptr-root" lang="zh" suppressHydrationWarning>
      <body
        className={`app-container flex min-h-screen flex-col justify-between`}
        suppressHydrationWarning
      >
        <ResearchHistoryProvider>
          {children}
        </ResearchHistoryProvider>
      </body>
    </html>
  );
}
