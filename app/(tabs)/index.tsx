import { ScrollViewWrapper } from '@/components/atom/scroll-page-wrapper';
import { LabeledTextGroup } from '@/components/molecule/labeled-text-group';
import { FamilyForm } from '@/components/organism/family-form';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { TEditableUser } from '@/types';
import { getDocument, updateDocument } from '@/utils/firebase-store';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const {
    user: authUser,
    signOut,
  } = useFirebaseAuth();

  const [name, setName] = useState('');
  const [email, setEMail] = useState('');

  const onUpdateUser = () => {
    getDocument("users", authUser.uid).then((value) => {
      setName(value?.name)
      setEMail(value?.email)
    })
  }

  const onChangeName = async (value: string) => {
    if (name !== value) {
      const data: TEditableUser = {
        name: value,
      }

      // обновим пользователя
      await updateDocument("users", authUser.uid, data)

      // перечитаем данные о пользователе
      onUpdateUser()
    }
  }

  useEffect(() => {
    // при монтировании зачитаеам данные о пользователе
    onUpdateUser()
  }, []);

  if (!authUser) return null

  return (
    <View style={styles.wrapper}>
      <ScrollViewWrapper >
        <LabeledTextGroup label='Имя' value={name} editable onChangeText={onChangeName} />
        <LabeledTextGroup label='EMail' value={email} />
        <FamilyForm />
      </ScrollViewWrapper>
      <View style={styles.exitBtnWrapper}>
      <Button title="Выход из профиля" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  exitBtnWrapper: {
    padding: 16,
  }
});
