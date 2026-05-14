import { flattenForChart } from '../flattenForChart';
import type { ChartRow } from '../../contract/types';

const hierarchicalSource: ChartRow[] = [
  {
    period: '2024-01-01T00:00:00Z',
    region: 'Global',
    revenue: 1250000,
    children: [
      { period: '2024-01-01T00:00:00Z', region: 'North America', revenue: 720000 },
      { period: '2024-01-01T00:00:00Z', region: 'EMEA', revenue: 380000 },
      { period: '2024-01-01T00:00:00Z', region: 'APAC', revenue: 150000 },
    ],
  },
  {
    period: '2024-02-01T00:00:00Z',
    region: 'Global',
    revenue: 1310000,
    children: [
      { period: '2024-02-01T00:00:00Z', region: 'North America', revenue: 760000 },
      { period: '2024-02-01T00:00:00Z', region: 'EMEA', revenue: 395000 },
      { period: '2024-02-01T00:00:00Z', region: 'APAC', revenue: 155000 },
    ],
  },
  {
    period: '2024-03-01T00:00:00Z',
    region: 'Global',
    revenue: 1280000,
    children: [
      { period: '2024-03-01T00:00:00Z', region: 'North America', revenue: 740000 },
      { period: '2024-03-01T00:00:00Z', region: 'EMEA', revenue: 385000 },
      { period: '2024-03-01T00:00:00Z', region: 'APAC', revenue: 155000 },
    ],
  },
];

describe('flattenForChart', () => {
  it('rootsOnly strips children and returns 3 parent rows', () => {
    const flat = flattenForChart(hierarchicalSource, 'rootsOnly');
    expect(flat).toHaveLength(3);
    flat.forEach((row) => {
      expect(row.children).toBeUndefined();
      expect(row.region).toBe('Global');
    });
  });

  it('leavesOnly returns the 9 leaf rows', () => {
    const flat = flattenForChart(hierarchicalSource, 'leavesOnly');
    expect(flat).toHaveLength(9);
    flat.forEach((row) => {
      expect(['North America', 'EMEA', 'APAC']).toContain(row.region);
    });
  });

  it('all returns 3 parents + 9 leaves = 12 rows', () => {
    const flat = flattenForChart(hierarchicalSource, 'all');
    expect(flat).toHaveLength(12);
    flat.forEach((row) => {
      expect(row.children).toBeUndefined();
    });
  });
});
