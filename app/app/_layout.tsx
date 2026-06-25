import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 }
  }
})

export default function RootLayout() {
  const { setSession } = useAuthStore()

  useEffect(() => {
    // Restaura sessão ao iniciar
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // Escuta mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#090c0f" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)"  options={{ animation: 'fade' }} />
          <Stack.Screen name="(app)"   options={{ animation: 'fade' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
