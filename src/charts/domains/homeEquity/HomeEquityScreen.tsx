import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  ChartView,
  DataTable,
  deepMerge,
  fetchChartTemplate,
  getBuilder,
  groupByYear,
  sliceByRange,
  useChartTypeFlag,
  usePresenterContext,
} from '@xpanse/native-charts';
import type { EChartsOption } from 'echarts';
import type { Range } from '@xpanse/native-charts';
import { fetchHomeEquity } from './fetchHomeEquity';
import { RangeDropdown } from '../homeValue/RangeDropdown';

const QUERY_KEY = ['homeEquity'] as const;

export function HomeEquityScreen() {
  const [range, setRange] = useState<Range>('1y');
  const ctx = usePresenterContext('charts.homeEquity');
  const chartType = useChartTypeFlag('chart.homeEquity.type', 'line');

  const { data: template } = useQuery({
    queryKey: ['chartTemplate', chartType],
    queryFn: () => fetchChartTemplate(chartType),
    staleTime: Infinity,
  });

  const { data: rawChartOption } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeEquity,
    select: (payload) =>
      getBuilder(chartType)(sliceByRange(payload, range), ctx),
  });

  const { data: tablePayload } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeEquity,
    select: (payload) => groupByYear(sliceByRange(payload, range)),
  });

  const chartOption: EChartsOption | undefined = rawChartOption
    ? (deepMerge(
        (template?.option ?? {}) as Record<string, unknown>,
        rawChartOption as Record<string, unknown>,
      ) as EChartsOption)
    : undefined;

  if (!chartOption || !tablePayload) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RangeDropdown value={range} onChange={setRange} />
      <View style={styles.chartFrame}>
        <ChartView option={chartOption} />
      </View>
      <DataTable payload={tablePayload} ctx={ctx} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  center: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartFrame: {
    paddingVertical: 8,
  },
});
