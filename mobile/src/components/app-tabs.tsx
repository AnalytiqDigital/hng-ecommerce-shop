import { Tabs } from "expo-router";

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#344b3b",
        tabBarInactiveTintColor: "#8b8a7e",
        tabBarStyle: {
          backgroundColor: "#fffdf8",
          borderTopColor: "#e3ded3",
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 1,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="shop" options={{ title: "Shop" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="cart" options={{ title: "Cart" }} />
      <Tabs.Screen name="account" options={{ title: "Account" }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="payment-return" options={{ href: null }} />
    </Tabs>
  );
}