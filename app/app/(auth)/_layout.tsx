import { Redirect } from 'expo-router'
import { Stack } from 'expo-router'
import { useAuthStore } from '../../store/useAuthStore'

export default function AuthLayout() {
  const { session, loading } = useAuthStore()
  if (!loading && session) return <Redirect href="/(app)" />
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  )
}
