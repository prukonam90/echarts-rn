import type { ChartDataPayload } from '../../contract/types';
import sample from './sample-hvv-response.json';

export async function fetchHomeValue(): Promise<ChartDataPayload> {
  return sample as ChartDataPayload;
}
