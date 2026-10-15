import { COLORS as C } from '@/styles/colors';
import { TCreatePill, TPill } from '@/types/pill';
import {
  ValidationErrors,
  isValid,
  pillValidationRules,
  runValidation,
} from '@/utils/validation';
import { parseDate } from '@/utils/date';
import { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Toast from 'react-native-toast-message';

type TPillFormProps = {
  visible: boolean;
  initial?: TPill | null;
  onSave: (data: TCreatePill) => void;
  onClose: () => void;
};

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

export function PillForm({ visible, initial, onSave, onClose }: TPillFormProps) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [description, setDesc]    = useState(initial?.description ?? '');
  const [dateInput, setDateInput] = useState(initial?.expiresAt ? formatDate(initial.expiresAt) : '');
  const [quantity, setQuantity]   = useState(String(initial?.quantity ?? ''));
  const [focused, setFocused]     = useState<string | null>(null);
  const [errors, setErrors]       = useState<ValidationErrors>({});

  const clearError = (field: string) =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const handleSave = () => {
    const errs = runValidation({ name, dateInput, quantity }, pillValidationRules);
    if (!isValid(errs)) { setErrors(errs); return; }

    onSave({
      name: name.trim(),
      description: description.trim(),
      expiresAt: parseDate(dateInput),
      quantity: parseFloat(quantity),
    });
    onClose();
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{initial ? 'Редактировать' : 'Добавить лекарство'}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Название *">
              <TextInput
                style={[styles.input, focused === 'name' && styles.inputFocused, errors.name && styles.inputError]}
                placeholder="Например: Парацетамол"
                placeholderTextColor={C.stone}
                value={name}
                onChangeText={(v) => { setName(v); clearError('name'); }}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </Field>

            <Field label="Назначение">
              <TextInput
                style={[styles.input, styles.multiline, focused === 'desc' && styles.inputFocused]}
                placeholder="От чего помогает..."
                placeholderTextColor={C.stone}
                value={description}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
                onFocus={() => setFocused('desc')}
                onBlur={() => setFocused(null)}
              />
            </Field>

            <Field label="Срок годности *">
              <TextInput
                style={[styles.input, focused === 'date' && styles.inputFocused, errors.dateInput && styles.inputError]}
                placeholder="ДД.ММ.ГГГГ"
                placeholderTextColor={C.stone}
                value={dateInput}
                onChangeText={(v) => { setDateInput(v); clearError('dateInput'); }}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => setFocused('date')}
                onBlur={() => setFocused(null)}
              />
              {errors.dateInput ? <Text style={styles.errorText}>{errors.dateInput}</Text> : null}
            </Field>

            <Field label="Количество">
              <TextInput
                style={[styles.input, focused === 'qty' && styles.inputFocused]}
                placeholder="Например: 10"
                placeholderTextColor={C.stone}
                value={quantity}
                onChangeText={(v) => { setQuantity(v); clearError('quantity'); }}
                keyboardType="numeric"
                onFocus={() => setFocused('qty')}
                onBlur={() => setFocused(null)}
              />
              {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
            </Field>

            <View style={styles.btnRow}>
              <Pressable
                style={({ pressed }) => [styles.btnCancel, pressed && { opacity: 0.7 }]}
                onPress={onClose}
              >
                <Text style={styles.btnCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnSave, pressed && { opacity: 0.85 }]}
                onPress={handleSave}
              >
                <Text style={styles.btnSaveText}>Сохранить</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
      <Toast />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: C.overlayBlack45 },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingTop: 12, maxHeight: '88%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.handle,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: C.charcoal },
  closeBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: C.stone, fontWeight: '700' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, fontWeight: '600', color: C.charcoal,
    backgroundColor: C.cream,
  },
  inputFocused: { borderColor: C.sky, backgroundColor: C.white },
  inputError:   { borderColor: C.error },
  multiline:    { height: 80, textAlignVertical: 'top' },
  errorText:    { fontSize: 12, fontWeight: '700', color: C.error, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8, paddingBottom: 20 },
  btnCancel: {
    flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.borderMuted,
  },
  btnCancelText: { fontSize: 15, fontWeight: '800', color: C.stone },
  btnSave: {
    flex: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.skyDark,
    shadowColor: C.skyDark, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  btnSaveText: { fontSize: 15, fontWeight: '800', color: C.white },
});