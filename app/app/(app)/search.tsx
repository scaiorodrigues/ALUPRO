import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { searchProfiles, getProfiles } from '../../lib/queries/profiles'
import { useSearchStore } from '../../store/useSearchStore'
import { ProfileCard } from '../../components/ProfileCard'
import { colors } from '../../constants/theme'

export default function SearchScreen() {
  const { query, addHistory } = useSearchStore()

  const { data = [], isLoading } = useQuery({
    queryKey: ['profiles','search', query],
    queryFn:  () => query.trim() ? searchProfiles(query) : getProfiles(),
    staleTime: 30_000,
  })

  const go = (id: string) => { addHistory(query); router.push({ pathname:'/(app)/profile/[id]', params:{ id } }) }

  return (
    <View style={s.root}>
      {isLoading
        ? <ActivityIndicator color={colors.orange} style={{ marginTop:40 }}/>
        : (
          <FlatList
            data={data}
            keyExtractor={p => p.id}
            contentContainerStyle={{ padding:14, paddingBottom:32 }}
            ListHeaderComponent={
              <Text style={s.count}>
                {data.length} RESULTADO{data.length !== 1 ? 'S' : ''}{query ? ` · "${query.toUpperCase()}"` : ''}
              </Text>
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIc}>🔍</Text>
                <Text style={s.emptyTxt}>Nenhum perfil encontrado</Text>
                <Text style={s.emptySub}>Tente outro termo ou verifique a busca</Text>
              </View>
            }
            renderItem={({ item }) => <ProfileCard profile={item} onPress={() => go(item.id)}/>}
          />
        )
      }
    </View>
  )
}

const s = StyleSheet.create({
  root:     { flex:1, backgroundColor:colors.bg },
  count:    { fontSize:10, fontWeight:'700', color:colors.muted, letterSpacing:2, marginBottom:14 },
  empty:    { alignItems:'center', paddingTop:60 },
  emptyIc:  { fontSize:48, marginBottom:14 },
  emptyTxt: { fontSize:16, fontWeight:'700', color:colors.text },
  emptySub: { fontSize:13, color:colors.muted, marginTop:6 },
})
