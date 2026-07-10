import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { getPopularProfiles, getProfilesByCompany } from '../../lib/queries/profiles'
import { getCompanies } from '../../lib/queries/companies'
import { getFavoriteIds, addFavorite, removeFavorite } from '../../lib/queries/favorites'
import { useSearchStore } from '../../store/useSearchStore'
import { useAuthStore } from '../../store/useAuthStore'
import { ProfileCard } from '../../components/ProfileCard'
import { colors, radius } from '../../constants/theme'

export default function HomeScreen() {
  const { history, setQuery, addHistory } = useSearchStore()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const { data: popular = [], isLoading } = useQuery({
    queryKey: ['profiles', 'popular'],
    queryFn: () => getPopularProfiles(6),
  })
  const { data: byCompany = [], isLoading: loadingByCompany } = useQuery({
    queryKey: ['profiles', 'company', selectedCompany],
    queryFn: () => getProfilesByCompany(selectedCompany!),
    enabled: !!selectedCompany,
  })
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
  })
  const { data: favIds = [] } = useQuery({
    queryKey: ['favoriteIds', user?.id],
    queryFn: () => getFavoriteIds(user!.id),
    enabled: !!user?.id,
  })

  const toggleFav = useMutation({
    mutationFn: (profileId: string) =>
      favIds.includes(profileId)
        ? removeFavorite(user!.id, profileId)
        : addFavorite(user!.id, profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favoriteIds', user?.id] })
      qc.invalidateQueries({ queryKey: ['favorites', user?.id] })
    },
  })

  const goSearch = (q: string) => { setQuery(q); addHistory(q); router.push('/(app)/search') }
  const goProfile = (id: string) => router.push({ pathname: '/(app)/profile/[id]', params: { id } })

  const displayProfiles = selectedCompany ? byCompany : popular
  const displayLoading  = selectedCompany ? loadingByCompany : isLoading
  const displayTitle    = selectedCompany
    ? (companies.find(c => c.id === selectedCompany)?.name ?? 'Empresa')
    : 'Mais Populares'

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Histórico de buscas */}
      {history.length > 0 && (
        <View style={s.sec}>
          <View style={s.secRow}>
            <Text style={s.secTitle}>Buscas Recentes</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {history.map(h => (
              <TouchableOpacity key={h} style={s.chip} onPress={() => goSearch(h)}>
                <Text style={s.chipTxt}>{h}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Empresas */}
      <View style={s.sec}>
        <Text style={s.secTitle}>Empresas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
          {/* "Todos" */}
          <TouchableOpacity
            style={[s.company, !selectedCompany && s.companyActive]}
            onPress={() => setSelectedCompany(null)}
          >
            <View style={[s.companyLogo, !selectedCompany && s.companyLogoActive]}>
              <Text style={[s.companyInitial, !selectedCompany && { color: '#fff' }]}>✦</Text>
            </View>
            <Text style={[s.companyName, !selectedCompany && { color: colors.orange }]}>Todos</Text>
          </TouchableOpacity>

          {companies.map(c => {
            const active = selectedCompany === c.id
            return (
              <TouchableOpacity
                key={c.id}
                style={[s.company, active && s.companyActive]}
                onPress={() => setSelectedCompany(active ? null : c.id)}
              >
                <View style={[s.companyLogo, active && s.companyLogoActive]}>
                  <Text style={[s.companyInitial, active && { color: '#fff' }]}>{c.name.slice(0, 2)}</Text>
                </View>
                <Text style={[s.companyName, active && { color: colors.orange }]}>{c.name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Perfis */}
      <View style={s.sec}>
        <Text style={s.secTitle}>{displayTitle}</Text>
        {displayLoading
          ? <ActivityIndicator color={colors.orange}/>
          : displayProfiles.length === 0
            ? (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>Nenhum perfil cadastrado</Text>
                <Text style={s.emptySub}>Use o painel Admin para adicionar perfis</Text>
              </View>
            )
            : displayProfiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                isFavorited={favIds.includes(p.id)}
                onPress={() => goProfile(p.id)}
                onFavorite={user ? () => toggleFav.mutate(p.id) : undefined}
              />
            ))
        }
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.bg },
  sec:               { padding: 15, paddingTop: 18 },
  secRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle:          { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: colors.muted, marginBottom: 12, textTransform: 'uppercase' },
  chip:              { backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipTxt:           { fontSize: 12, color: colors.muted2, fontWeight: '600' },
  company:           { backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 5, minWidth: 80 },
  companyActive:     { borderColor: colors.orange, backgroundColor: colors.orangeD },
  companyLogo:       { width: 38, height: 38, backgroundColor: colors.s3, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  companyLogoActive: { backgroundColor: colors.orange },
  companyInitial:    { color: colors.orange, fontWeight: '800', fontSize: 13 },
  companyName:       { fontSize: 10, color: colors.muted2, fontWeight: '600' },
  empty:             { alignItems: 'center', paddingVertical: 32 },
  emptyTxt:          { fontSize: 15, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  emptySub:          { fontSize: 12, color: colors.muted, textAlign: 'center' },
})
