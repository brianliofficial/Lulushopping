import type { Metadata } from "next";
import { Fredoka, Noto_Sans_TC } from "next/font/google";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/SkipLink";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["600", "700"],
});

const notoSansTc = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "LULU · Shop",
  description: "Taiwan handmade meals — Love it · Eat it",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      suppressHydrationWarning
      className={`${fredoka.variable} ${notoSansTc.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-lulu-bg font-sans text-white">
        <Providers>
          <SkipLink />
          {children}
        </Providers>
      </body>
    </html>
  );
}
