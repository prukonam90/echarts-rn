import { cdnUrl, normalizeApiPayload } from '@xpanse/native-charts';
import type { ApiRawPayload, ChartDataPayload } from '@xpanse/native-charts';
import localData from './sample-hvv-response.json';

export async function fetchHomeValue(): Promise<ChartDataPayload> {
  try {
    const res = await fetch(cdnUrl.mockData('home-value'));
    if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
    return normalizeApiPayload(await res.json() as ApiRawPayload);
  } catch {
    return normalizeApiPayload(localData as unknown as ApiRawPayload);
  }
}
