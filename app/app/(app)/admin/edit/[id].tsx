import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, ActivityIndicator, Alert
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import {
  getProfileById, createProfile, updateProfile, uploadDrawing
} from '../../../../lib/queries/profiles'

export default function EditProfileScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const isNew   = id === 'new'
  const qc      = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn:  () => getProfileById(id),
    enabled:  !isNew,
  })

  const [form, setForm] = useState({
    name: '', application: '', weight_per_meter: '',
    tags: '', description: '', popular: false, drawing_url: '',
  })
  const [imgUri, setImgUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (existing) setForm({
      name:             existing.name ?? '',
      application:      existing.application ?? '',
      weight_per_meter: String(existing.weight_per_meter ?? ''),
      tags:             (existing.tags ?? []).join(', '),
      description:      existing.description ?? '',
      popular:          existing.popular ?? false,
      drawing_url:      existing.drawing_url ?? '',
    })
  }, [existing])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permissão necessária'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    })
    if (!result.canceled) setImgUri(result.assets[0].uri)
  }

  const handleSave = async () => {
    if (!form.name) { Alert.alert('Nome é obrigatório'); return }
    setSaving(true)
    try {
      let drawing_url = form.drawing_url
      if (imgUri) drawing_url = await uploadDrawing(imgUri, form.name)

      const payload = {
        name:             form.name,
        application:      form.application,
        weight_per_meter: parseFloat(form.weight_per_meter) || 0,
        tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
        description:      form.description,
        popular:          form.popular,
        drawing_url,
      }

      if (isNew) await createProfile(payload)
      else        await updateProfile(id, payload)

      qc.invalidateQueries({ queryKey: ['profiles'] })
      router.back()
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && isLoading) return <ActivityIndicator color="#FF6B1A" style={{ marginTop:80 }} />

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding:18, paddingBottom:60 }}>
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={{ color:'#dde4ef', fontSize:18 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{isNew ? 'Novo Perfil' : `Editar: ${existing?.name ?? ''}`}</Text>
      </View>

      {/* Upload imagem */}
      <TouchableOpacity style={s.uploadZone} onPress={pickImage}>
        <Text style={{ fontSize:32, marginBottom:6 }}>📐</Text>
        <Text style={s.uploadLabel}>
          {imgUri ? '✓ Imagem selecionada — toque para trocar'
                  : form.drawing_url ? '✓ Já tem imagem — toque para trocar'
                  : 'Toque para enviar o desenho do perfil'}
        </Text>
        <Text style={s.uploadSub}>PNG, JPG, SVG — fundo transparente recomendado</Text>
      </TouchableOpacity>

      {[
        { label:'Nome do Perfil *', key:'name',        placeholder:'Ex: T-3030' },
        { label:'Aplicação',        key:'application',  placeholder:'Ex: Estrutural / Energia Solar' },
        { label:'Peso (kg/m)',      key:'weight_per_meter', placeholder:'0.842', keyboard:'decimal-pad' },
        { label:'Tags (vírgula)',   key:'tags',         placeholder:'solar, estrutural, rack' },
      ].map(({ label, key, placeholder, keyboard }) => (
        <View key={key} style={s.fgroup}>
          <Text style={s.flabel}>{label.toUpperCase()}</Text>
          <TextInput
            style={s.finput}
            placeholder={placeholder}
            placeholderTextColor="#5e6e88"
            value={(form as any)[key]}
            onChangeText={(v) => set(key, v)}
            keyboardType={(keyboard as any) ?? 'default'}
          />
        </View>
      ))}

      <View style={s.fgroup}>
        <Text style={s.flabel}>DESCRIÇÃO TÉCNICA</Text>
        <TextInput
          style={[s.finput, { height:90, textAlignVertical:'top' }]}
          placeholder="Características técnicas, usos, normas..."
          placeholderTextColor="#5e6e88"
          value={form.description}
          onChangeText={(v) => set('description', v)}
          multiline
        />
      </View>

      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Marcar como Popular</Text>
        <Switch
          value={form.popular}
          onValueChange={(v) => set('popular', v)}
          thumbColor={form.popular ? '#FF6B1A' : '#5e6e88'}
          trackColor={{ false:'#262d38', true:'rgba(255,107,26,.4)' }}
        />
      </View>

      <TouchableOpacity style={s.btnSave} onPress={handleSave} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnSaveText}>{isNew ? 'ADICIONAR PERFIL' : 'SALVAR ALTERAÇÕES'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:        { flex:1, backgroundColor:'#090c0f' },
  header:      { flexDirection:'row', alignItems:'center', gap:12, marginBottom:20 },
  back:        { width:38, height:38, backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:11, alignItems:'center', justifyContent:'center' },
  title:       { fontSize:19, fontWeight:'700', color:'#dde4ef', flex:1 },
  uploadZone:  { borderWidth:2, borderColor:'#38424f', borderStyle:'dashed', borderRadius:15, padding:22, alignItems:'center', marginBottom:18, backgroundColor:'#181c22' },
  uploadLabel: { fontSize:12, fontWeight:'700', color:'#5e6e88', letterSpacing:1, textAlign:'center' },
  uploadSub:   { fontSize:11, color:'#3a4255', marginTop:4 },
  fgroup:      { marginBottom:14 },
  flabel:      { fontSize:10, fontWeight:'700', letterSpacing:2, color:'#5e6e88', marginBottom:6 },
  finput:      { backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:13, color:'#dde4ef', fontSize:14 },
  switchRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#181c22', borderWidth:1, borderColor:'#262d38', borderRadius:13, padding:14, marginBottom:20 },
  switchLabel: { fontSize:14, fontWeight:'600', color:'#dde4ef' },
  btnSave:     { backgroundColor:'#FF6B1A', borderRadius:14, padding:16, alignItems:'center', shadowColor:'#FF6B1A', shadowOpacity:.4, shadowRadius:14, elevation:6 },
  btnSaveText: { color:'#fff', fontWeight:'700', fontSize:15, letterSpacing:2 },
})
