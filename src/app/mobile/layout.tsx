import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import '../../styles/mobile.css';
import '../globals.css';

function isMobileUserAgent(userAgent: string): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}

export const metadata = {
  title: "HelloTaxi - App Móvil",
  description: "Aplicación móvil de HelloTaxi para conductores y pasajeros",
  viewport: "width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelloTaxi",
  },
};

// ✅ Convertir a componente asíncrono
export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  if (!isMobileUserAgent(userAgent)) {
    redirect('/');
  }

  return (
    <>
      {children}
    </>
  );
}