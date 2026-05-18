import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  TemplatePreview,
  fetchChartTemplate,
  usePresenterContext,
} from '@xpanse/native-charts';
import type { ChartType } from '@xpanse/native-charts';
import sampleData from '../homeValue/sample-hvv-response.json';
import type { ChartDataPayload } from '@xpanse/native-charts';

const CHART_TYPES: ChartType[] = ['line', 'bar', 'area', 'pie'];

function TemplateCard({ chartType }: { chartType: ChartType }) {
  const ctx = usePresenterContext('charts.homeValue');
  const { data: template } = useQuery({
    queryKey: ['chartTemplate', chartType],
    queryFn: () => fetchChartTemplate(chartType),
    staleTime: Infinity,
  });

  if (!template) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{chartType.toUpperCase()}</Text>
      <Text style={styles.cardMeta}>
        {template.templateId} · v{template.version}
      </Text>
      {template.description ? (
        <Text style={styles.cardDesc}>{template.description}</Text>
      ) : null}
      <TemplatePreview
        template={template}
        samplePayload={sampleData as ChartDataPayload}
        ctx={ctx}
        range="1y"
      />
    </View>
  );
}

export function TemplatePreviewScreen() {
  return (
    <View>
      {CHART_TYPES.map((chartType) => (
        <View key={chartType}>
          <TemplateCard chartType={chartType} />
          {chartType !== CHART_TYPES[CHART_TYPES.length - 1] ? (
            <View style={styles.divider} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0a84ff',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e6e6e8',
    marginVertical: 8,
    marginHorizontal: 12,
  },
});
