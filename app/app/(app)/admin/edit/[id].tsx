import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { getProfileById, createProfile, updateProfile, uploadDrawing } from '../../../../lib/queries/profiles'
import { getCompanies, getProductLines } from '../../../../lib/queries/companies'
import { colors, radius } from '../../../../constants/theme'
import { ProfileSVG } from '../../../../components/ProfileSVG'

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const isNew = id === 'new'
  const qc    = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['profile', id],
    queryFn:  () => getProfileById(id),
    enabled:  !isNew,
  })
  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: getCompanies })

  const [form, setForm] = useState({
    name: '', code: '', application: '', weight: '', area: '',
    alloy: '6063-T5', surface: 'Anodizado', tags: '', description: '',
    popular: false, company_id: '', line_id: '',
  })
  const [imgUri, setImgUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const f = (k: string, v: any) => setForm(x => ({ ...x, [k]: v }))

  // Linhas filtradas pela empresa selecionada
  const { data: lines = [] } = useQuery({
    queryKey: ['lines', form.company_id],
    queryFn:  () => getProductLines(form.company_id),
    enabled:  !!form.company_id,
  })

  useEffect(() => {
    if (existing) setForm({
      name:        existing.name ?? '',
      code:        existing.code ?? '',
      application: existing.application ?? '',
      weight:      String(existing.weight_per_meter ?? ''),
      area:        String(existing.area_mm2 ?? ''),
      alloy:       existing.alloy ?? '6063-T5',
      surface:     existing.surface ?? 'Anodizado',
      tags:        (existing.tags ?? []).join(', '),
      description: existing.description ?? '',
      popular:     existing.popular ?? false,
      company_id:  existing.company_id ?? '',
      line_id:     existing.line_id ?? '',
    })
  }, [existing])

  // Reseta linha quando empresa muda
  const setCompany = (cid: string) => setForm(x => ({ ...x, company_id: cid, line_id: '' }))

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permissão de galeria necessária'); return }
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 })
    if (!r.canceled) setImgUri(r.assets[0].uri)
  }

  const save = async () => {
    if (!form.name)       { Alert.alert('Nome é obrigatório'); return }
    if (!form.company_id) { Alert.alert('Selecione uma empresa'); return }
    setSaving(true)
    try {
      let drawing_url = existing?.drawing_url
      if (imgUri) drawing_url = await uploadDrawing(imgUri, form.name).catch(() => undefined)

      const payload = {
        name:             form.name,
        code:             form.code || null,
        company_id:       form.company_id,
        line_id:          form.line_id || null,
        application:      form.application || null,
        weight_per_meter: parseFloat(form.weight) || 0,
        area_mm2:         parseFloat(form.area) || null,
        alloy:            form.alloy || null,
        surface:          form.surface || null,
        tags:             form.tags.split(',').map(t => t.trim()).filter(Boolean),
        description:      form.description || null,
        popular:          form.popular,
        ...(drawing_url && { drawing_url }),
      }

      if (isNew) await createProfile(payload)
      else       await updateProfile(id, payload)

      qc.invalidateQueries({ queryKey: ['profiles'] })
      router.back()
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && isLoading) return <ActivityIndicator color={colors.orange} style={{ marginTop: 80 }}/>

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={{ color: colors.text, fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>{isNew ? 'Novo Perfil' : `Editar: ${existing?.name ?? ''}`}</Text>
      </View>

      {/* Upload / Preview */}
      <TouchableOpacity style={[s.uploadZone, imgUri && s.uploadZoneActive]} onPress={pickImage}>
        {imgUri ? (
          <>
            <ProfileSVG name={form.name || 'T'} size={80}/>
            <Text style={[s.upLabel, { color: colors.orange }]}>✓ Imagem selecionada — toque para trocar</Text>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 34, marginBottom: 8 }}>📐</Text>
            <Text style={s.upLabel}>Toque para enviar o desenho do perfil</Text>
            <Text style={s.upSub}>PNG, JPG, SVG recomendado</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Empresa */}
      <View style={s.fgroup}>
        <Text style={s.flabel}>EMPRESA *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          {companies.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[s.pill, form.company_id === c.id && s.pillActive]}
              onPress={() => setCompany(c.id)}
            >
              <Text style={[s.pillTxt, form.company_id === c.id && s.pillTxtActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Linha de Produto */}
      {form.company_id && (
        <View style={s.fgroup}>
          <Text style={s.flabel}>LINHA DE PRODUTO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <TouchableOpacity
              style={[s.pill, !form.line_id && s.pillActive]}
              onPress={() => f('line_id', '')}
            >
              <Text style={[s.pillTxt, !form.line_id && s.pillTxtActive]}>Nenhuma</Text>
            </TouchableOpacity>
            {lines.map(l => (
              <TouchableOpacity
                key={l.id}
                style={[s.pill, form.line_id === l.id && s.pillActive]}
                onPress={() => f('line_id', l.id)}
              >
                <Text style={[s.pillTxt, form.line_id === l.id && s.pillTxtActive]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Campos de texto */}
      {([
        { label: 'Nome do Perfil *', key: 'name',        ph: 'Ex: T-3030',               kb: 'default'     },
        { label: 'Código interno',   key: 'code',        ph: 'Ex: BR-T3030-B',           kb: 'default'     },
        { label: 'Aplicação',        key: 'application', ph: 'Ex: Estrutural / Solar',    kb: 'default'     },
        { label: 'Peso (kg/m)',      key: 'weight',      ph: '0.842',                    kb: 'decimal-pad' },
        { label: 'Área seção (mm²)', key: 'area',        ph: '320.5',                    kb: 'decimal-pad' },
        { label: 'Liga',             key: 'alloy',       ph: '6063-T5',                  kb: 'default'     },
        { label: 'Acabamento',       key: 'surface',     ph: 'Anodizado / Natural',      kb: 'default'     },
        { label: 'Tags (vírgula)',   key: 'tags',        ph: 'solar, estrutural, rack',  kb: 'default'     },
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
          style={[s.finput, { height: 96, textAlignVertical: 'top' }]}
          placeholder="Características técnicas, usos, normas..."
          placeholderTextColor={colors.muted}
          value={form.description}
          onChangeText={v => f('description', v)}
          multiline
        />
      </View>

      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Marcar como Popular</Text>
        <Switch
          value={form.popular}
          onValueChange={v => f('popular', v)}
          thumbColor={form.popular ? colors.orange : colors.muted}
          trackColor={{ false: colors.border, true: 'rgba(255,107,26,.4)' }}
        />
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
  root:            { flex: 1, backgroundColor: colors.bg },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  back:            { width: 40, height: 40, backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:           { fontSize: 19, fontWeight: '800', color: colors.text, flex: 1 },
  uploadZone:      { borderWidth: 2, borderColor: colors.border2, borderStyle: 'dashed', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, backgroundColor: colors.s2 },
  uploadZoneActive:{ borderStyle: 'solid', borderColor: colors.orange, backgroundColor: colors.orangeD },
  upLabel:         { fontSize: 12, fontWeight: '700', color: colors.muted, letterSpacing: 1, textAlign: 'center' },
  upSub:           { fontSize: 11, color: colors.border2, marginTop: 4 },
  fgroup:          { marginBottom: 14 },
  flabel:          { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: colors.muted, marginBottom: 7 },
  finput:          { backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.text, fontSize: 14 },
  pill:            { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, backgroundColor: colors.s2 },
  pillActive:      { backgroundColor: colors.orangeD, borderColor: colors.orange },
  pillTxt:         { fontSize: 13, color: colors.muted2, fontWeight: '600' },
  pillTxtActive:   { color: colors.orange },
  switchRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.s2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 15, marginBottom: 22 },
  switchLabel:     { fontSize: 14, fontWeight: '600', color: colors.text },
  btnSave:         { backgroundColor: colors.orange, borderRadius: radius.lg, padding: 17, alignItems: 'center', shadowColor: colors.orange, shadowOpacity: .45, shadowRadius: 14, elevation: 6 },
  btnSaveTxt:      { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 3 },
})
