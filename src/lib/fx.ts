const FX_URL = 'https://open.er-api.com/v6/latest/USD';

interface FxResponse {
  result?: string;
  rates?: Record<string, number>;
}

export async function fetchUSDtoMYR(): Promise<number | null> {
  try {
    const resp = await fetch(FX_URL);
    if (!resp.ok) return null;
    const data = (await resp.json()) as FxResponse;
    if (data.result !== 'success') return null;
    return typeof data.rates?.MYR === 'number' ? data.rates.MYR : null;
  } catch {
    return null;
  }
}
