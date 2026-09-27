import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegistrar } from "@/components/kiosk/ServiceWorkerRegistrar";
import { KioskProviders } from "@/components/kiosk/KioskProviders";
import { ensurePwaIcons } from "@/lib/pwa-icons";

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

export async function generateMetadata(): Promise<Metadata> {
  let appleIcon = '/apple-touch-icon.png';
  try {
    const icons = await ensurePwaIcons();
    const apple = icons.find((i) => i.slot === 'apple-180');
    if (apple) appleIcon = apple.url;
  } catch {
    // DB unavailable at build/prerender → bundled fallback
  }
  return {
    title: 'Biogram MINI - 헬스케어 장비 이용 교육',
    description: 'Biogram MINI 헬스케어 장비 이용 교육 키오스크',
    manifest: '/api/pwa/manifest',
    icons: {
      icon: '/pwa-icon-192.png',
      apple: appleIcon,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: '바이오그램 교육',
    },
  };
}

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
