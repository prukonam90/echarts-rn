import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ChartView,
  DataTable,
  transformPayload,
  useChartTypeFlag,
  usePresenterContext,
} from '@xpanse/native-charts';
import type { Range } from '@xpanse/native-charts';
import { AmortizationInputs, type AmortizationInputsValue } from './AmortizationInputs';
import { buildAmortizationPayload } from './buildAmortizationPayload';
import { RangeDropdown } from './RangeDropdown';

const INITIAL_INPUTS: AmortizationInputsValue = {
  principal: 400000,
  annualRatePct: 6.5,
  termYears: 30,
  extraMonthlyPayment: 200,
};

export function AmortizationScreen() {
  const [inputs, setInputs] = useState<AmortizationInputsValue>(INITIAL_INPUTS);
  const [range, setRange] = useState<Range>('5y');
  const ctx = usePresenterContext('charts.amortization');
  const chartType = useChartTypeFlag('chart.amortization.type', 'line');

  const payload = useMemo(() => buildAmortizationPayload(inputs), [inputs]);

  const { chartOption, tablePayload } = useMemo(
    () => transformPayload(payload, { chartType, range, ctx }),
    [payload, chartType, range, ctx],
  );

  return (
    <View style={styles.container}>
      <AmortizationInputs value={inputs} onChange={setInputs} />
      <RangeDropdown value={range} onChange={setRange} />
      <View style={styles.chartFrame}>
        <ChartView option={chartOption} />
      </View>
      <DataTable payload={tablePayload} ctx={ctx} horizontalScroll />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 16 },
  chartFrame: { paddingVertical: 8 },
});
