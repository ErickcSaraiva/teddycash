import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:false
      }}
    >

      <Tabs.Screen
        name="home"
         options={{
          title:"Início"
        }}
      />

      <Tabs.Screen
        name="games"
        options={{
          title:"Jogos"
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title:"Prêmios"
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title:"Perfil"
        }}
      />

    </Tabs>
  );
}
