import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '../../../store/useAuthStore'

export default function AdminLayout() {
  const { isAdmin, loading } = useAuthStore()
  if (!loading && !isAdmin) return <Redirect href="/(app)"/>
  return <Stack screenOptions={{ headerShown: false }}/>
}
