import { StyleSheet, Text, TextInput, View } from 'react-native';

export interface AmortizationInputsValue {
  principal: number;
  annualRatePct: number;
  termYears: number;
  extraMonthlyPayment: number;
}

interface AmortizationInputsProps {
  value: AmortizationInputsValue;
  onChange: (next: AmortizationInputsValue) => void;
}

function toNumber(raw: string, fallback: number): number {
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function AmortizationInputs({ value, onChange }: AmortizationInputsProps) {
  return (
    <View style={styles.container}>
      <Field
        label="Principal"
        suffix="$"
        defaultValue={String(value.principal)}
        onChangeText={(t) => onChange({ ...value, principal: toNumber(t, value.principal) })}
      />
      <Field
        label="Rate"
        suffix="%"
        defaultValue={String(value.annualRatePct)}
        onChangeText={(t) => onChange({ ...value, annualRatePct: toNumber(t, value.annualRatePct) })}
      />
      <Field
        label="Term"
        suffix="yr"
        defaultValue={String(value.termYears)}
        onChangeText={(t) => onChange({ ...value, termYears: toNumber(t, value.termYears) })}
      />
      <Field
        label="Extra/mo"
        suffix="$"
        defaultValue={String(value.extraMonthlyPayment)}
        onChangeText={(t) =>
          onChange({ ...value, extraMonthlyPayment: toNumber(t, value.extraMonthlyPayment) })
        }
      />
    </View>
  );
}

interface FieldProps {
  label: string;
  suffix: string;
  defaultValue: string;
  onChangeText: (text: string) => void;
}

function Field({ label, suffix, defaultValue, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} ({suffix})
      </Text>
      <TextInput
        defaultValue={defaultValue}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        style={styles.input}
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 8,
  },
  field: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 80,
  },
  label: {
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    color: '#222',
    backgroundColor: '#fff',
  },
});
