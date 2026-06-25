import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/useAuthStore'
import { colors, radius } from '../../constants/theme'

export default function LoginScreen() {
  const { signIn } = useAuthStore()
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState<string | null>(null)

  const go = async () => {
    setLoading(true); setErr(null)
    try { await signIn(email, pass); router.replace('/(app)') }
    catch (e: any) { setErr(e.message ?? 'Credenciais inválidas.') }
    finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={{ flex:1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.root} keyboardShouldPersistTaps="handled">

        <View style={s.logoMark}>
          <Text style={s.logoIcon}>▬</Text>
        </View>
        <Text style={s.logoText}>ALUPRO</Text>
        <Text style={s.logoSub}>Catálogo profissional de perfis de alumínio</Text>

        <View style={s.form}>
          <Text style={s.label}>E-MAIL</Text>
          <TextInput style={s.input} placeholder="seu@email.com" placeholderTextColor={colors.muted}
            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>

          <Text style={s.label}>SENHA</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={colors.muted}
            value={pass} onChangeText={setPass} secureTextEntry onSubmitEditing={go}/>

          {err && <Text style={s.err}>{err}</Text>}

          <TouchableOpacity style={s.btnPrimary} onPress={go} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff"/> : <Text style={s.btnPrimaryText}>ENTRAR</Text>}
          </TouchableOpacity>

          <View style={s.divider}>
            <View style={s.divLine}/><Text style={s.divTxt}>ou</Text><View style={s.divLine}/>
          </View>

          <TouchableOpacity style={s.btnGoogle}>
            <Text style={s.btnGoogleText}>🔵  Continuar com Google</Text>
          </TouchableOpacity>

          <Text style={s.hint}>Demo Admin: admin@aluminio.com / admin123{'\n'}Usuário: qualquer email + senha</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:           { flexGrow:1, alignItems:'center', justifyContent:'center', padding:28, backgroundColor:colors.bg },
  logoMark:       { width:70, height:70, backgroundColor:colors.orangeD, borderWidth:1, borderColor:colors.orange, borderRadius:22, alignItems:'center', justifyContent:'center', marginBottom:20, shadowColor:colors.orange, shadowOpacity:.5, shadowRadius:20, elevation:8 },
  logoIcon:       { fontSize:26, color:colors.orange, fontWeight:'900' },
  logoText:       { fontSize:32, fontWeight:'800', color:colors.text, letterSpacing:5, marginBottom:8 },
  logoSub:        { fontSize:13, color:colors.muted, textAlign:'center', marginBottom:44, lineHeight:20, maxWidth:240 },
  form:           { width:'100%' },
  label:          { fontSize:10, fontWeight:'700', letterSpacing:3, color:colors.muted, marginBottom:6, textTransform:'uppercase' },
  input:          { backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:14, color:colors.text, fontSize:15, marginBottom:14 },
  err:            { color:colors.danger, fontSize:13, marginBottom:10, textAlign:'center' },
  btnPrimary:     { backgroundColor:colors.orange, borderRadius:radius.lg, padding:16, alignItems:'center', marginTop:6, shadowColor:colors.orange, shadowOpacity:.45, shadowRadius:14, elevation:6 },
  btnPrimaryText: { color:'#fff', fontWeight:'800', fontSize:15, letterSpacing:3 },
  divider:        { flexDirection:'row', alignItems:'center', marginVertical:18, gap:10 },
  divLine:        { flex:1, height:1, backgroundColor:colors.border },
  divTxt:         { color:colors.muted, fontSize:12 },
  btnGoogle:      { backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:14, alignItems:'center' },
  btnGoogleText:  { color:colors.muted2, fontSize:14, fontWeight:'600' },
  hint:           { marginTop:28, fontSize:11, color:colors.muted, textAlign:'center', lineHeight:18, opacity:.7 },
})
