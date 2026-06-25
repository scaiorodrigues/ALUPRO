import { View, Text, StyleSheet } from 'react-native'

export default function FavoritesScreen() {
  return (
    <View style={s.root}>
      <Text style={s.icon}>❤️</Text>
      <Text style={s.title}>Favoritos</Text>
      <Text style={s.sub}>Em breve — salve seus perfis favoritos para acesso rápido.</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root:  { flex:1, backgroundColor:'#090c0f', alignItems:'center', justifyContent:'center', padding:32 },
  icon:  { fontSize:48, marginBottom:16 },
  title: { fontSize:22, fontWeight:'700', color:'#dde4ef', marginBottom:8 },
  sub:   { fontSize:14, color:'#5e6e88', textAlign:'center', lineHeight:22 },
})
