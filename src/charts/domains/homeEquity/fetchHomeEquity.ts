import { cdnUrl } from '@xpanse/native-charts';
import type { ChartDataPayload } from '@xpanse/native-charts';
import localData from './sample-home-equity-response.json';

export async function fetchHomeEquity(): Promise<ChartDataPayload> {
  try {
    const res = await fetch(cdnUrl.mockData('home-equity'));
    if (!res.ok) throw new Error(`CDN fetch failed: ${res.status}`);
    return res.json() as Promise<ChartDataPayload>;
  } catch {
    return localData as ChartDataPayload;
  }
}
