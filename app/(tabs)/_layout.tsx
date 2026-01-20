import { HapticTab } from '@/components/atom/haptic-tab';
import { IconSymbol } from '@/components/atom/icon-symbol';
import { ICONS } from '@/constants';
import { Tabs } from 'expo-router';
import React from 'react';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
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
