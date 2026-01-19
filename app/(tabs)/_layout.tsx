import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ICONS } from '@/constants/types';
import { Tabs } from 'expo-router';
import React from 'react';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: !false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="pills"
        options={{
          title: 'Аптечка',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={ICONS.pills} color={color} />,
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Цветы',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={ICONS.plants} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name={ICONS.profile} color={color} />,
        }}
      />
    </Tabs>
  );
}
