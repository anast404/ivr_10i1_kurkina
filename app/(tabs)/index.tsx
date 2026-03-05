import { FamilyForm } from '@/components/organism/family-form';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { TEditableUser } from '@/types';
import { getDocument, updateDocument } from '@/utils/firebase-store';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const C = {
  sageDark:  '#4E7D62',
  sage:      '#7BAF8E',
  sageLight: '#B2D4BC',
  sagePale:  '#EEF7F1',
  cream:     '#FAF6EF',
  warm:      '#F0E8D8',
  charcoal:  '#2D3A32',
  stone:     '#8A9488',
  white:     '#FFFFFF',
  error:     '#D95B5B',
  errorPale: '#FDEAEA',
};

export default function ProfileScreen() {
  const { user: authUser, signOut } = useFirebaseAuth();

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState('');

  const loadUser = () => {
    getDocument('users', authUser.uid).then((value) => {
      setName(value?.name ?? '');
      setEmail(value?.email ?? '');
    });
  };

  useEffect(() => { loadUser(); }, []);

  const startEdit = () => { setNameInput(name); setEditingName(true); };
  const cancelEdit = () => setEditingName(false);

  const saveName = async () => {
    if (nameInput.trim() && nameInput !== name) {
      const data: TEditableUser = { name: nameInput.trim() };
      await updateDocument('users', authUser.uid, data);
      loadUser();
    }
    setEditingName(false);
  };

  if (!authUser) return null;

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Шапка ── */}
        <View style={styles.header}>
          <View style={styles.bgCircle} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                selectTextOnFocus
              />
              <Pressable style={styles.iconBtn} onPress={saveName}>
                <Text style={styles.iconBtnText}>✓</Text>
              </Pressable>
              <Pressable style={[styles.iconBtn, styles.iconBtnGray]} onPress={cancelEdit}>
                <Text style={[styles.iconBtnText, { color: C.stone }]}>✕</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.nameRow} onPress={startEdit}>
              <Text style={styles.nameText}>{name || 'Имя не указано'}</Text>
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>✎</Text>
              </View>
            </Pressable>
          )}

          <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* ── Данные аккаунта ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Данные аккаунта</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIconWrap}><Text style={styles.rowIcon}>👤</Text></View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Имя</Text>
                <Text style={styles.rowValue}>{name || '—'}</Text>
              </View>
              <Pressable onPress={startEdit} style={styles.rowAction}>
                <Text style={styles.rowActionText}>Изменить</Text>
              </Pressable>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowIconWrap}><Text style={styles.rowIcon}>✉️</Text></View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{email || '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Семья ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Моя семья</Text>
          <View style={styles.card}>
            <FamilyForm />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Выход ── */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Выйти из аккаунта</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  scroll: { flex: 1 },

  header: {
    backgroundColor: C.sageDark,
    paddingTop: 48,
    paddingBottom: 36,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60, right: -60,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.white, letterSpacing: 1 },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameText: { fontSize: 22, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  editBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  editBadgeText: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 18, fontWeight: '700', color: C.white, minWidth: 160,
  },
  iconBtn: { width: 34, height: 34, borderRadius: 99, backgroundColor: C.sageLight, alignItems: 'center', justifyContent: 'center' },
  iconBtnGray: { backgroundColor: 'rgba(255,255,255,0.2)' },
  iconBtnText: { fontSize: 15, fontWeight: '800', color: C.sageDark },
  emailText: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginTop: 2 },

  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.stone, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 },

  card: {
    backgroundColor: C.white, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 4,
    shadowColor: C.charcoal, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  rowIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.sagePale, alignItems: 'center', justifyContent: 'center' },
  rowIcon: { fontSize: 16 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: C.stone, letterSpacing: 0.4, textTransform: 'uppercase' },
  rowValue: { fontSize: 15, fontWeight: '600', color: C.charcoal, marginTop: 1 },
  rowAction: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: C.sagePale },
  rowActionText: { fontSize: 12, fontWeight: '700', color: C.sageDark },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 48 },

  footer: { padding: 16, paddingBottom: 32 },
  signOutBtn: {
    backgroundColor: C.white, borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#F0E8E8',
    shadowColor: C.error, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  signOutBtnPressed: { backgroundColor: C.errorPale, borderColor: '#F5C6C6' },
  signOutText: { fontSize: 15, fontWeight: '800', color: C.error, letterSpacing: 0.2 },
});