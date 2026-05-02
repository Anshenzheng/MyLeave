import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  const onFinish = async (values) => {
    setLoading(true)
    const result = await login(values.username, values.password)
    setLoading(false)

    if (result.success) {
      message.success('登录成功')
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    } else {
      message.error(result.message)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-box">
        <h1 className="login-title">请假调休系统</h1>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>

          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
            <p>测试账号：</p>
            <p>管理员: admin / admin123</p>
            <p>经理: manager1 / 123456</p>
            <p>员工: employee1 / 123456</p>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default Login
