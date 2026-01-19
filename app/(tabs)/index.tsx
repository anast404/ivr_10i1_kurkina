import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const {
    user,
    signOut,
  } = useFirebaseAuth();

  return (
    <ScrollView>
      <View style={styles.titleContainer}>
        <Text>Профиль</Text>
      </View>

      {
        user &&
        <>
          <Text>{user.email}</Text>
          <Button title="Выход" onPress={signOut} />
        </>
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
