import { ScrollViewWrapper } from '@/components/atom/scroll-page-wrapper';
import { LabeledTextGroup } from '@/components/molecule/labeled-text-group';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { TEditableUser } from '@/types';
import { getDocument, updateDocument } from '@/utils/firebase-store';
import { useEffect, useState } from 'react';
import { Button, StyleSheet } from 'react-native';

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

      await updateDocument("users", authUser.uid, data)

      onUpdateUser()
    }
  }

  useEffect(() => {
    onUpdateUser()
  }, []);

  if (!authUser) return null

  return (
    <ScrollViewWrapper style={styles.wrapper}>
      <LabeledTextGroup label='Имя' value={name} editable onChangeText={onChangeName} />
      <LabeledTextGroup label='EMail' value={email} />
      <Button title="Выход" onPress={signOut} />
    </ScrollViewWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
  },
});
