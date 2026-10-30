import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://leadportal.ibrasoft.com"),
  title: {
    default: "IbraSoft Leads Portal",
    template: "%s | IbraSoft Leads Portal",
  },
  description: "Enterprise multi-tenant lead management platform and real-time webhook ingestion engine by IbraSoft.",
  keywords: [
    "IbraSoft",
    "IbraSoft Leads Portal",
    "Lead Management SaaS",
    "Multi-Tenant Lead System",
    "Webhook Ingestion Engine",
    "Real-time Lead Routing",
    "ACA Insurance Leads",
    "Auto Insurance Leads",
    "MVA Leads",
  ],
  authors: [{ name: "IbraSoft Development Team", url: "http://ibrasoft.com/" }],
  creator: "IbraSoft",
  publisher: "IbraSoft",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://leadportal.ibrasoft.com",
    siteName: "IbraSoft Leads Portal",
    title: "IbraSoft Leads Portal",
    description: "Enterprise multi-tenant lead management platform and real-time webhook ingestion engine by IbraSoft.",
    images: [
      {
        url: "/ibrasoft-full-logo.svg",
        width: 1200,
        height: 630,
        alt: "IbraSoft Leads Portal Brand Artwork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IbraSoft Leads Portal",
    description: "Enterprise multi-tenant lead management platform and real-time webhook ingestion engine by IbraSoft.",
    images: ["/ibrasoft-full-logo.svg"],
    creator: "@IbraSoft",
  },
  alternates: {
    canonical: "https://leadportal.ibrasoft.com",
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col font-sans">{children}</body>
    </html>
  );
}
