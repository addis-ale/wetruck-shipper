"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
interface TanstackProviderPrps {
  children: React.ReactNode;
}
export const TanstackProvider = ({ children }: TanstackProviderPrps) => {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
