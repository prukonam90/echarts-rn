import type { ChartDataPayload } from '@xpanse/native-charts';

export interface AmortizationInput {
  principal: number;
  annualRatePct: number;
  termYears: number;
  extraMonthlyPayment: number;
  startDateIso?: string;
}

function firstOfNextMonthUtc(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString();
}

function addMonthsUtc(iso: string, months: number): string {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1)).toISOString();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildAmortizationPayload(input: AmortizationInput): ChartDataPayload {
  const { principal, annualRatePct, termYears, extraMonthlyPayment } = input;
  const startIso = input.startDateIso ?? firstOfNextMonthUtc();
  const n = Math.max(1, Math.round(termYears * 12));
  const r = annualRatePct / 100 / 12;
  const monthlyPayment =
    r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

  let scheduledBalance = principal;
  let acceleratedBalance = principal;
  let scheduledInterestCum = 0;
  let acceleratedInterestCum = 0;

  const source: (number | string)[][] = [];

  for (let i = 0; i < n; i++) {
    const period = addMonthsUtc(startIso, i);

    const schedInterest = scheduledBalance * r;
    const schedPrincipal = Math.min(scheduledBalance, monthlyPayment - schedInterest);
    scheduledBalance = Math.max(0, scheduledBalance - schedPrincipal);
    scheduledInterestCum += schedInterest;

    if (acceleratedBalance > 0) {
      const accInterest = acceleratedBalance * r;
      const accPrincipal = Math.min(
        acceleratedBalance,
        monthlyPayment - accInterest + extraMonthlyPayment,
      );
      acceleratedBalance = Math.max(0, acceleratedBalance - accPrincipal);
      acceleratedInterestCum += accInterest;
    }

    const savings = scheduledInterestCum - acceleratedInterestCum;

    source.push([
      period,
      round2(scheduledBalance),
      round2(acceleratedBalance),
      round2(savings),
    ]);
  }

  const sourceMapKeys = [
    'period',
    'scheduledBalance',
    'acceleratedBalance',
    'cumulativeInterestSavings',
  ];

  const rows = source.map((tuple) => {
    const row: Record<string, number | string> = {};
    sourceMapKeys.forEach((k, i) => {
      row[k] = tuple[i];
    });
    return row;
  });

  return {
    dimensions: [
      {
        name: 'period',
        type: 'time',
        unit: 'date',
        role: 'x',
        sortable: true,
        visibleInTable: true,
        visibleInChart: true,
      },
      {
        name: 'scheduledBalance',
        type: 'number',
        unit: 'currency',
        currency: 'USD',
        precision: 0,
        role: 'series',
        sortable: true,
        visibleInTable: true,
        visibleInChart: true,
      },
      {
        name: 'acceleratedBalance',
        type: 'number',
        unit: 'currency',
        currency: 'USD',
        precision: 0,
        role: 'series',
        sortable: true,
        visibleInTable: true,
        visibleInChart: true,
      },
      {
        name: 'cumulativeInterestSavings',
        type: 'number',
        unit: 'currency',
        currency: 'USD',
        precision: 0,
        role: 'series',
        sortable: true,
        visibleInTable: true,
        visibleInChart: true,
      },
    ],
    source: rows,
    meta: {
      seriesKeys: ['scheduledBalance', 'acceleratedBalance', 'cumulativeInterestSavings'],
      xDimension: 'period',
      defaultChartType: 'line',
      areaFill: 'gradient',
      showSymbol: false,
      tooltip: 'none',
      labelKeys: {
        xAxis: 'charts.amortization.axes.x',
        yAxis: 'charts.amortization.axes.y',
        tooltip: 'charts.amortization.tooltip',
        legendByKey: {
          scheduledBalance: 'charts.amortization.series.scheduled',
          acceleratedBalance: 'charts.amortization.series.accelerated',
          cumulativeInterestSavings: 'charts.amortization.series.savings',
        },
        tableColumnByKey: {
          period: 'charts.amortization.columns.period',
          scheduledBalance: 'charts.amortization.columns.scheduledBalance',
          acceleratedBalance: 'charts.amortization.columns.acceleratedBalance',
          cumulativeInterestSavings: 'charts.amortization.columns.cumulativeInterestSavings',
        },
        tableCaption: 'charts.amortization.tableCaption',
      },
    },
    range: {
      granularity: 'monthly',
      from: source[0][0] as string,
      to: source[source.length - 1][0] as string,
    },
  };
}
