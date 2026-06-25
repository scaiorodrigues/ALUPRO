import { Redirect, Tabs } from 'expo-router'
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native'
import { useAuthStore } from '../../store/useAuthStore'
import { useSearchStore } from '../../store/useSearchStore'
import { router } from 'expo-router'

function SearchBar() {
  const { query, setQuery } = useSearchStore()
  return (
    <View style={s.searchWrap}>
      <Text style={s.searchIcon}>🔍</Text>
      <TextInput
        style={s.searchInput}
        placeholder="Buscar perfil, empresa, linha..."
        placeholderTextColor="#5e6e88"
        value={query}
        onChangeText={(t) => { setQuery(t); router.push('/(app)/search') }}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => setQuery('')}>
          <Text style={s.clearBtn}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default function AppLayout() {
  const { session, loading, isAdmin } = useAuthStore()
  if (!loading && !session) return <Redirect href="/(auth)/login" />

  return (
    <View style={{ flex: 1, backgroundColor: '#090c0f' }}>
      {/* Status bar area */}
      <View style={s.topBar}>
        <Text style={s.brand}>ALUPRO</Text>
        <SearchBar />
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: s.tabBar,
          tabBarActiveTintColor:   '#FF6B1A',
          tabBarInactiveTintColor: '#5e6e88',
          tabBarLabelStyle:        s.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: 'Buscar', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔍</Text> }}
        />
        <Tabs.Screen
          name="favorites"
          options={{ title: 'Favoritos', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>❤️</Text> }}
        />
        {isAdmin && (
          <Tabs.Screen
            name="admin"
            options={{ title: 'Admin', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛡</Text> }}
          />
        )}
      </Tabs>
    </View>
  )
}

const s = StyleSheet.create({
  topBar:     { backgroundColor:'#111418', borderBottomWidth:1, borderBottomColor:'#262d38', paddingTop:48, paddingHorizontal:14, paddingBottom:8 },
  brand:      { color:'#FF6B1A', fontWeight:'700', fontSize:13, letterSpacing:4, marginBottom:8 },
  searchWrap: { flexDirection:'row', alignItems:'center', backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, paddingHorizontal:12, paddingVertical:9, gap:8 },
  searchInput:{ flex:1, color:'#dde4ef', fontSize:14 },
  searchIcon: { fontSize:15 },
  clearBtn:   { color:'#5e6e88', fontSize:18, paddingHorizontal:4 },
  tabBar:     { backgroundColor:'#111418', borderTopColor:'#262d38', borderTopWidth:1, height:62, paddingBottom:8 },
  tabLabel:   { fontSize:9, fontWeight:'700', letterSpacing:1, textTransform:'uppercase' },
})
