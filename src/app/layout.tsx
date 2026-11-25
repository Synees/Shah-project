import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  display: "swap",
});

const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pinyon-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shah Project",
  description:
    "Layanan pembuatan mahar pernikahan dan sewa/hias boks seserahan eksklusif dengan sentuhan artistik modern.",
  icons: {
    icon: "/images/logo-shah.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased font-sans",
        plusJakartaSans.variable,
        cormorantGaramond.variable,
        pinyonScript.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
