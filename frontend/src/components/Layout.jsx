import React from 'react'
import { Layout as AntLayout, Menu, Dropdown, Avatar, Button } from 'antd'
import {
  DashboardOutlined,
  FormOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const { Header, Sider, Content } = AntLayout

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const getMenuItems = () => {
    const items = [
      {
        key: '/',
        icon: <DashboardOutlined />,
        label: '工作台',
        onClick: () => navigate('/')
      }
    ]

    if (user?.role === 'employee') {
      items.push(
        {
          key: '/applications/new',
          icon: <PlusOutlined />,
          label: '提交申请',
          onClick: () => navigate('/applications/new')
        },
        {
          key: '/applications',
          icon: <FileTextOutlined />,
          label: '我的申请',
          onClick: () => navigate('/applications')
        },
        {
          key: '/my-quota',
          icon: <SettingOutlined />,
          label: '我的额度',
          onClick: () => navigate('/my-quota')
        }
      )
    }

    if (user?.role === 'manager') {
      items.push(
        {
          key: '/approve',
          icon: <FormOutlined />,
          label: '待审核',
          onClick: () => navigate('/approve')
        },
        {
          key: '/applications',
          icon: <FileTextOutlined />,
          label: '请假记录',
          onClick: () => navigate('/applications')
        },
        {
          key: '/calendar',
          icon: <CalendarOutlined />,
          label: '日历视图',
          onClick: () => navigate('/calendar')
        },
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: '报表导出',
          onClick: () => navigate('/reports')
        }
      )
    }

    if (user?.role === 'admin') {
      items.push(
        {
          key: '/approve',
          icon: <FormOutlined />,
          label: '待审核',
          onClick: () => navigate('/approve')
        },
        {
          key: '/applications',
          icon: <FileTextOutlined />,
          label: '请假记录',
          onClick: () => navigate('/applications')
        },
        {
          key: '/manage/users',
          icon: <TeamOutlined />,
          label: '用户管理',
          onClick: () => navigate('/manage/users')
        },
        {
          key: '/manage/holiday-types',
          icon: <SettingOutlined />,
          label: '假期类型',
          onClick: () => navigate('/manage/holiday-types')
        },
        {
          key: '/manage/quotas',
          icon: <SettingOutlined />,
          label: '额度配置',
          onClick: () => navigate('/manage/quotas')
        },
        {
          key: '/calendar',
          icon: <CalendarOutlined />,
          label: '日历视图',
          onClick: () => navigate('/calendar')
        },
        {
          key: '/reports',
          icon: <BarChartOutlined />,
          label: '报表导出',
          onClick: () => navigate('/reports')
        }
      )
    }

    return items
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: `${user?.name} (${getRoleLabel(user?.role)})`
    },
    {
      key: '2',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  function getRoleLabel(role) {
    const roles = {
      admin: '管理员',
      manager: '经理',
      employee: '员工'
    }
    return roles[role] || role
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header>
        <div className="header-title">请假调休系统</div>
        <div className="header-user">
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <AntLayout>
        <Sider width={200} theme="light">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Content style={{ margin: '0', background: '#f5f7fa' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
