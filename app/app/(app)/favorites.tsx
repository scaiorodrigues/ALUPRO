import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/useAuthStore'
import { getFavorites, removeFavorite } from '../../lib/queries/favorites'
import { ProfileCard } from '../../components/ProfileCard'
import { colors, radius } from '../../constants/theme'

export default function FavoritesScreen() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const { data: favorites = [], isLoading, error } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => getFavorites(user!.id),
    enabled: !!user?.id,
  })

  const removeMut = useMutation({
    mutationFn: (profileId: string) => removeFavorite(user!.id, profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites', user?.id] }),
  })

  if (!user) return (
    <View style={s.center}>
      <Text style={s.emptyIc}>🔒</Text>
      <Text style={s.emptyTxt}>Faça login para ver seus favoritos</Text>
    </View>
  )

  if (isLoading) return <ActivityIndicator color={colors.orange} style={{ marginTop: 60 }}/>

  if (error) return (
    <View style={s.center}>
      <Text style={s.emptyIc}>⚠️</Text>
      <Text style={s.emptyTxt}>Erro ao carregar favoritos</Text>
      <Text style={s.emptySub}>Verifique sua conexão e tente novamente</Text>
    </View>
  )

  return (
    <View style={s.root}>
      <FlatList
        data={favorites}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.title}>Favoritos</Text>
            <Text style={s.count}>{favorites.length} {favorites.length === 1 ? 'PERFIL' : 'PERFIS'}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyIc}>❤️</Text>
            <Text style={s.emptyTxt}>Nenhum favorito ainda</Text>
            <Text style={s.emptySub}>Toque no coração em qualquer perfil para salvar aqui</Text>
            <TouchableOpacity style={s.exploreBtn} onPress={() => router.push('/(app)/search')}>
              <Text style={s.exploreTxt}>Explorar catálogo</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <ProfileCard
            profile={item}
            isFavorited
            onPress={() => router.push({ pathname: '/(app)/profile/[id]', params: { id: item.id } })}
            onFavorite={() => removeMut.mutate(item.id)}
          />
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  header:     { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  title:      { fontSize: 22, fontWeight: '800', color: colors.text },
  count:      { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: colors.muted },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 60 },
  emptyIc:    { fontSize: 52, marginBottom: 16 },
  emptyTxt:   { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  exploreBtn: { backgroundColor: colors.orange, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
  exploreTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
