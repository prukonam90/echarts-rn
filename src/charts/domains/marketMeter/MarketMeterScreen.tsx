import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  ChartView,
  getBuilder,
  useChartTypeFlag,
  usePresenterContext,
} from '@xpanse/native-charts';
import { fetchMarketMeter } from './fetchMarketMeter';

const QUERY_KEY = ['marketMeter'] as const;

export function MarketMeterScreen() {
  const ctx = usePresenterContext('charts.marketMeter');
  const chartType = useChartTypeFlag('chart.marketMeter.type', 'gauge');

  const { data: chartOption } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchMarketMeter,
    select: (payload) => getBuilder(chartType)(payload, ctx),
  });

  if (!chartOption) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartFrame}>
        <ChartView option={chartOption} />
      </View>
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
