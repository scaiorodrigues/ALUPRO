import { useEffect } from 'react'
import { FlatList, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { searchProfiles, getProfiles } from '../../lib/queries/profiles'
import { useSearchStore } from '../../store/useSearchStore'

export default function SearchScreen() {
  const { query, addHistory } = useSearchStore()

  const { data = [], isLoading } = useQuery({
    queryKey: ['profiles', 'search', query],
    queryFn:  () => query.trim() ? searchProfiles(query) : getProfiles(),
    staleTime: 1000 * 30,
  })

  const handleSelect = (id: string) => {
    addHistory(query)
    router.push(`/(app)/profile/${id}`)
  }

  return (
    <View style={s.root}>
      {isLoading ? (
        <ActivityIndicator color="#FF6B1A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
          ListHeaderComponent={
            <Text style={s.count}>
              {data.length} RESULTADO{data.length !== 1 ? 'S' : ''}
              {query ? ` PARA "${query.toUpperCase()}"` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={s.emptyText}>Nenhum perfil encontrado</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => handleSelect(item.id)}>
              <View style={s.thumb}>
                <Text style={{ color:'#FF6B1A', fontSize:18, fontWeight:'700' }}>
                  {item.name?.charAt(0) ?? '?'}
                </Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.meta}>{item.company?.name ?? '—'} · {item.line?.name ?? '—'}</Text>
                <Text style={s.weight}>{item.weight_per_meter} kg/m</Text>
              </View>
              <Text style={{ color:'#5e6e88' }}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root:      { flex:1, backgroundColor:'#090c0f' },
  count:     { fontSize:10, fontWeight:'700', color:'#5e6e88', letterSpacing:2, marginBottom:14 },
  row:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:14, padding:13, marginBottom:9 },
  thumb:     { width:50, height:50, backgroundColor:'#1e232b', borderRadius:11, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#262d38' },
  name:      { fontSize:16, fontWeight:'700', color:'#dde4ef' },
  meta:      { fontSize:12, color:'#5e6e88', marginTop:1 },
  weight:    { fontSize:12, color:'#FF6B1A', fontWeight:'600', marginTop:3 },
  empty:     { alignItems:'center', paddingTop:60 },
  emptyIcon: { fontSize:44, marginBottom:14 },
  emptyText: { fontSize:15, color:'#5e6e88' },
})
