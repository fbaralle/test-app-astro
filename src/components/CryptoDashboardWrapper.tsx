import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import CryptoDashboard from "./CryptoDashboard";
import FavoritesSection from "./FavoritesSection";
import PageViewsSection from "./PageViewsSection";
import FeatureFlagsSection from "./FeatureFlagsSection";
import ExportsSection from "./ExportsSection";
import EnvDebugSection from "./EnvDebugSection";

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
      {/* Favorites section above main content */}
      <FavoritesSection />

      {/* Main crypto dashboard */}
      <CryptoDashboard />

      {/* Cloudflare bindings sections below in compact mode */}
      <div className="w-full max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <PageViewsSection compact />
        <FeatureFlagsSection compact />
        <ExportsSection compact />
        <EnvDebugSection compact />
      </div>
    </QueryClientProvider>
  );
}
