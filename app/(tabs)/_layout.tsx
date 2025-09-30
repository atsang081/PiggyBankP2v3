import { Tabs } from 'expo-router';
import { PiggyBank as Piggy, PiggyBank, ChartBar, Menu, TrendingUp, Settings } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Colors from '@/constants/Colors';
import { useSpendingContext } from '@/context/SpendingContext';

export default function TabLayout() {
  const { t } = useTranslation();
  const { appStyle } = useSpendingContext();
  const currentColors = Colors.getStyleColors(appStyle);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: [styles.tabBar, { backgroundColor: Colors.white, shadowColor: Colors.darkGray }],
        tabBarActiveTintColor: currentColors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color, size }) => (
            <Piggy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="deposits"
        options={{
          title: t('navigation.savings'),
          tabBarIcon: ({ color, size }) => (
            <TrendingUp size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-money"
        options={{
          title: t('navigation.addMoney'),
          tabBarIcon: ({ color, size }) => (
            <PiggyBank size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('navigation.history'),
          tabBarIcon: ({ color, size }) => (
            <Menu size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parent"
        options={{
          title: t('navigation.parents'),
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 65,
    paddingBottom: 8,
    paddingTop: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabBarLabel: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 12,
  }
});