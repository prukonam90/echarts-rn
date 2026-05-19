import type { ChartType } from '../contract/types';

let CDN_BASE_URL = 'https://cdn.xpanse.io/native-charts';

export function setCDNBaseUrl(url: string): void {
  CDN_BASE_URL = url;
}

export const cdnUrl = {
  template: (chartType: ChartType): string =>
    `${CDN_BASE_URL}/templates/${chartType}.json`,
  mockData: (domain: string): string =>
    `${CDN_BASE_URL}/mock/${domain}.json`,
};
