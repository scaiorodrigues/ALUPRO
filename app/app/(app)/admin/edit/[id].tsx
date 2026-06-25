import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { getProfileById, createProfile, updateProfile, uploadDrawing } from '../../../../lib/queries/profiles'
import { colors, radius } from '../../../../constants/theme'
import { ProfileSVG } from '../../../../components/ProfileSVG'

const COMPANIES = ['Brasal','Hydro','Albrás','Alcoa','Novelis']
const LINES     = ['Solar','Industrial','Arquitetônica','Construção Civil','Automotiva']

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew   = id === 'new'
  const qc      = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn:  () => getProfileById(id),
    enabled:  !isNew,
  })

  const [form, setForm] = useState({
    name:'', application:'', weight:'', tags:'', description:'', popular:false,
  })
  const [imgUri,  setImgUri]  = useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)
  const f = (k: string, v: any) => setForm(x => ({ ...x, [k]: v }))

  useEffect(() => {
    if (existing) setForm({
      name:        existing.name ?? '',
      application: existing.application ?? '',
      weight:      String(existing.weight_per_meter ?? ''),
      tags:        (existing.tags ?? []).join(', '),
      description: existing.description ?? '',
      popular:     existing.popular ?? false,
    })
  }, [existing])

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permissão de galeria necessária'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ quality:0.9 })
    if (!r.canceled) setImgUri(r.assets[0].uri)
  }

  const save = async () => {
    if (!form.name) { Alert.alert('Nome é obrigatório'); return }
    setSaving(true)
    try {
      let drawing_url = existing?.drawing_url
      if (imgUri) drawing_url = await uploadDrawing(imgUri, form.name).catch(() => undefined)

      const payload = {
        name:             form.name,
        application:      form.application,
        weight_per_meter: parseFloat(form.weight) || 0,
        tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
        description:      form.description,
        popular:          form.popular,
        ...(drawing_url && { drawing_url }),
      }

      if (isNew) await createProfile(payload)
      else        await updateProfile(id, payload)

      qc.invalidateQueries({ queryKey:['profiles'] })
      router.back()
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message)
    } finally {
      setSaving(false) }
  }

  if (!isNew && isLoading) return <ActivityIndicator color={colors.orange} style={{ marginTop:80 }}/>

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding:18, paddingBottom:60 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={{ color:colors.text, fontSize:20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{isNew ? 'Novo Perfil' : `Editar: ${existing?.name ?? ''}`}</Text>
      </View>

      {/* Upload / Preview */}
      <TouchableOpacity style={[s.uploadZone, imgUri && s.uploadZoneActive]} onPress={pickImage}>
        {imgUri ? (
          <>
            <ProfileSVG name={form.name || 'T'} size={80}/>
            <Text style={[s.upLabel, { color:colors.orange }]}>✓ Imagem selecionada — toque para trocar</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize:34, marginBottom:8 }}>📐</Text>
            <Text style={s.upLabel}>Toque para enviar o desenho do perfil</Text>
            <Text style={s.upSub}>PNG, JPG, SVG recomendado</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Campos */}
      {([
        { label:'Nome do Perfil *',  key:'name',        ph:'Ex: T-3030',               kb:'default' },
        { label:'Aplicação',         key:'application', ph:'Ex: Estrutural / Solar',    kb:'default' },
        { label:'Peso (kg/m)',       key:'weight',      ph:'0.842',                     kb:'decimal-pad' },
        { label:'Tags (vírgula)',    key:'tags',        ph:'solar, estrutural, rack',   kb:'default' },
      ] as const).map(({ label, key, ph, kb }) => (
        <View key={key} style={s.fgroup}>
          <Text style={s.flabel}>{label.toUpperCase()}</Text>
          <TextInput
            style={s.finput}
            placeholder={ph}
            placeholderTextColor={colors.muted}
            value={(form as any)[key]}
            onChangeText={v => f(key, v)}
            keyboardType={kb as any}
          />
        </View>
      ))}

      <View style={s.fgroup}>
        <Text style={s.flabel}>DESCRIÇÃO TÉCNICA</Text>
        <TextInput
          style={[s.finput, { height:96, textAlignVertical:'top' }]}
          placeholder="Características técnicas, usos, normas..."
          placeholderTextColor={colors.muted}
          value={form.description}
          onChangeText={v => f('description', v)}
          multiline
        />
      </View>

      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Marcar como Popular</Text>
        <Switch value={form.popular} onValueChange={v => f('popular', v)}
          thumbColor={form.popular ? colors.orange : colors.muted}
          trackColor={{ false:colors.border, true:'rgba(255,107,26,.4)' }}/>
      </View>

      <TouchableOpacity style={s.btnSave} onPress={save} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff"/>
          : <Text style={s.btnSaveTxt}>{isNew ? 'ADICIONAR PERFIL' : 'SALVAR ALTERAÇÕES'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:            { flex:1, backgroundColor:colors.bg },
  header:          { flexDirection:'row', alignItems:'center', gap:12, marginBottom:20 },
  back:            { width:40, height:40, backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:12, alignItems:'center', justifyContent:'center' },
  title:           { fontSize:19, fontWeight:'800', color:colors.text, flex:1 },
  uploadZone:      { borderWidth:2, borderColor:colors.border2, borderStyle:'dashed', borderRadius:16, padding:24, alignItems:'center', marginBottom:20, backgroundColor:colors.s2 },
  uploadZoneActive:{ borderStyle:'solid', borderColor:colors.orange, backgroundColor:colors.orangeD },
  upLabel:         { fontSize:12, fontWeight:'700', color:colors.muted, letterSpacing:1, textAlign:'center' },
  upSub:           { fontSize:11, color:colors.border2, marginTop:4 },
  fgroup:          { marginBottom:14 },
  flabel:          { fontSize:10, fontWeight:'700', letterSpacing:2, color:colors.muted, marginBottom:7 },
  finput:          { backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:14, color:colors.text, fontSize:14 },
  switchRow:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:15, marginBottom:22 },
  switchLabel:     { fontSize:14, fontWeight:'600', color:colors.text },
  btnSave:         { backgroundColor:colors.orange, borderRadius:radius.lg, padding:17, alignItems:'center', shadowColor:colors.orange, shadowOpacity:.45, shadowRadius:14, elevation:6 },
  btnSaveTxt:      { color:'#fff', fontWeight:'800', fontSize:15, letterSpacing:3 },
})
