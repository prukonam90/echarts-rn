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
import { fetchHomeValue } from './fetchHomeValue';
import { RangeDropdown } from './RangeDropdown';

const QUERY_KEY = ['homeValue'] as const;

export function HomeValueScreen() {
  const [range, setRange] = useState<Range>('1y');
  const ctx = usePresenterContext('charts.homeValue');
  const chartType = useChartTypeFlag('chart.homeValue.type', 'line');

  const { data: template } = useQuery({
    queryKey: ['chartTemplate', chartType],
    queryFn: () => fetchChartTemplate(chartType),
    staleTime: Infinity,
  });

  const { data: rawChartOption } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeValue,
    select: (payload) =>
      getBuilder(chartType)(sliceByRange(payload, range), ctx),
  });

  const { data: tablePayload } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeValue,
    select: (payload) => groupByYear(sliceByRange(payload, range)),
  });

  const chartOption: EChartsOption | undefined =
    rawChartOption && template && Object.keys(template).length > 0
      ? (deepMerge(
          template as Record<string, unknown>,
          rawChartOption as Record<string, unknown>,
        ) as EChartsOption)
      : rawChartOption;

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
