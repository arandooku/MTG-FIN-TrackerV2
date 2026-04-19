import { useQuery } from '@tanstack/react-query';
import { fetchUSDtoMYR } from '@/lib/fx';

const TWELVE_H = 12 * 60 * 60 * 1000;
const FALLBACK_RATE = 4.7;

async function fetchRate(): Promise<number> {
  const r = await fetchUSDtoMYR();
  return typeof r === 'number' ? r : FALLBACK_RATE;
}

export function useFx() {
  return useQuery<number, Error, number>({
    queryKey: ['fx', 'usdmyr'],
    queryFn: fetchRate,
    staleTime: TWELVE_H,
    gcTime: TWELVE_H * 2,
    retry: 1,
    initialData: FALLBACK_RATE as number,
  });
}
