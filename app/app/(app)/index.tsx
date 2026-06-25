import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { getPopularProfiles, getProfiles } from '../../lib/queries/profiles'
import { getCompanies } from '../../lib/queries/companies'
import { useSearchStore } from '../../store/useSearchStore'
import { ProfileCard } from '../../components/ProfileCard'
import { colors, radius } from '../../constants/theme'

export default function HomeScreen() {
  const { history, setQuery, addHistory } = useSearchStore()

  const { data: popular = [], isLoading } = useQuery({ queryKey:['profiles','popular'], queryFn:() => getPopularProfiles(6) })
  const { data: companies = [] }          = useQuery({ queryKey:['companies'],           queryFn: getCompanies })

  const goSearch = (q: string) => { setQuery(q); addHistory(q); router.push('/(app)/search') }
  const goProfile = (id: string) => router.push({ pathname:'/(app)/profile/[id]', params:{ id } })

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom:32 }}>
      <View style={s.sec}>
        <Text style={s.greeting}>Olá, Engenheiro 👋</Text>
        <Text style={s.sub}>Explore o catálogo de perfis de alumínio</Text>
      </View>

      {history.length > 0 && (
        <View style={s.sec}>
          <Text style={s.secTitle}>Buscas Recentes</Text>
          <View style={s.chips}>
            {history.map(h => (
              <TouchableOpacity key={h} style={s.chip} onPress={() => goSearch(h)}>
                <Text style={s.chipTxt}>{h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={s.sec}>
        <Text style={s.secTitle}>Empresas com Catálogo Atualizado</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal:-4 }}>
          {companies.map((c, i) => (
            <View key={c.id} style={s.company}>
              <View style={s.companyLogo}><Text style={s.companyInitial}>{c.name.slice(0,2)}</Text></View>
              <Text style={s.companyName}>{c.name}</Text>
              {i < 2 && <View style={s.dot}/>}
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={s.sec}>
        <Text style={s.secTitle}>Mais Populares</Text>
        {isLoading
          ? <ActivityIndicator color={colors.orange}/>
          : popular.map(p => (
              <ProfileCard key={p.id} profile={p} onPress={() => goProfile(p.id)}/>
            ))
        }
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:          { flex:1, backgroundColor:colors.bg },
  sec:           { padding:15, paddingTop:18 },
  secTitle:      { fontSize:10, fontWeight:'700', letterSpacing:3, color:colors.muted, marginBottom:12, textTransform:'uppercase' },
  greeting:      { fontSize:22, fontWeight:'800', color:colors.text },
  sub:           { fontSize:13, color:colors.muted, marginTop:4 },
  chips:         { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:          { backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:20, paddingHorizontal:14, paddingVertical:7 },
  chipTxt:       { fontSize:12, color:colors.muted2, fontWeight:'600' },
  company:       { backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:12, padding:12, alignItems:'center', marginHorizontal:5, minWidth:80 },
  companyLogo:   { width:38, height:38, backgroundColor:colors.s3, borderRadius:9, alignItems:'center', justifyContent:'center', marginBottom:5 },
  companyInitial:{ color:colors.orange, fontWeight:'800', fontSize:13 },
  companyName:   { fontSize:10, color:colors.muted2, fontWeight:'600' },
  dot:           { width:6, height:6, backgroundColor:colors.ok, borderRadius:3, marginTop:4 },
})
