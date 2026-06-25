import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { SvgUri } from 'react-native-svg'
import { getProfileById, getSimilarProfiles } from '../../../lib/queries/profiles'
import { useAuthStore } from '../../../store/useAuthStore'

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin } = useAuthStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn:  () => getProfileById(id),
  })

  const { data: similar = [] } = useQuery({
    queryKey: ['similar', id],
    queryFn:  () => getSimilarProfiles(id),
    enabled:  !!id,
  })

  if (isLoading) return <ActivityIndicator color="#FF6B1A" style={{ marginTop: 80 }} />
  if (!profile)  return <Text style={{ color:'#ff3f5f', padding:20 }}>Perfil não encontrado.</Text>

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={{ color:'#dde4ef', fontSize:18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.title}>{profile.name}</Text>
          <Text style={s.sub}>{profile.line?.name ?? '—'} · {profile.company?.name ?? '—'}</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => router.push(`/(app)/admin/edit/${id}`)}
          >
            <Text style={s.editText}>✏ Editar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Desenho */}
      <View style={s.drawing}>
        {profile.drawing_url ? (
          profile.drawing_url.endsWith('.svg')
            ? <SvgUri width="100%" height="180" uri={profile.drawing_url} />
            : <Text style={{ color:'#5e6e88' }}>[Imagem: {profile.name}]</Text>
        ) : (
          <Text style={s.noDrawing}>Desenho não disponível</Text>
        )}
      </View>

      {/* Info grid */}
      <View style={s.infoGrid}>
        {[
          ['Empresa',    profile.company?.name ?? '—'],
          ['Peso / metro', `${profile.weight_per_meter} kg/m`],
          ['Linha',      profile.line?.name ?? '—'],
          ['Aplicação',  profile.application ?? '—'],
        ].map(([label, value]) => (
          <View key={label} style={s.infoItem}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={[s.infoValue, label === 'Peso / metro' && { color:'#FF6B1A' }]}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      {/* Descrição */}
      {profile.description && (
        <View style={s.desc}><Text style={s.descText}>{profile.description}</Text></View>
      )}

      {/* Tags */}
      <View style={s.tags}>
        {profile.tags?.map((t) => (
          <View key={t} style={s.tag}><Text style={s.tagText}>#{t}</Text></View>
        ))}
      </View>

      {/* Similares */}
      {similar.length > 0 && (
        <View style={s.sec}>
          <Text style={s.secTitle}>Perfis Semelhantes</Text>
          {similar.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={s.simRow}
              onPress={() => router.push(`/(app)/profile/${p.id}`)}
            >
              <View style={s.simThumb}>
                <Text style={{ color:'#FF6B1A', fontWeight:'700' }}>{p.name?.charAt(0)}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:'#dde4ef', fontWeight:'700', fontSize:14 }}>{p.name}</Text>
                <Text style={{ color:'#5e6e88', fontSize:11 }}>
                  {p.company?.name ?? '—'} · {p.weight_per_meter} kg/m
                </Text>
              </View>
              <Text style={{ color:'#5e6e88' }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:      { flex:1, backgroundColor:'#090c0f' },
  header:    { flexDirection:'row', alignItems:'center', gap:12, padding:14, paddingTop:14 },
  back:      { width:38, height:38, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:11, alignItems:'center', justifyContent:'center' },
  title:     { fontSize:22, fontWeight:'700', color:'#dde4ef' },
  sub:       { fontSize:12, color:'#5e6e88', marginTop:1 },
  editBtn:   { backgroundColor:'rgba(255,107,26,.12)', borderWidth:1, borderColor:'#FF6B1A', borderRadius:9, paddingHorizontal:10, paddingVertical:6 },
  editText:  { color:'#FF6B1A', fontSize:12, fontWeight:'700' },
  drawing:   { margin:14, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:18, minHeight:190, alignItems:'center', justifyContent:'center' },
  noDrawing: { color:'#5e6e88', fontSize:13 },
  infoGrid:  { flexDirection:'row', flexWrap:'wrap', gap:9, marginHorizontal:14 },
  infoItem:  { flex:1, minWidth:'45%', backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:12 },
  infoLabel: { fontSize:10, fontWeight:'700', letterSpacing:2, color:'#5e6e88', marginBottom:3 },
  infoValue: { fontSize:16, fontWeight:'700', color:'#dde4ef' },
  desc:      { margin:10, marginHorizontal:14, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:14 },
  descText:  { fontSize:13, color:'#8496b0', lineHeight:20 },
  tags:      { flexDirection:'row', flexWrap:'wrap', gap:6, marginHorizontal:14, marginTop:10 },
  tag:       { backgroundColor:'rgba(255,107,26,.1)', borderWidth:1, borderColor:'rgba(255,107,26,.22)', borderRadius:7, paddingHorizontal:10, paddingVertical:3 },
  tagText:   { fontSize:11, color:'#FF6B1A', fontWeight:'600' },
  sec:       { padding:14, paddingTop:18 },
  secTitle:  { fontSize:10, fontWeight:'700', letterSpacing:3, color:'#5e6e88', marginBottom:11, textTransform:'uppercase' },
  simRow:    { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#1e232b', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:10, marginBottom:8 },
  simThumb:  { width:42, height:42, backgroundColor:'#181c22', borderRadius:9, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#262d38' },
})
