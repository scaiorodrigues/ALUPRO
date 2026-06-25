import { useEffect } from 'react'
import { Tabs, Redirect } from 'expo-router'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../../store/useAuthStore'
import { useSearchStore } from '../../store/useSearchStore'
import { router } from 'expo-router'
import { colors } from '../../constants/theme'

function TopBar() {
  const { query, setQuery } = useSearchStore()
  return (
    <View style={s.topbar}>
      <Text style={s.brand}>ALUPRO</Text>
      <View style={s.searchWrap}>
        <Text style={s.searchIc}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar perfil, empresa, linha..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={t => { setQuery(t); router.push('/(app)/search') }}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default function AppLayout() {
  const { session, loading, isAdmin } = useAuthStore()
  if (!loading && !session) return <Redirect href="/(auth)/login"/>

  return (
    <View style={{ flex:1, backgroundColor: colors.bg }}>
      <TopBar/>
      <Tabs screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarActiveTintColor:   colors.orange,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle:        s.tabLabel,
      }}>
        <Tabs.Screen name="index"
          options={{ title:'Home', tabBarIcon:({color}) => <Text style={{color, fontSize:20}}>🏠</Text> }}/>
        <Tabs.Screen name="search"
          options={{ title:'Buscar', tabBarIcon:({color}) => <Text style={{color, fontSize:20}}>🔍</Text> }}/>
        <Tabs.Screen name="favorites"
          options={{ title:'Favoritos', tabBarIcon:({color}) => <Text style={{color, fontSize:20}}>❤️</Text> }}/>
        {isAdmin && (
          <Tabs.Screen name="admin"
            options={{ title:'Admin', tabBarIcon:({color}) => <Text style={{color, fontSize:20}}>🛡</Text> }}/>
        )}
        {/* Esconde rotas de detalhe da tab bar */}
        <Tabs.Screen name="profile" options={{ href: null }}/>
      </Tabs>
    </View>
  )
}

const s = StyleSheet.create({
  topbar:      { backgroundColor:colors.s1, borderBottomWidth:1, borderBottomColor:colors.border, paddingTop:52, paddingHorizontal:14, paddingBottom:10 },
  brand:       { color:colors.orange, fontWeight:'800', fontSize:13, letterSpacing:5, marginBottom:9 },
  searchWrap:  { flexDirection:'row', alignItems:'center', backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:13, paddingHorizontal:12, paddingVertical:10, gap:9 },
  searchInput: { flex:1, color:colors.text, fontSize:14 },
  searchIc:    { fontSize:15 },
  clearBtn:    { color:colors.muted, fontSize:18, paddingHorizontal:2 },
  tabBar:      { backgroundColor:colors.s1, borderTopColor:colors.border, borderTopWidth:1, height:64, paddingBottom:10 },
  tabLabel:    { fontSize:9, fontWeight:'700', letterSpacing:1.5, textTransform:'uppercase' },
})
