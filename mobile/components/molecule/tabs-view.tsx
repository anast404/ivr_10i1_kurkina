import { TTabItem } from '@/types';
import { useEffect, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle, type ViewProps } from 'react-native';
import { StyledText } from '../atom/styled-text';

type TTabsView = ViewProps & {
  items: TTabItem[],
  value?: string | number,
  onChange?: (id: string | number) => void,
  containerStyle?: StyleProp<ViewStyle>
  bordered?: boolean
}

export function TabsView({ style, containerStyle, bordered, items, value, onChange, children, ...otherProps }: TTabsView) {
  const [tabId, setTabId] = useState(value || items?.[0]?.id || 0);

  const changeTab = (id: string | number) => {
    setTabId(id)

    onChange && onChange(id)
  }

  useEffect(() => {
    if (value && tabId !== value) {
      setTabId(value)
    }
  }, [value])

  return (
    <View style={[styles.default, style]} {...otherProps} >
      <View style={[styles.tabs, bordered && styles.noBottomBorder]}>
        {
          items.map((item) =>
          (
            <Pressable key={item.id} onPress={() => changeTab(item.id)}>
              <View style={[
                styles.tab,
                item.id === tabId && styles.tabSelected,
              ]}>
                <StyledText>{item.label}</StyledText>
              </View>
            </Pressable>
          )
          )
        }
      </View>
      {
        children && <View style={[bordered ? styles.containerBordered : styles.container, containerStyle]}>
          {children}
        </View>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  default: {
    alignItems: 'flex-start',
  },
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tabSelected: {
    backgroundColor: 'gray',
  },
  container: {
    marginTop: 16,
  },
  containerBordered: {
    padding: 16,
    borderWidth: 1,
    width: '100%',
  },
});