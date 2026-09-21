import { ICONS } from '@/constants';
import { useState } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { IconedButton } from '../atom/iconned-button';
import { Label } from '../atom/label';
import { StyledText } from '../atom/styled-text';
import { StyledTextInput } from '../atom/styled-text-input';

type TLabeledTextGroup = ViewProps & {
  label: string,
  value: string,
  editable?: boolean,
  onChangeText?: (text: string) => void
}

export function LabeledTextGroup({ style, label, value, editable, onChangeText }: TLabeledTextGroup) {
  // режим редактирования
  const [isEditing, setEditing] = useState(false);
  // новое значение поля
  const [newValue, setValue] = useState(value);

  // перевод поля в режим редактирования
  const onEdit = () => {
    setValue(value)

    setEditing(true)
  }

  // отмена редактирования
  const onCancel = () => {
    setEditing(false)
  }

  // принятие результата редактирования
  const onSend = () => {
    setEditing(false)

    onChangeText && onChangeText(newValue)
  }

  return (
    <View style={[styles.default, style]}>
      <View style={styles.wrapper}>
        <Label style={styles.label}>{label || ''}</Label>
        {
          isEditing
            ?
            <StyledTextInput style={styles.text} onChangeText={setValue}>{newValue}</StyledTextInput>
            :
            <StyledText style={styles.text}>{value}</StyledText>
        }
      </View>
      {
        editable && (
          isEditing
            ?
            <View style={styles.wrapper}>
              <IconedButton iconName={ICONS.close} style={styles.editButton} onPress={onCancel} />
              <IconedButton iconName={ICONS.send} style={styles.editButton} onPress={onSend} />
            </View>
            :
            <IconedButton iconName={ICONS.edit} style={styles.editButton} onPress={onEdit} />
        )
      }
    </View>
  )
}

const styles = StyleSheet.create({
  default: {
    flexDirection: 'row',
    paddingBottom: 16,
    justifyContent: "space-between"
  },
  wrapper: {
    flexDirection: 'row',
  },
  label: {
    alignSelf: "baseline",
    width: 50,
    marginRight: 8,
  },
  text: {
    alignSelf: "baseline",
    width: 220,
  },
  editButton: {
    alignSelf: "center",
  }
});