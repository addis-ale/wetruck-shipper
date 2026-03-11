"use client";

import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Force light mode on the html element
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  }, []);

  return (
    <div className="light min-h-dvh bg-background text-foreground transition-none safe-area-inset">
      {children}
    </div>
  );
}
