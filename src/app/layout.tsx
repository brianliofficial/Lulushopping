import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fredoka, Noto_Sans_TC } from "next/font/google";
import { Providers } from "@/components/providers";
import { SkipLink } from "@/components/SkipLink";
import { LOCALE_COOKIE, parseLocaleCookie } from "@/i18n/translate";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jar = await cookies();
  const initialLocale = parseLocaleCookie(
    jar.get(LOCALE_COOKIE)?.value ?? undefined,
  );
  const htmlLang = initialLocale === "en" ? "en" : "zh-Hant";

  return (
    <html
      lang={htmlLang}
      suppressHydrationWarning
      className={`${fredoka.variable} ${notoSansTc.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-lulu-bg font-sans text-white">
        <Providers initialLocale={initialLocale}>
          <SkipLink />
          {children}
        </Providers>
      </body>
    </html>
  );
}
