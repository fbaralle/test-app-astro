import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import CryptoDashboard from "./CryptoDashboard";

export default function CryptoDashboardWrapper() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <CryptoDashboard />
    </QueryClientProvider>
  );
}
