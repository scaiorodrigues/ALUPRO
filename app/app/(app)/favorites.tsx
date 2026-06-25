import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/theme'
export default function FavoritesScreen() {
  return (
    <View style={s.root}>
      <Text style={s.ic}>❤️</Text>
      <Text style={s.title}>Favoritos</Text>
      <Text style={s.sub}>Em breve — salve seus perfis favoritos para acesso rápido.</Text>
    </View>
  )
}
const s = StyleSheet.create({
  root:  { flex:1, backgroundColor:colors.bg, alignItems:'center', justifyContent:'center', padding:32 },
  ic:    { fontSize:52, marginBottom:18 },
  title: { fontSize:22, fontWeight:'800', color:colors.text, marginBottom:8 },
  sub:   { fontSize:14, color:colors.muted, textAlign:'center', lineHeight:22 },
})
