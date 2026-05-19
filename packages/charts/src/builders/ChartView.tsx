import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import SvgChart, {
  SVGRenderer,
  type ChartElement,
} from '@wuba/react-native-echarts/svgChart';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { BarChart, GaugeChart, LineChart, PieChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DatasetComponent,
  SVGRenderer,
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
]);

interface ChartViewProps {
  option: EChartsOption;
  width?: number;
  height?: number;
}

const DEFAULT_HEIGHT = 280;

export function ChartView({
  option,
  width = Dimensions.get('window').width,
  height = DEFAULT_HEIGHT,
}: ChartViewProps) {
  const ref = useRef<(ChartElement & any) | null>(null);

  useEffect(() => {
    let chart: echarts.EChartsType | undefined;
    if (ref.current) {
      chart = echarts.init(ref.current, 'light', {
        renderer: 'svg',
        width,
        height,
      });
      chart.setOption(option);
    }
    return () => chart?.dispose();
  }, [option, width, height]);

  return <SvgChart ref={ref} useRNGH />;
}
