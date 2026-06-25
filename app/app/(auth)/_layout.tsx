import { Stack } from 'expo-router'
import { useAuthStore } from '../../store/useAuthStore'
import { Redirect } from 'expo-router'

export default function AuthLayout() {
  const { session, loading } = useAuthStore()
  if (!loading && session) return <Redirect href="/(app)"/>
  return <Stack screenOptions={{ headerShown: false }}/>
}
