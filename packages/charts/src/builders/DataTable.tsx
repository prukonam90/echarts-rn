import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  type ColumnDef,
  type ExpandedState,
  type Row,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type {
  ChartCellValue,
  ChartCompatibleTheme,
  ChartDataPayload,
  Dimension,
  PresenterContext,
} from '../contract/types';
import { formatTableCell } from '../contract/format';

type TableRow = Record<string, ChartCellValue>;

interface DataTableProps {
  payload: ChartDataPayload;
  ctx: PresenterContext;
  theme?: ChartCompatibleTheme;
}

const INDENT_PX = 16;

function createStyles(theme?: ChartCompatibleTheme) {
  const c = theme?.colors;
  const f = theme?.fonts;
  return StyleSheet.create({
    container: { width: '100%' },
    row: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c?.outlineVariant ?? '#ddd',
    },
    headerRow: { backgroundColor: c?.surfaceVariant ?? '#f5f5f7' },
    bodyRow: { backgroundColor: c?.surface ?? '#fff' },
    cell: {
      flex: 1,
      fontSize: (f?.bodySmall?.fontSize as number | undefined) ?? 13,
      fontFamily: f?.bodySmall?.fontFamily,
      color: c?.onSurface ?? '#222',
    },
    headerCell: {
      fontWeight: '600',
      fontSize: (f?.labelSmall?.fontSize as number | undefined) ?? 13,
      fontFamily: f?.labelSmall?.fontFamily,
      color: c?.onSurfaceVariant ?? '#555',
    },
    cellWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    cellText: {
      flexShrink: 1,
      fontSize: (f?.bodySmall?.fontSize as number | undefined) ?? 13,
      fontFamily: f?.bodySmall?.fontFamily,
      color: c?.onSurface ?? '#222',
    },
    toggle: { width: 14, marginRight: 4 },
    toggleText: { fontSize: 10, color: c?.onSurfaceVariant ?? '#666' },
  });
}

export function DataTable({ payload, ctx, theme }: DataTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const styles = useMemo(() => createStyles(theme), [theme]);

  const visibleDimensions = useMemo(
    () => payload.dimensions.filter((d) => d.visibleInTable !== false),
    [payload.dimensions],
  );

  const xDimensionName = payload.meta.xDimension;

  const columns = useMemo<ColumnDef<TableRow>[]>(
    () =>
      visibleDimensions.map((d) => ({
        accessorKey: d.name,
        header: () => ctx.t(payload.meta.labelKeys.tableColumnByKey[d.name]),
        cell: (info) => ({
          dim: d,
          value: info.getValue() as ChartCellValue,
          depth: info.row.depth,
          isXColumn: d.name === xDimensionName,
          canExpand: info.row.getCanExpand(),
          isExpanded: info.row.getIsExpanded(),
          toggleExpanded: info.row.getToggleExpandedHandler(),
        }),
        enableSorting: false,
        meta: { unit: d.unit, currency: d.currency, type: d.type },
      })),
    [
      visibleDimensions,
      ctx,
      payload.meta.labelKeys.tableColumnByKey,
      xDimensionName,
    ],
  );

  const tableData = useMemo(
    () => payload.source as unknown as TableRow[],
    [payload.source],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.children as unknown as TableRow[] | undefined,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const headerGroup = table.getHeaderGroups()[0];

  return (
    <View style={styles.container}>
      <View style={[styles.row, styles.headerRow]}>
        {headerGroup.headers.map((header) => (
          <Text key={header.id} style={[styles.cell, styles.headerCell]}>
            {flexRender(header.column.columnDef.header, header.getContext()) as string}
          </Text>
        ))}
      </View>
      <FlatList
        data={table.getRowModel().rows}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <DataRow row={item} ctx={ctx} styles={styles} />}
      />
    </View>
  );
}

interface CellDescriptor {
  dim: Dimension;
  value: ChartCellValue;
  depth: number;
  isXColumn: boolean;
  canExpand: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

function DataRow({
  row,
  ctx,
  styles,
}: {
  row: Row<TableRow>;
  ctx: PresenterContext;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.row, styles.bodyRow]}>
      {row.getVisibleCells().map((cell) => {
        const cellFn = cell.column.columnDef.cell as (
          info: ReturnType<typeof cell.getContext>,
        ) => CellDescriptor;
        const descriptor = cellFn(cell.getContext());
        return (
          <Cell key={cell.id} descriptor={descriptor} ctx={ctx} styles={styles} />
        );
      })}
    </View>
  );
}

function Cell({
  descriptor,
  ctx,
  styles,
}: {
  descriptor: CellDescriptor;
  ctx: PresenterContext;
  styles: ReturnType<typeof createStyles>;
}) {
  const text = formatTableCell(
    descriptor.value,
    descriptor.dim,
    descriptor.depth,
    ctx,
  );
  const indent = descriptor.isXColumn ? descriptor.depth * INDENT_PX : 0;

  return (
    <View style={[styles.cellWrapper, { paddingLeft: indent }]}>
      {descriptor.isXColumn && descriptor.canExpand ? (
        <Pressable onPress={descriptor.toggleExpanded} hitSlop={6} style={styles.toggle}>
          <Text style={styles.toggleText}>{descriptor.isExpanded ? '▼' : '▶'}</Text>
        </Pressable>
      ) : descriptor.isXColumn ? (
        <View style={styles.toggle} />
      ) : null}
      <Text style={styles.cellText}>{text}</Text>
    </View>
  );
}
