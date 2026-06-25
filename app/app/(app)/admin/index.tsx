import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { getProfiles, deleteProfile } from '../../../lib/queries/profiles'

export default function AdminScreen() {
  const qc = useQueryClient()

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn:  getProfiles,
  })

  const deleteMut = useMutation({
    mutationFn: deleteProfile,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })

  const confirmDelete = (id: string, name: string) =>
    Alert.alert(
      'Excluir Perfil',
      `Tem certeza que deseja excluir "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir',  style: 'destructive', onPress: () => deleteMut.mutate(id) },
      ]
    )

  return (
    <View style={s.root}>
      {/* Stats */}
      <View style={s.statsRow}>
        {[['Perfis', profiles.length], ['Populares', profiles.filter(p=>p.popular).length]].map(([l,v]) => (
          <View key={l as string} style={s.statBox}>
            <Text style={s.statVal}>{v}</Text>
            <Text style={s.statLabel}>{l as string}</Text>
          </View>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#FF6B1A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
          ListHeaderComponent={<Text style={s.secTitle}>Perfis Cadastrados</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.thumb}>
                  <Text style={{ color:'#FF6B1A', fontSize:18, fontWeight:'700' }}>
                    {item.name?.charAt(0) ?? '?'}
                  </Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.name}>{item.name}</Text>
                  <Text style={s.meta}>{item.company?.name ?? '—'} · {item.weight_per_meter} kg/m</Text>
                </View>
                {item.popular && (
                  <View style={s.pop}><Text style={s.popText}>POP</Text></View>
                )}
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={s.btnEdit} onPress={() => router.push(`/(app)/admin/edit/${item.id}`)}>
                  <Text style={s.btnEditText}>✏ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnView} onPress={() => router.push(`/(app)/profile/${item.id}`)}>
                  <Text style={s.btnViewText}>👁 Ver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnDel} onPress={() => confirmDelete(item.id, item.name)}>
                  <Text style={s.btnDelText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/(app)/admin/edit/new')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root:      { flex:1, backgroundColor:'#090c0f' },
  statsRow:  { flexDirection:'row', gap:10, padding:14, paddingTop:16 },
  statBox:   { flex:1, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:12, alignItems:'center' },
  statVal:   { fontSize:26, fontWeight:'700', color:'#FF6B1A' },
  statLabel: { fontSize:10, color:'#5e6e88', fontWeight:'700', letterSpacing:1, marginTop:2 },
  secTitle:  { fontSize:10, fontWeight:'700', letterSpacing:3, color:'#5e6e88', marginBottom:12, textTransform:'uppercase' },
  card:      { backgroundColor:'#181c22', borderWidth:1, borderColor:'rgba(255,107,26,.2)', borderRadius:14, padding:13, marginBottom:10 },
  cardTop:   { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  thumb:     { width:50, height:50, backgroundColor:'#1e232b', borderRadius:11, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#262d38' },
  name:      { fontSize:15, fontWeight:'700', color:'#dde4ef' },
  meta:      { fontSize:12, color:'#5e6e88', marginTop:2 },
  pop:       { backgroundColor:'rgba(39,194,130,.14)', borderWidth:1, borderColor:'rgba(39,194,130,.3)', borderRadius:6, paddingHorizontal:7, paddingVertical:2 },
  popText:   { fontSize:9, fontWeight:'700', color:'#27c282' },
  actions:   { flexDirection:'row', gap:8 },
  btnEdit:   { flex:1, backgroundColor:'#1e232b', borderWidth:1, borderColor:'#38424f', borderRadius:9, padding:8, alignItems:'center' },
  btnEditText:{ color:'#8496b0', fontSize:12, fontWeight:'600' },
  btnView:   { flex:1, backgroundColor:'#1e232b', borderWidth:1, borderColor:'#38424f', borderRadius:9, padding:8, alignItems:'center' },
  btnViewText:{ color:'#8496b0', fontSize:12, fontWeight:'600' },
  btnDel:    { backgroundColor:'rgba(255,63,95,.1)', borderWidth:1, borderColor:'rgba(255,63,95,.3)', borderRadius:9, paddingHorizontal:14, padding:8, alignItems:'center' },
  btnDelText:{ color:'#ff3f5f', fontSize:12, fontWeight:'700' },
  fab:       { position:'absolute', bottom:24, right:20, width:56, height:56, backgroundColor:'#FF6B1A', borderRadius:18, alignItems:'center', justifyContent:'center', elevation:8, shadowColor:'#FF6B1A', shadowOpacity:.5, shadowRadius:14 },
  fabText:   { color:'#fff', fontSize:28, fontWeight:'300', lineHeight:32 },
})
