import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Shell } from '@/components/layout/Shell'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { MagicLinkPage } from '@/pages/MagicLinkPage'
import { ActionResultPage } from '@/pages/ActionResultPage'
import { DashboardPage } from '@/pages/tuskdue/DashboardPage'

const TaskDetailPage = lazy(() => import('@/pages/tuskdue/TaskDetailPage').then(m => ({ default: m.TaskDetailPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const WrenchDueDashboardPage = lazy(() => import('@/pages/wrenchdue/DashboardPage').then(m => ({ default: m.WrenchDueDashboardPage })))
const AddVehiclePage = lazy(() => import('@/pages/wrenchdue/AddVehiclePage').then(m => ({ default: m.AddVehiclePage })))
const VehicleDetailPage = lazy(() => import('@/pages/wrenchdue/VehicleDetailPage').then(m => ({ default: m.VehicleDetailPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login/magic-link" element={<MagicLinkPage />} />
                <Route path="/action-result" element={<ActionResultPage />} />

                {/* Authenticated routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Shell />}>
                    <Route path="/" element={<Navigate to="/tuskdue" replace />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/tuskdue" element={<DashboardPage />} />
                    <Route path="/tuskdue/tasks/:taskId" element={<TaskDetailPage />} />
                    <Route path="/wrenchdue" element={<WrenchDueDashboardPage />} />
                    <Route path="/wrenchdue/vehicles/new" element={<AddVehiclePage />} />
                    <Route path="/wrenchdue/vehicles/:id" element={<VehicleDetailPage />} />
                  </Route>
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App
