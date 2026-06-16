"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { setAccessTokenGetter } from "@/lib/api";

function AccessTokenBridge() {
  const { data: session } = useSession();

  useEffect(() => {
    setAccessTokenGetter(() => session?.accessToken);
  }, [session?.accessToken]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AccessTokenBridge />
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  );
}
