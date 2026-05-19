import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ChartView,
  DataTable,
  transformPayload,
  useChartTypeFlag,
  usePresenterContext,
} from '@xpanse/native-charts';
import type { ApiRawPayload, Range } from '@xpanse/native-charts';
import rawData from './sample-home-equity-response.json';
import { RangeDropdown } from '../homeValue/RangeDropdown';

const PAYLOAD = rawData as unknown as ApiRawPayload;

export function HomeEquityScreen() {
  const [range, setRange] = useState<Range>('1y');
  const ctx = usePresenterContext('charts.homeEquity');
  const chartType = useChartTypeFlag('chart.homeEquity.type', 'line');

  const { chartOption, tablePayload } = useMemo(
    () => transformPayload(PAYLOAD, { chartType, range, ctx }),
    [range, chartType, ctx],
  );

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
  container: { paddingBottom: 16 },
  chartFrame: { paddingVertical: 8 },
});
