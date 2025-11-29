"use client";

import AppHeader from '@/components/layout/app-header';
import AppFooter from '@/components/layout/app-footer';
import { useIsMobile } from "@/hooks/use-mobile";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">{children}</main>
      {!isMobile && <AppFooter />}
    </div>
  );
}
