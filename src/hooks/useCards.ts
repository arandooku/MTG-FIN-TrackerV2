import { useQuery } from '@tanstack/react-query';
import type { Card } from '@/lib/schemas';
import { fetchMainSet, fetchVariants } from '@/lib/scryfall';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function useMainSet() {
  return useQuery<Card[]>({
    queryKey: ['scryfall', 'fin', 'main'],
    queryFn: fetchMainSet,
    staleTime: WEEK,
    gcTime: WEEK * 2,
    retry: 2,
  });
}

export function useVariants() {
  return useQuery<Card[]>({
    queryKey: ['scryfall', 'fin', 'variants'],
    queryFn: fetchVariants,
    staleTime: WEEK,
    gcTime: WEEK * 2,
    retry: 1,
  });
}

export function useAllCards() {
  const main = useMainSet();
  const variants = useVariants();
  return {
    main: main.data ?? [],
    variants: variants.data ?? [],
    isLoading: main.isLoading || variants.isLoading,
    error: main.error ?? variants.error,
    refetch: async () => {
      await Promise.all([main.refetch(), variants.refetch()]);
    },
  };
}
