import { TPill, TCreatePill } from '@/types/pill';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Button,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StyledText } from '../atom/styled-text';
import { StyledTextInput } from '../atom/styled-text-input';
import { Label } from '../atom/label';

type TPillFormProps = {
  visible: boolean;
  initial?: TPill | null;
  onSave: (data: TCreatePill) => void;
  onClose: () => void;
};

const EMPTY: TCreatePill = {
  name: '',
  description: '',
  expiresAt: '',
  quantity: '',
};

/** Форматировать дату для отображения в поле */
function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Парсить дату из формата ДД.ММ.ГГГГ в ISO */
function parseDate(str: string): string {
  const parts = str.split('.');
  if (parts.length !== 3) return '';
  const [day, month, year] = parts;
  const d = new Date(`${year}-${month}-${day}`);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export function PillForm({ visible, initial, onSave, onClose }: TPillFormProps) {
  const [form, setForm] = useState<TCreatePill>({
    name: initial?.name ?? EMPTY.name,
    description: initial?.description ?? EMPTY.description,
    expiresAt: initial?.expiresAt ?? EMPTY.expiresAt,
    quantity: initial?.quantity ?? EMPTY.quantity,
  });
  const [dateInput, setDateInput] = useState(
    initial?.expiresAt ? formatDate(initial.expiresAt) : ''
  );
  const [errors, setErrors] = useState<Partial<Record<keyof TCreatePill, string>>>({});

  const set = (key: keyof TCreatePill, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) newErrors.name = 'Введите название';
    if (!dateInput.trim()) {
      newErrors.expiresAt = 'Введите дату';
    } else {
      const iso = parseDate(dateInput);
      if (!iso) newErrors.expiresAt = 'Формат: ДД.ММ.ГГГГ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, expiresAt: parseDate(dateInput) });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <StyledText style={styles.title}>
              {initial ? 'Редактировать' : 'Добавить лекарство'}
            </StyledText>
            <TouchableOpacity onPress={onClose}>
              <StyledText style={styles.closeBtn}>✕</StyledText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Название */}
            <Label>Название</Label>
            <StyledTextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="Например: Парацетамол"
              value={form.name}
              onChangeText={(v) => set('name', v)}
            />
            {errors.name ? <StyledText style={styles.error}>{errors.name}</StyledText> : null}

            {/* Назначение */}
            <Label>Назначение</Label>
            <StyledTextInput
              style={[styles.input, styles.multiline]}
              placeholder="От чего помогает..."
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
            />

            {/* Срок годности */}
            <Label>Срок годности</Label>
            <StyledTextInput
              style={[styles.input, errors.expiresAt ? styles.inputError : null]}
              placeholder="ДД.ММ.ГГГГ"
              value={dateInput}
              onChangeText={setDateInput}
              keyboardType="numeric"
              maxLength={10}
            />
            {errors.expiresAt ? (
              <StyledText style={styles.error}>{errors.expiresAt}</StyledText>
            ) : null}

            {/* Количество */}
            <Label>Количество</Label>
            <StyledTextInput
              style={styles.input}
              placeholder="Например: 10 таблеток"
              value={form.quantity}
              onChangeText={(v) => set('quantity', v)}
            />

            <View style={styles.buttons}>
              <Button title="Отмена" onPress={onClose} color="#888" />
              <Button title="Сохранить" onPress={handleSave} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    fontSize: 20,
    color: '#888',
    padding: 4,
  },
  input: {
    marginTop: 4,
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#F44336',
  },
  multiline: {
    height: 72,
    textAlignVertical: 'top',
  },
  error: {
    color: '#F44336',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingBottom: 16,
  },
});
