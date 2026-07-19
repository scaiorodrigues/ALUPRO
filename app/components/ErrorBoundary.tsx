import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <View style={s.container}>
          <Text style={s.title}>Crash detectado</Text>
          <Text style={s.subtitle}>{this.state.error.message}</Text>
          <ScrollView style={s.scroll}>
            <Text style={s.stack}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 20, paddingTop: 60 },
  title:     { color: '#ff4444', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  subtitle:  { color: '#ffffff', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  scroll:    { flex: 1, backgroundColor: '#111', borderRadius: 8, padding: 12 },
  stack:     { color: '#aaa', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
})
