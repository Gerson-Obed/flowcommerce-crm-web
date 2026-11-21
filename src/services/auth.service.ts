import type { LoginPayload, LoginResponse, ProfileInput, User } from '@/types/domain'
import { http } from './http'

export const authService = {
  login: (payload: LoginPayload) => http.post<LoginResponse>('/auth/login', payload),
  me: () => http.get<User>('/auth/me'),
  logout: () => http.post<{ ok: boolean }>('/auth/logout'),
  updateProfile: (input: ProfileInput) => http.patch<User>('/auth/me', input),
  users: () => http.get<User[]>('/users'),
}
