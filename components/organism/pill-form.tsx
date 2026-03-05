import { TPill, TCreatePill } from '@/types/pill';
import { useState } from 'react';
import {
  Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Label } from '../atom/label';

const C = {
  skyDark:  '#4E8FAD',
  sky:      '#7AAFC9',
  skyPale:  '#EBF4FF',
  cream:    '#FAF6EF',
  charcoal: '#2D3A32',
  stone:    '#8A9488',
  white:    '#FFFFFF',
  error:    '#D95B5B',
  errorPale:'#FDEAEA',
  border:   '#E0EBF0',
};

type TPillFormProps = {
  visible: boolean;
  initial?: TPill | null;
  onSave: (data: TCreatePill) => void;
  onClose: () => void;
};

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

function parseDate(str: string): string {
  const parts = str.split('.');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  const d = new Date(`${year}-${month}-${day}`);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function PillForm({ visible, initial, onSave, onClose }: TPillFormProps) {
  const [name, setName]           = useState(initial?.name ?? '');
  const [description, setDesc]    = useState(initial?.description ?? '');
  const [dateInput, setDateInput] = useState(initial?.expiresAt ? formatDate(initial.expiresAt) : '');
  const [quantity, setQuantity]   = useState(initial?.quantity ?? '');
  const [focused, setFocused]     = useState<string | null>(null);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Введите название';
    if (!dateInput.trim()) e.date = 'Введите дату';
    else if (!parseDate(dateInput)) e.date = 'Формат: ДД.ММ.ГГГГ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ name: name.trim(), description: description.trim(), expiresAt: parseDate(dateInput), quantity: quantity.trim() });
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
          {/* Ручка */}
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{initial ? '✎ Редактировать' : '＋ Добавить лекарство'}</Text>
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
                onChangeText={(v) => { setName(v); setErrors(p => ({...p, name: ''})); }}
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
                style={[styles.input, focused === 'date' && styles.inputFocused, errors.date && styles.inputError]}
                placeholder="ДД.ММ.ГГГГ"
                placeholderTextColor={C.stone}
                value={dateInput}
                onChangeText={(v) => { setDateInput(v); setErrors(p => ({...p, date: ''})); }}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => setFocused('date')}
                onBlur={() => setFocused(null)}
              />
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
            </Field>

            <Field label="Количество">
              <TextInput
                style={[styles.input, focused === 'qty' && styles.inputFocused]}
                placeholder="Например: 10 таблеток"
                placeholderTextColor={C.stone}
                value={quantity}
                onChangeText={setQuantity}
                onFocus={() => setFocused('qty')}
                onBlur={() => setFocused(null)}
              />
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingTop: 12, maxHeight: '88%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDE5E0',
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
    backgroundColor: C.cream, borderWidth: 1.5, borderColor: '#E0E8E4',
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