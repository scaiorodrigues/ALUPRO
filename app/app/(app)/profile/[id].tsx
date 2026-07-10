import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProfileById, getSimilarProfiles } from '../../../lib/queries/profiles'
import { getFavoriteIds, addFavorite, removeFavorite } from '../../../lib/queries/favorites'
import { useAuthStore } from '../../../store/useAuthStore'
import { ProfileSVG } from '../../../components/ProfileSVG'
import { colors, radius } from '../../../constants/theme'

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { isAdmin, user } = useAuthStore()
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn:  () => getProfileById(id),
  })
  const { data: similar = [] } = useQuery({
    queryKey: ['similar', id],
    queryFn:  () => getSimilarProfiles(id),
    enabled:  !!id,
  })
  const { data: favIds = [] } = useQuery({
    queryKey: ['favoriteIds', user?.id],
    queryFn:  () => getFavoriteIds(user!.id),
    enabled:  !!user?.id,
  })

  const toggleFav = useMutation({
    mutationFn: () =>
      favIds.includes(id)
        ? removeFavorite(user!.id, id)
        : addFavorite(user!.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favoriteIds', user?.id] })
      qc.invalidateQueries({ queryKey: ['favorites', user?.id] })
    },
  })

  if (isLoading) return <ActivityIndicator color={colors.orange} style={{ marginTop: 80 }}/>
  if (!profile)  return <Text style={{ color: colors.danger, padding: 20 }}>Perfil não encontrado.</Text>

  const isFav = favIds.includes(id)

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 48 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={{ color: colors.text, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{profile.name}</Text>
          <Text style={s.sub}>{profile.line?.name ?? '—'} · {profile.company?.name ?? '—'}</Text>
        </View>
        <View style={s.headerActions}>
          {profile.popular && (
            <View style={s.popBadge}><Text style={s.popTxt}>POPULAR</Text></View>
          )}
          {user && (
            <TouchableOpacity style={s.favBtn} onPress={() => toggleFav.mutate()}>
              <Text style={s.favIc}>{isFav ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <TouchableOpacity style={s.editBtn} onPress={() => router.push({ pathname: '/(app)/admin/edit/[id]', params: { id: profile.id } })}>
              <Text style={s.editTxt}>✏ Editar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Desenho / Imagem */}
      <View style={s.drawing}>
        {profile.drawing_url
          ? <Image source={{ uri: profile.drawing_url }} style={s.drawingImg} resizeMode="contain"/>
          : <ProfileSVG name={profile.name} size={170}/>
        }
      </View>

      {/* Info grid */}
      <View style={s.infoGrid}>
        {([
          ['Empresa',      profile.company?.name ?? '—',                       false],
          ['Peso / metro', `${profile.weight_per_meter ?? '—'} kg/m`,          true],
          ['Linha',        profile.line?.name ?? '—',                          false],
          ['Aplicação',    profile.application ?? '—',                         false],
          ...(profile.area_mm2   ? [['Área da seção', `${profile.area_mm2} mm²`,      true]  as [string,string,boolean]] : []),
          ...(profile.alloy      ? [['Liga',          profile.alloy,                  false] as [string,string,boolean]] : []),
          ...(profile.surface    ? [['Acabamento',    profile.surface,                false] as [string,string,boolean]] : []),
          ...(profile.code       ? [['Código',        profile.code,                  false] as [string,string,boolean]] : []),
        ] as [string, string, boolean][]).map(([label, value, accent]) => (
          <View key={label} style={s.infoItem}>
            <Text style={s.infoLabel}>{label}</Text>
            <Text style={[s.infoValue, accent && { color: colors.orange }]} numberOfLines={2}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Descrição */}
      {profile.description && (
        <View style={s.desc}><Text style={s.descTxt}>{profile.description}</Text></View>
      )}

      {/* Tags */}
      {profile.tags?.length > 0 && (
        <View style={s.tags}>
          {profile.tags.map(t => (
            <View key={t} style={s.tag}><Text style={s.tagTxt}>#{t}</Text></View>
          ))}
        </View>
      )}

      {/* Ações — PDF / DXF */}
      {(profile.technical_pdf || profile.dxf_url) && (
        <View style={s.actions}>
          {profile.technical_pdf && (
            <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL(profile.technical_pdf!)}>
              <Text style={s.actionIc}>📄</Text>
              <Text style={s.actionTxt}>PDF Técnico</Text>
            </TouchableOpacity>
          )}
          {profile.dxf_url && (
            <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL(profile.dxf_url!)}>
              <Text style={s.actionIc}>📐</Text>
              <Text style={s.actionTxt}>Arquivo DXF</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Perfis Similares */}
      {similar.length > 0 && (
        <View style={s.sec}>
          <Text style={s.secTitle}>Perfis Semelhantes</Text>
          {similar.map(p => (
            <TouchableOpacity
              key={p.id}
              style={s.simRow}
              onPress={() => router.push({ pathname: '/(app)/profile/[id]', params: { id: p.id } })}
            >
              <View style={s.simThumb}>
                {p.drawing_url
                  ? <Image source={{ uri: p.drawing_url }} style={{ width: 38, height: 38 }} resizeMode="contain"/>
                  : <ProfileSVG name={p.name} size={38}/>
                }
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.simName}>{p.name}</Text>
                <Text style={s.simMeta}>{p.company?.name ?? '—'} · {p.weight_per_meter} kg/m</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  back:        { width: 40, height: 40, backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 22, fontWeight: '800', color: colors.text },
  sub:         { fontSize: 12, color: colors.muted, marginTop: 2 },
  headerActions:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  popBadge:    { backgroundColor: 'rgba(39,194,130,.14)', borderWidth: 1, borderColor: 'rgba(39,194,130,.3)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  popTxt:      { fontSize: 9, fontWeight: '700', color: colors.ok, letterSpacing: 1 },
  favBtn:      { width: 36, height: 36, backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  favIc:       { fontSize: 18 },
  editBtn:     { backgroundColor: colors.orangeD, borderWidth: 1, borderColor: colors.orange, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7 },
  editTxt:     { color: colors.orange, fontSize: 12, fontWeight: '700' },
  drawing:     { margin: 14, backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: 18, minHeight: 200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  drawingImg:  { width: '100%', height: 200 },
  infoGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginHorizontal: 14 },
  infoItem:    { flex: 1, minWidth: '45%', backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
  infoLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: colors.muted, marginBottom: 3, textTransform: 'uppercase' },
  infoValue:   { fontSize: 16, fontWeight: '700', color: colors.text },
  desc:        { margin: 10, marginHorizontal: 14, backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  descTxt:     { fontSize: 13, color: colors.muted2, lineHeight: 21 },
  tags:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: 14, marginTop: 10 },
  tag:         { backgroundColor: colors.orangeD, borderWidth: 1, borderColor: 'rgba(255,107,26,.22)', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt:      { fontSize: 11, color: colors.orange, fontWeight: '600' },
  actions:     { flexDirection: 'row', gap: 10, marginHorizontal: 14, marginTop: 14 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  actionIc:    { fontSize: 20 },
  actionTxt:   { fontSize: 13, fontWeight: '700', color: colors.text },
  sec:         { padding: 14, paddingTop: 18 },
  secTitle:    { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: colors.muted, marginBottom: 12, textTransform: 'uppercase' },
  simRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.s3, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 10, marginBottom: 8 },
  simThumb:    { width: 42, height: 42, backgroundColor: colors.s2, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  simName:     { fontSize: 14, fontWeight: '700', color: colors.text },
  simMeta:     { fontSize: 11, color: colors.muted, marginTop: 1 },
})
