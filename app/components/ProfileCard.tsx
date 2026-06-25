import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native'
import { colors, radius } from '../constants/theme'
import { ProfileSVG } from './ProfileSVG'
import type { Profile } from '../types'

interface Props {
  profile:    Profile
  isAdmin?:   boolean
  onPress:    () => void
  onEdit?:    () => void
  onDelete?:  () => void
}

export function ProfileCard({ profile, isAdmin, onPress, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <TouchableOpacity
      style={[s.card, isAdmin && s.cardAdmin]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Thumb */}
      <View style={s.thumb}>
        <ProfileSVG name={profile.name} size={44}/>
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.name}>{profile.name}</Text>
        <Text style={s.meta}>{profile.company?.name ?? '—'} · {profile.line?.name ?? '—'}</Text>
        <Text style={s.weight}>{profile.weight_per_meter} kg/m</Text>
      </View>

      {/* Right side */}
      {profile.popular && !isAdmin && (
        <View style={s.badge}><Text style={s.badgeText}>POPULAR</Text></View>
      )}

      {isAdmin ? (
        <>
          <TouchableOpacity style={s.menuBtn} onPress={() => setMenuOpen(true)}>
            <Text style={s.menuDots}>⋮</Text>
          </TouchableOpacity>

          <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
            <Pressable style={s.overlay} onPress={() => setMenuOpen(false)}>
              <View style={s.menu}>
                <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); onPress() }}>
                  <Text style={s.menuItemText}>👁  Visualizar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); onEdit?.() }}>
                  <Text style={s.menuItemText}>✏  Editar Perfil</Text>
                </TouchableOpacity>
                <View style={s.menuSep}/>
                <TouchableOpacity style={s.menuItem} onPress={() => { setMenuOpen(false); onDelete?.() }}>
                  <Text style={[s.menuItemText, { color: colors.danger }]}>✕  Excluir</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        </>
      ) : (
        <Text style={s.arrow}>›</Text>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card:         { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:colors.s2, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:13, marginBottom:9 },
  cardAdmin:    { borderColor:'rgba(255,107,26,0.2)' },
  thumb:        { width:52, height:52, backgroundColor:colors.s3, borderRadius:11, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border, overflow:'hidden' },
  info:         { flex:1, minWidth:0 },
  name:         { fontSize:16, fontWeight:'700', color:colors.text },
  meta:         { fontSize:12, color:colors.muted, marginTop:1 },
  weight:       { fontSize:12, color:colors.orange, fontWeight:'600', marginTop:3 },
  badge:        { backgroundColor:'rgba(39,194,130,.14)', borderWidth:1, borderColor:'rgba(39,194,130,.3)', borderRadius:6, paddingHorizontal:8, paddingVertical:2 },
  badgeText:    { fontSize:9, fontWeight:'700', color:colors.ok, letterSpacing:1 },
  arrow:        { color:colors.muted, fontSize:18 },
  menuBtn:      { width:34, height:34, backgroundColor:colors.orangeD, borderWidth:1, borderColor:colors.orange, borderRadius:9, alignItems:'center', justifyContent:'center' },
  menuDots:     { color:colors.orange, fontSize:18, lineHeight:22 },
  overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center' },
  menu:         { backgroundColor:colors.s3, borderWidth:1, borderColor:colors.border2, borderRadius:radius.md, minWidth:200, overflow:'hidden' },
  menuItem:     { paddingVertical:13, paddingHorizontal:18 },
  menuItemText: { fontSize:14, fontWeight:'600', color:colors.text },
  menuSep:      { height:1, backgroundColor:colors.border },
})
