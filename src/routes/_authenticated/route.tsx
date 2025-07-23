import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/authStore'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const auth = useAuthStore.getState().auth
    
    // 检查是否已登录
    if (!auth.isAuthenticated || !auth.accessToken) {
      // 未登录则跳转到登录页面，并保存当前路径用于登录后跳转
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
    
    // 检查 token 是否过期
    if (auth.user && auth.user.exp < Date.now()) {
      // token 过期，清除认证状态并跳转到登录页面
      auth.logout()
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
