import { cdnUrl } from '@xpanse/native-charts';
import type { ChartDataPayload } from '@xpanse/native-charts';
import localData from './sample-hvv-response.json';

export async function fetchHomeValue(): Promise<ChartDataPayload> {
  try {
    const res = await fetch(cdnUrl.mockData('home-value'));
    if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
    return res.json() as Promise<ChartDataPayload>;
  } catch {
    return localData as ChartDataPayload;
  }
}
