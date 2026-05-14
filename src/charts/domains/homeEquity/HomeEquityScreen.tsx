import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChartView } from '../../builders/ChartView';
import { DataTable } from '../../builders/DataTable';
import { lineChartBuilder } from '../../builders/lineChartBuilder';
import { usePresenterContext } from '../../contract/context';
import { useChartTypeFlag } from '../../flags/useChartTypeFlag';
import type { Range } from '../../contract/types';
import { groupByYear } from '../../utils/groupByYear';
import { sliceByRange } from '../../utils/sliceByRange';
import { fetchHomeEquity } from './fetchHomeEquity';
import { RangeDropdown } from '../homeValue/RangeDropdown';

const QUERY_KEY = ['homeEquity'] as const;

export function HomeEquityScreen() {
  const [range, setRange] = useState<Range>('1y');
  const ctx = usePresenterContext('charts.homeEquity');
  useChartTypeFlag('chart.homeEquity.type', 'line');

  const { data: chartOption } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeEquity,
    select: (payload) => lineChartBuilder(sliceByRange(payload, range), ctx),
  });

  const { data: tablePayload } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchHomeEquity,
    select: (payload) => groupByYear(sliceByRange(payload, range)),
  });

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
