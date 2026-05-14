import type { ChartDataPayload } from '../../contract/types';
import sample from './sample-home-equity-response.json';

export async function fetchHomeEquity(): Promise<ChartDataPayload> {
  return sample as ChartDataPayload;
}
