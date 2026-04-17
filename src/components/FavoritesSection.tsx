import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Favorite {
  id: number;
  user_id: string;
  coin_id: string;
  coin_name: string | null;
  coin_symbol: string | null;
  coin_image: string | null;
  created_at: number;
}

interface FavoritesResponse {
  favorites: Favorite[];
}

const getBasePath = () => import.meta.env.PUBLIC_API_MOUNT_PATH || '';

async function fetchFavorites(): Promise<Favorite[]> {
  const basePath = getBasePath();
  const res = await fetch(`${basePath}/api/favorites?user_id=public`);
  if (!res.ok) throw new Error("Failed to fetch favorites");
  const data: FavoritesResponse = await res.json();
  return data.favorites;
}

async function addFavorite(coin: {
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  coin_image: string;
}): Promise<void> {
  const basePath = getBasePath();
  const res = await fetch(`${basePath}/api/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: "public",
      coin_id: coin.coin_id,
      coin_name: coin.coin_name,
      coin_symbol: coin.coin_symbol,
      coin_image: coin.coin_image,
    }),
  });
  if (!res.ok) throw new Error("Failed to add favorite");
}

async function removeFavorite(coinId: string): Promise<void> {
  const basePath = getBasePath();
  const res = await fetch(
    `${basePath}/api/favorites?user_id=public&coin_id=${encodeURIComponent(coinId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to remove favorite");
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    retry: false,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFavorite,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFavorite,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export default function FavoritesSection() {
  const { data: favorites = [], isLoading, error } = useFavorites();
  const removeMutation = useRemoveFavorite();

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <p className="text-red-500 dark:text-red-400 text-sm">
          Failed to load favorites
        </p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Your Favorites
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No favorites yet. Click the star icon on any coin to add it to your favorites.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Your Favorites
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="flex-shrink-0 w-48 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {fav.coin_image && (
                  <img
                    src={fav.coin_image}
                    alt={fav.coin_name || fav.coin_id}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {fav.coin_name || fav.coin_id}
                </span>
              </div>
              <button
                onClick={() => removeMutation.mutate(fav.coin_id)}
                disabled={removeMutation.isPending}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Remove from favorites"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <span className="text-gray-400 uppercase text-xs">
              {fav.coin_symbol || fav.coin_id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
