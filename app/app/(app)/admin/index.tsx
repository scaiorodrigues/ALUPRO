import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { getProfiles, deleteProfile } from '../../../lib/queries/profiles'
import { ProfileCard } from '../../../components/ProfileCard'
import { colors, radius } from '../../../constants/theme'
import { useAuthStore } from '../../../store/useAuthStore'

export default function AdminScreen() {
  const qc = useQueryClient()
  const { signOut } = useAuthStore()
  const { data: profiles = [], isLoading } = useQuery({ queryKey:['profiles'], queryFn: getProfiles })

  const delMut = useMutation({
    mutationFn: deleteProfile,
    onSuccess:  () => qc.invalidateQueries({ queryKey:['profiles'] }),
  })

  const confirmDelete = (id: string, name: string) =>
    Alert.alert('Excluir Perfil', `Excluir "${name}"?`, [
      { text:'Cancelar', style:'cancel' },
      { text:'Excluir', style:'destructive', onPress: () => delMut.mutate(id) },
    ])

  const goEdit = (id: string) => router.push({ pathname:'/(app)/admin/edit/[id]', params:{ id } })

  const stats = [
    { label:'Perfis',    val: profiles.length },
    { label:'Populares', val: profiles.filter(p => p.popular).length },
    { label:'Empresas',  val: new Set(profiles.map(p => p.company_id)).size },
  ]

  return (
    <View style={s.root}>
      {isLoading
        ? <ActivityIndicator color={colors.orange} style={{ marginTop:60 }}/>
        : (
          <FlatList
            data={profiles}
            keyExtractor={p => p.id}
            contentContainerStyle={{ padding:14, paddingBottom:100 }}
            ListHeaderComponent={
              <>
                <View style={s.headerRow}>
                  <View>
                    <Text style={s.adminTitle}>Painel Admin</Text>
                    <Text style={s.adminSub}>Gerenciar catálogo de perfis</Text>
                  </View>
                  <View style={s.adminBadge}><Text style={s.adminBadgeTxt}>ADMIN</Text></View>
                </View>
                <View style={s.statsRow}>
                  {stats.map(st => (
                    <View key={st.label} style={s.statBox}>
                      <Text style={s.statVal}>{st.val}</Text>
                      <Text style={s.statLabel}>{st.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={s.secTitle}>Perfis Cadastrados</Text>
              </>
            }
            ListFooterComponent={
              <TouchableOpacity style={s.signOut} onPress={signOut}>
                <Text style={s.signOutTxt}>↩ Sair do painel admin</Text>
              </TouchableOpacity>
            }
            renderItem={({ item }) => (
              <ProfileCard
                profile={item} isAdmin
                onPress={() => router.push({ pathname:'/(app)/profile/[id]', params:{ id: item.id } })}
                onEdit={() => goEdit(item.id)}
                onDelete={() => confirmDelete(item.id, item.name)}
              />
            )}
          />
        )
      }
      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => goEdit('new')}>
        <Text style={s.fabTxt}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root:          { flex:1, backgroundColor:colors.bg },
  headerRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  adminTitle:    { fontSize:22, fontWeight:'800', color:colors.orange },
  adminSub:      { fontSize:12, color:colors.muted, marginTop:3 },
  adminBadge:    { backgroundColor:colors.orangeD, borderWidth:1, borderColor:colors.orange, borderRadius:8, paddingHorizontal:10, paddingVertical:4 },
  adminBadgeTxt: { fontSize:10, fontWeight:'700', letterSpacing:2, color:colors.orange },
  statsRow:      { flexDirection:'row', gap:9, marginBottom:20 },
  statBox:       { flex:1, backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:12, alignItems:'center' },
  statVal:       { fontSize:26, fontWeight:'800', color:colors.orange },
  statLabel:     { fontSize:10, color:colors.muted, fontWeight:'700', letterSpacing:1, marginTop:2 },
  secTitle:      { fontSize:10, fontWeight:'700', letterSpacing:3, color:colors.muted, marginBottom:12, textTransform:'uppercase' },
  signOut:       { marginTop:16, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:14, alignItems:'center' },
  signOutTxt:    { color:colors.muted2, fontWeight:'600', fontSize:14 },
  fab:           { position:'absolute', bottom:22, right:18, width:58, height:58, backgroundColor:colors.orange, borderRadius:18, alignItems:'center', justifyContent:'center', shadowColor:colors.orange, shadowOpacity:.55, shadowRadius:16, elevation:10 },
  fabTxt:        { color:'#fff', fontSize:30, fontWeight:'300', lineHeight:36 },
})
