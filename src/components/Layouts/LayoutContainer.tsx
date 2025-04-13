"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { ReactNode } from "react";

// rutas exactas o prefijos que ocultarán el layout
const hiddenLayoutRoutes = ["/login", "/register"];
const hiddenLayoutPrefixes = ["/request"]; // aquí van los prefijos como /request

export function LayoutContainer({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const hideLayout =
    hiddenLayoutRoutes.includes(pathname) ||
    hiddenLayoutPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />
        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
