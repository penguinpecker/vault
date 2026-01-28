// VAULT - Tab Navigator Layout

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';

// Custom Tab Bar Icons
const TabIcons = {
  Portfolio: ({ focused }: { focused: boolean }) => (
    <View style={styles.iconContainer}>
      <View style={[styles.diamondIcon, focused && styles.diamondIconActive]}>
        <Text style={[styles.diamondText, focused && styles.diamondTextActive]}>◆</Text>
      </View>
    </View>
  ),
  
  Holdings: ({ focused }: { focused: boolean }) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect 
        x="2" y="7" width="20" height="14" rx="2" 
        stroke={focused ? theme.colors.gold.primary : theme.colors.grey[500]} 
        strokeWidth={1.5} 
      />
      <Path 
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" 
        stroke={focused ? theme.colors.gold.primary : theme.colors.grey[500]} 
        strokeWidth={1.5} 
      />
    </Svg>
  ),
  
  // Changed from Analysis to Risk with Shield icon
  Risk: ({ focused }: { focused: boolean }) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
        stroke={focused ? theme.colors.gold.primary : theme.colors.grey[500]} 
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  
  Settings: ({ focused }: { focused: boolean }) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="12" cy="12" r="3" 
        stroke={focused ? theme.colors.gold.primary : theme.colors.grey[500]} 
        strokeWidth={1.5} 
      />
      <Path 
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" 
        stroke={focused ? theme.colors.gold.primary : theme.colors.grey[500]} 
        strokeWidth={1.5} 
      />
    </Svg>
  ),
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.gold.primary,
        tabBarInactiveTintColor: theme.colors.grey[500],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ focused }) => <TabIcons.Portfolio focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: 'Holdings',
          tabBarIcon: ({ focused }) => <TabIcons.Holdings focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Risk',
          tabBarIcon: ({ focused }) => <TabIcons.Risk focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcons.Settings focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.black.rich,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey[900],
    height: 85,
    paddingTop: 10,
    paddingBottom: 25,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 5,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondIconActive: {
    // Active state styling handled by text color
  },
  diamondText: {
    fontSize: 22,
    color: theme.colors.grey[500],
  },
  diamondTextActive: {
    color: theme.colors.gold.primary,
  },
});
