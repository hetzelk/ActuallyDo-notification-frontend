import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Shell } from '@/components/layout/Shell'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { MagicLinkPage } from '@/pages/MagicLinkPage'
import { ActionResultPage } from '@/pages/ActionResultPage'
import { DashboardPage } from '@/pages/nagme/DashboardPage'
import { TaskDetailPage } from '@/pages/nagme/TaskDetailPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login/magic-link" element={<MagicLinkPage />} />
            <Route path="/action-result" element={<ActionResultPage />} />

            {/* Authenticated routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Shell />}>
                <Route path="/" element={<Navigate to="/nagme" replace />} />
                <Route path="/settings" element={<div>Settings (coming soon)</div>} />
                <Route path="/nagme" element={<DashboardPage />} />
                <Route path="/nagme/tasks/:taskId" element={<TaskDetailPage />} />
                <Route path="/milesahead" element={<div>MilesAhead Dashboard (coming soon)</div>} />
                <Route path="/milesahead/vehicles/new" element={<div>Add Vehicle (coming soon)</div>} />
                <Route path="/milesahead/vehicles/:id" element={<div>Vehicle Detail (coming soon)</div>} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
