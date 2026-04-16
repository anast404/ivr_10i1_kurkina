import { TPlant, TCreatePlant, WaterFrequency, WATER_FREQUENCY_LABEL } from '@/types/plant';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Button,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StyledText } from '../atom/styled-text';
import { StyledTextInput } from '../atom/styled-text-input';
import { Label } from '../atom/label';
import { isValid, plantValidationRules, runValidation } from '@/utils/validation';

type TPlantFormProps = {
  visible: boolean;
  initial?: TPlant | null;
  onSave: (data: TCreatePlant) => void;
  onClose: () => void;
};

const FREQUENCY_OPTIONS = Object.values(WaterFrequency);

export function PlantForm({ visible, initial, onSave, onClose }: TPlantFormProps) {
  const [name, setName]               = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [frequency, setFrequency]     = useState<WaterFrequency>(
    initial?.waterFrequency ?? WaterFrequency.weekly
  );
  const [nameError, setNameError] = useState('');

  const handleSave = () => {
    const errs = runValidation({ name }, plantValidationRules);
    if (!isValid(errs)) {
      setNameError(errs.name ?? '');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      waterFrequency: frequency,
      lastWateredAt: initial?.lastWateredAt ?? new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <StyledText style={styles.title}>
              {initial ? 'Редактировать растение' : 'Добавить растение'}
            </StyledText>
            <TouchableOpacity onPress={onClose}>
              <StyledText style={styles.closeBtn}>✕</StyledText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Label>Название</Label>
            <StyledTextInput
              style={[styles.input, nameError ? styles.inputError : null]}
              placeholder="Например: Фикус"
              value={name}
              onChangeText={(v) => { setName(v); setNameError(''); }}
            />
            {nameError ? <StyledText style={styles.error}>{nameError}</StyledText> : null}

            <Label>Особенности ухода</Label>
            <StyledTextInput
              style={[styles.input, styles.multiline]}
              placeholder="Любит свет, не переносит сквозняки..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Label>Частота полива</Label>
            <View style={styles.frequencyGrid}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.freqChip, frequency === opt && styles.freqChipActive]}
                  onPress={() => setFrequency(opt)}
                >
                  <StyledText
                    style={[styles.freqChipText, frequency === opt && styles.freqChipTextActive]}
                  >
                    {WATER_FREQUENCY_LABEL[opt]}
                  </StyledText>
                </TouchableOpacity>
              ))}
            </View>

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
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { fontSize: 20, color: '#888', padding: 4 },
  input: { marginTop: 4, marginBottom: 12 },
  inputError: { borderColor: '#F44336' },
  multiline: { height: 72, textAlignVertical: 'top' },
  error: { color: '#F44336', fontSize: 12, marginTop: -8, marginBottom: 8 },
  frequencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 16 },
  freqChip: { borderRadius: 16, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 12, paddingVertical: 6 },
  freqChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  freqChipText: { fontSize: 13, color: '#444' },
  freqChipTextActive: { color: '#fff', fontWeight: '600' },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, paddingBottom: 16 },
});