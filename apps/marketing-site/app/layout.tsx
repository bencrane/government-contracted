import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Fraunces } from "next/font/google";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "Government Contracted — The Dashboard for Federal Contractors",
  description:
    "Live SAM.gov profile, active awards, and quotes on surety bonds, working capital, vendor programs, equipment, and compliance — for registered federal contractors.",
  metadataBase: new URL("https://governmentcontracted.com"),
  openGraph: {
    title: "Government Contracted",
    description:
      "The dashboard for federal contractors. Live SAM.gov profile, awards history, surety, capital, vendor programs, equipment, and compliance.",
    url: "https://governmentcontracted.com",
    siteName: "Government Contracted",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
