import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { TTabItem } from '@/types';
import { getDocument, setDocument, updateDocument } from '@/utils/firebase-store';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { StyledText } from '../atom/styled-text';
import { StyledTextInput } from '../atom/styled-text-input';
import { LabeledTextGroup } from '../molecule/labeled-text-group';
import { TabsView } from '../molecule/tabs-view';
import { StyledAlert, TStyledAlert } from './styled-alert';

enum Tabs {
  create,
  join,
}

const TabsConfig: TTabItem[] = [
  {
    id: Tabs.create,
    label: 'Создать',
  },
  {
    id: Tabs.join,
    label: 'Присоединится',
  },
]

enum Alerts {
  no_found_family,
  family_created,
  family_join,
}

const AlertsConfig: Record<Alerts, Partial<TStyledAlert>> = {
  [Alerts.no_found_family]: {
    title: 'Ошибка',
    message: 'Не найдена семья с таким идентификатором, уточните идентификатор'
  },
  [Alerts.family_created]: {
    message: 'Вы создали свою семью'
  },
  [Alerts.family_join]: {
    message: 'Вы присоединились к семье'
  }
}

export function FamilyForm() {
  const {
    user: authUser,
  } = useFirebaseAuth();

  // айди семьи
  const [familyUuid, setFamilyUUID] = useState("");
  // названии семьи
  const [familyName, setFamilyName] = useState("");
  // данные о семье с бека
  const [familyDoc, setFamilydoc] = useState<{ name: string, uuid: string }>();
  // актуальная вкладка
  const [tabId, setTabId] = useState<string | number>(Tabs.create);
  // оповещение
  const [alertType, setAlertType] = useState<Alerts>();

  const getFamilyByUUID = async (uuid: string) => {
    await getDocument("family", uuid).then((value) => {
      if (value) {
        setFamilydoc({ name: value?.name, uuid })
      }
    })
  }

  useEffect(() => {
    getDocument("users", authUser.uid).then((value) => {
      if(value?.family_uuid) {
        getFamilyByUUID(value.family_uuid)
      }
    })
  })

  const onCreate = async () => {
    if (familyName) {
      await getFamilyByUUID(authUser.uid)

      if (!familyDoc) {
        // создать семью
        await setDocument("family", authUser.uid, { name: familyName, createdAt: new Date() })
      }

      // записать айдишник в профиль
      await updateDocument("users", authUser.uid, { family_uuid: authUser.uid })

      setAlertType(Alerts.family_created)
    }
  }

  const onJoin = async () => {
    if (familyUuid) {
      await getFamilyByUUID(familyUuid)

      if (familyDoc) {
        // записать айдишник в профиль
        await updateDocument("users", authUser.uid, { family_uuid: familyDoc.uuid })

        setAlertType(Alerts.family_join)
      } else {
        setAlertType(Alerts.no_found_family)
      }
    }
  }

  if (familyDoc?.name) {
    return (<LabeledTextGroup label='Семья' value={familyDoc.name} />)
  }

  return (
    <View>
      <StyledText style={styles.header}>{"Создайте или присоединитесь к семье."}</StyledText>

      <TabsView items={TabsConfig} value={tabId} onChange={(value) => setTabId(value)} bordered>
        {
          tabId === Tabs.create
            ?
            <View>
              <StyledTextInput
                style={styles.textInput}
                placeholder="Название семьи"
                value={familyName}
                onChangeText={setFamilyName}
              />
              <View style={styles.buttonWrapper}>
                <Button title="Создать" onPress={onCreate} disabled={familyName === ''} />
              </View>
            </View>
            :
            <View>
              <StyledTextInput
                style={styles.textInput}
                placeholder="Идентификатор семьи"
                value={familyUuid}
                onChangeText={setFamilyUUID}
              />
              <View style={styles.buttonWrapper}>
                <Button title="Присоединится" onPress={onJoin} disabled={familyUuid === ''} />
              </View>
            </View>
        }
      </TabsView>
      {
        alertType !== undefined &&
        <StyledAlert
          visible
          {...AlertsConfig[alertType]}
          onClose={() => setAlertType(undefined)}
        />
      }
    </View>
  );
}


const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  buttonGroupWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonWrapper: {
    paddingHorizontal: 24,
  },
  textInput: {
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 8,
  },
});
