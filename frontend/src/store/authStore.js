import { create } from 'zustand'
import axios from 'axios'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password })
      const user = response.data.user
      set({ user, isAuthenticated: true, isLoading: false })
      return { success: true }
    } catch (error) {
      set({ isLoading: false })
      return { 
        success: false, 
        message: error.response?.data?.error || '登录失败' 
      }
    }
  },

  logout: async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    try {
      const response = await axios.get('/api/auth/me')
      const user = response.data.user
      set({ user, isAuthenticated: true, isLoading: false })
      return { authenticated: true }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return { authenticated: false }
    }
  },
}))

export default useAuthStore
