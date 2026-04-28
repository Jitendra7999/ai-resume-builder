"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "./SidebarContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) return <>{children}</>;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-zinc-900 relative">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
