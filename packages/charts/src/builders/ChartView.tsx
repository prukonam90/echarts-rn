import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import SvgChart, {
  SVGRenderer,
  type ChartElement,
} from '@wuba/react-native-echarts/svgChart';
import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import type { ChartCompatibleTheme } from '../contract/types';

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
]);

interface ChartViewProps {
  option: EChartsOption;
  theme?: ChartCompatibleTheme;
  width?: number;
  height?: number;
}

const DEFAULT_HEIGHT = 280;

export function ChartView({
  option,
  theme,
  width = Dimensions.get('window').width,
  height = DEFAULT_HEIGHT,
}: ChartViewProps) {
  const ref = useRef<(ChartElement & any) | null>(null);

  useEffect(() => {
    let chart: echarts.EChartsType | undefined;
    if (ref.current) {
      const echartTheme = theme?.dark ? 'dark' : 'light';
      chart = echarts.init(ref.current, echartTheme, {
        renderer: 'svg',
        width,
        height,
      });

      const palette = theme?.seriesColors ?? (theme
        ? [theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]
        : undefined);

      const finalOption: EChartsOption = palette
        ? { color: palette, ...option }
        : option;

      chart.setOption(finalOption);
    }
    return () => chart?.dispose();
  }, [option, width, height, theme]);

  return <SvgChart ref={ref} useRNGH />;
}
