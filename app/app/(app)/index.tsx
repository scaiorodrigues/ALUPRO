import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { getPopularProfiles, getProfiles } from '../../lib/queries/profiles'
import { getCompanies } from '../../lib/queries/companies'
import { useSearchStore } from '../../store/useSearchStore'

function SectionTitle({ title }: { title: string }) {
  return <Text style={s.secTitle}>{title}</Text>
}

function ChipRow({ items, onPress }: { items: string[], onPress: (v: string) => void }) {
  return (
    <View style={s.chipRow}>
      {items.map((item) => (
        <TouchableOpacity key={item} style={s.chip} onPress={() => onPress(item)}>
          <Text style={s.chipText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

function ProfileRow({ profile, onPress }: { profile: any, onPress: () => void }) {
  return (
    <TouchableOpacity style={s.profileRow} onPress={onPress}>
      <View style={s.profileThumb}>
        <Text style={{ color: '#FF6B1A', fontSize: 18 }}>
          {profile.name?.charAt(0) ?? '?'}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.profileName}>{profile.name}</Text>
        <Text style={s.profileMeta}>{profile.company?.name ?? '—'} · {profile.line?.name ?? '—'}</Text>
        <Text style={s.profileWeight}>{profile.weight_per_meter} kg/m</Text>
      </View>
      {profile.popular && <View style={s.popularBadge}><Text style={s.popularText}>POPULAR</Text></View>}
      <Text style={{ color:'#5e6e88' }}>›</Text>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const { history, setQuery, addHistory } = useSearchStore()

  const { data: popular = [], isLoading: loadingPop } = useQuery({
    queryKey: ['profiles', 'popular'],
    queryFn: () => getPopularProfiles(6),
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })

  const handleSearch = (q: string) => {
    setQuery(q); addHistory(q)
    router.push('/(app)/search')
  }

  const handleProfile = (id: string) => router.push(`/(app)/profile/${id}`)

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={s.sec}>
        <Text style={s.greeting}>Olá, Engenheiro 👋</Text>
        <Text style={s.sub}>Explore o catálogo de perfis</Text>
      </View>

      {history.length > 0 && (
        <View style={s.sec}>
          <SectionTitle title="Buscas Recentes" />
          <ChipRow items={history} onPress={handleSearch} />
        </View>
      )}

      <View style={s.sec}>
        <SectionTitle title="Empresas Atualizadas" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {companies.slice(0, 6).map((c) => (
            <TouchableOpacity key={c.id} style={s.companyBadge}>
              <View style={s.companyLogo}>
                <Text style={{ color:'#FF6B1A', fontWeight:'700' }}>{c.name.slice(0,2)}</Text>
              </View>
              <Text style={s.companyName}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.sec}>
        <SectionTitle title="Mais Populares" />
        {loadingPop
          ? <ActivityIndicator color="#FF6B1A" />
          : popular.map((p) => (
              <ProfileRow key={p.id} profile={p} onPress={() => handleProfile(p.id)} />
            ))
        }
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:         { flex:1, backgroundColor:'#090c0f' },
  sec:          { padding:16, paddingTop:18 },
  secTitle:     { fontSize:10, fontWeight:'700', letterSpacing:3, color:'#5e6e88', marginBottom:11, textTransform:'uppercase' },
  greeting:     { fontSize:22, fontWeight:'700', color:'#dde4ef' },
  sub:          { fontSize:13, color:'#5e6e88', marginTop:4 },
  chipRow:      { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:         { backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:20, paddingHorizontal:13, paddingVertical:6 },
  chipText:     { fontSize:12, color:'#8496b0', fontWeight:'600' },
  companyBadge: { backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:12, padding:12, alignItems:'center', marginRight:10, minWidth:76 },
  companyLogo:  { width:36, height:36, backgroundColor:'#1e232b', borderRadius:8, alignItems:'center', justifyContent:'center', marginBottom:4 },
  companyName:  { fontSize:10, color:'#8496b0', fontWeight:'600' },
  profileRow:   { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:14, padding:13, marginBottom:9 },
  profileThumb: { width:50, height:50, backgroundColor:'#1e232b', borderRadius:11, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#262d38' },
  profileName:  { fontSize:16, fontWeight:'700', color:'#dde4ef' },
  profileMeta:  { fontSize:12, color:'#5e6e88', marginTop:1 },
  profileWeight:{ fontSize:12, color:'#FF6B1A', fontWeight:'600', marginTop:3 },
  popularBadge: { backgroundColor:'rgba(39,194,130,.14)', borderWidth:1, borderColor:'rgba(39,194,130,.3)', borderRadius:6, paddingHorizontal:8, paddingVertical:2 },
  popularText:  { fontSize:9, fontWeight:'700', color:'#27c282', letterSpacing:1 },
})
