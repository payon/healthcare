import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/kiosk/ServiceWorkerRegistrar";
import { KioskProviders } from "@/components/kiosk/KioskProviders";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0d9488",
};

export const metadata: Metadata = {
  title: "Biogram MINI - 헬스케어 장비 이용 교육",
  description: "Biogram MINI 헬스케어 장비 이용 교육 키오스크",
  manifest: "/manifest.json",
  icons: {
    icon: "/pwa-icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "바이오그램 교육",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${notoSansKR.variable} font-sans antialiased bg-background text-foreground`}
      >
        <KioskProviders>
          {children}
        </KioskProviders>
        <ServiceWorkerRegistrar />
        <Toaster />
      </body>
    </html>
  );
}
