import { cdnUrl, normalizeApiPayload } from '@xpanse/native-charts';
import type { ApiRawPayload, ChartDataPayload } from '@xpanse/native-charts';
import localData from './sample-home-equity-response.json';

export async function fetchHomeEquity(): Promise<ChartDataPayload> {
  try {
    const res = await fetch(cdnUrl.mockData('home-equity'));
    if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
    return normalizeApiPayload(await res.json() as ApiRawPayload);
  } catch {
    return normalizeApiPayload(localData as unknown as ApiRawPayload);
  }
}
