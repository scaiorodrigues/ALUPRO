import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native'
import { useAuthStore } from '../../store/useAuthStore'
import { router } from 'expo-router'

export default function LoginScreen() {
  const { signIn } = useAuthStore()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) { setError('Preencha email e senha.'); return }
    setLoading(true); setError(null)
    try {
      await signIn(email, password)
      router.replace('/(app)')
    } catch (e: any) {
      setError(e.message ?? 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Logo */}
      <View style={s.logoMark}>
        <Text style={s.logoIcon}>⬛</Text>
      </View>
      <Text style={s.logoText}>ALUPRO</Text>
      <Text style={s.logoSub}>Catálogo profissional de perfis de alumínio</Text>

      {/* Form */}
      <View style={s.form}>
        <Text style={s.label}>E-MAIL</Text>
        <TextInput
          style={s.input}
          placeholder="seu@email.com"
          placeholderTextColor="#5e6e88"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={s.label}>SENHA</Text>
        <TextInput
          style={s.input}
          placeholder="••••••••"
          placeholderTextColor="#5e6e88"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error && <Text style={s.error}>{error}</Text>}

        <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryText}>ENTRAR</Text>
          }
        </TouchableOpacity>

        <View style={s.divider}>
          <View style={s.divLine} />
          <Text style={s.divText}>ou</Text>
          <View style={s.divLine} />
        </View>

        <TouchableOpacity style={s.btnGoogle}>
          <Text style={s.btnGoogleText}>Continuar com Google</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:          { flex:1, backgroundColor:'#090c0f', alignItems:'center', justifyContent:'center', padding:28 },
  logoMark:      { width:68, height:68, backgroundColor:'rgba(255,107,26,.12)', borderWidth:1, borderColor:'#FF6B1A', borderRadius:20, alignItems:'center', justifyContent:'center', marginBottom:18 },
  logoIcon:      { fontSize:28, color:'#FF6B1A' },
  logoText:      { fontFamily:'System', fontSize:30, fontWeight:'700', color:'#dde4ef', letterSpacing:4, marginBottom:6 },
  logoSub:       { fontSize:13, color:'#5e6e88', textAlign:'center', marginBottom:40, lineHeight:20 },
  form:          { width:'100%' },
  label:         { fontSize:10, fontWeight:'700', letterSpacing:2, color:'#5e6e88', marginBottom:6 },
  input:         { backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:13, color:'#dde4ef', fontSize:15, marginBottom:13 },
  error:         { color:'#ff3f5f', fontSize:12, marginBottom:10, textAlign:'center' },
  btnPrimary:    { backgroundColor:'#FF6B1A', borderRadius:14, padding:15, alignItems:'center', marginTop:6, shadowColor:'#FF6B1A', shadowOpacity:.4, shadowRadius:12, elevation:6 },
  btnPrimaryText:{ color:'#fff', fontWeight:'700', fontSize:15, letterSpacing:2 },
  divider:       { flexDirection:'row', alignItems:'center', marginVertical:18, gap:10 },
  divLine:       { flex:1, height:1, backgroundColor:'#262d38' },
  divText:       { color:'#5e6e88', fontSize:12 },
  btnGoogle:     { backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:14, padding:14, alignItems:'center' },
  btnGoogleText: { color:'#8496b0', fontSize:14, fontWeight:'600' },
})
