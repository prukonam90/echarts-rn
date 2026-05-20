import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Range } from '@xpanse/native-charts';

const OPTIONS: { value: Range; label: string }[] = [
  { value: '1y', label: '1 YR' },
  { value: '5y', label: '5 YR' },
  { value: '10y', label: '10 YR' },
  { value: '30y', label: '30 YR' },
  { value: 'all', label: 'ALL' },
];

interface RangeDropdownProps {
  value: Range;
  onChange: (next: Range) => void;
}

export function RangeDropdown({ value, onChange }: RangeDropdownProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f0f3',
  },
  tabActive: {
    backgroundColor: '#0a84ff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
  },
  tabTextActive: {
    color: '#fff',
  },
});
