import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import useAuthStore from './store/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout'
import Applications from './pages/Applications'
import CreateApplication from './pages/CreateApplication'
import MyQuota from './pages/MyQuota'
import ManageUsers from './pages/ManageUsers'
import ManageQuotas from './pages/ManageQuotas'
import ManageHolidayTypes from './pages/ManageHolidayTypes'
import ApproveApplications from './pages/ApproveApplications'
import CalendarView from './pages/CalendarView'
import Reports from './pages/Reports'

function App() {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore()
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth()
      setInitialCheckDone(true)
    }
    initAuth()
  }, [checkAuth])

  if (isLoading && !initialCheckDone) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/applications/new" element={<CreateApplication />} />
        <Route path="/my-quota" element={<MyQuota />} />
        <Route path="/manage/users" element={<ManageUsers />} />
        <Route path="/manage/quotas" element={<ManageQuotas />} />
        <Route path="/manage/holiday-types" element={<ManageHolidayTypes />} />
        <Route path="/approve" element={<ApproveApplications />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
