import type { Metadata } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

// Playfair Display — elegant serif for headings/display text
const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Poppins — clean sans-serif for body/normal text
const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bangla Bazar - Bangladesh's Favorite Online Store",
    template: "%s | Bangla Bazar",
  },
  description:
    "Shop Sharee, Punjabi, Shoes, Electronics and more from Bangladesh's trusted online marketplace. Best prices with fast delivery across Bangladesh.",
  keywords: [
    "Bangla Bazar",
    "Bangladesh",
    "online shopping",
    "ecommerce",
    "Sharee",
    "Punjabi",
    "Shoes",
    "Electronics",
    "Bangladeshi products",
    "buy online Bangladesh",
    "best deals Bangladesh",
    "cash on delivery",
  ],
  authors: [{ name: "Bangla Bazar" }],
  creator: "Bangla Bazar",
  publisher: "Bangla Bazar",
  metadataBase: new URL("https://banglabazar.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Bangla Bazar - Bangladesh's Favorite Online Store",
    description:
      "Shop Sharee, Punjabi, Shoes and more from Bangladesh's trusted online marketplace.",
    url: "https://banglabazar.com",
    siteName: "Bangla Bazar",
    type: "website",
    locale: "en_BD",
    images: [
      {
        url: "/images/banners/hero-banner.svg",
        width: 1200,
        height: 400,
        alt: "Bangla Bazar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bangla Bazar - Bangladesh's Favorite Online Store",
    description:
      "Shop Sharee, Punjabi, Shoes and more from Bangladesh's trusted online marketplace.",
    images: ["/images/banners/hero-banner.svg"],
    creator: "@banglabazar",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "ecommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${playfair.variable} ${poppins.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
