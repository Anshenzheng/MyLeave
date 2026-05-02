import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, message } from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import useAuthStore from '../store/authStore'

const Dashboard = () => {
  const user = useAuthStore((state) => state.user)
  const [quotas, setQuotas] = useState([])
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [quotasRes, appsRes] = await Promise.all([
        axios.get('/api/holidays/quotas'),
        axios.get('/api/applications')
      ])

      setQuotas(quotasRes.data.quotas || [])
      const apps = appsRes.data.applications || []
      setApplications(apps.slice(0, 5))

      const pending = apps.filter(a => a.status === 'pending').length
      const approved = apps.filter(a => a.status === 'approved').length
      const rejected = apps.filter(a => a.status === 'rejected').length

      setStats({ pending, approved, rejected })
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审批', class: 'status-tag-pending' },
      approved: { text: '已通过', class: 'status-tag-approved' },
      rejected: { text: '已拒绝', class: 'status-tag-rejected' },
      cancelled: { text: '已取消', class: 'status-tag-cancelled' }
    }
    const info = statusMap[status] || { text: status, class: '' }
    return <Tag className={info.class}>{info.text}</Tag>
  }

  const columns = [
    {
      title: '假期类型',
      dataIndex: 'holiday_type_name',
      key: 'holiday_type_name'
    },
    {
      title: '开始日期',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (text) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '结束日期',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (text) => dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '天数',
      dataIndex: 'days',
      key: 'days'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    }
  ]

  const totalRemaining = quotas.reduce((sum, q) => sum + (q.remaining_days || 0), 0)

  return (
    <div className="page-container">
      <h1 className="page-title">工作台</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="剩余假期"
              value={totalRemaining}
              suffix="天"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="待审批"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="申请总数"
              value={applications.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {quotas.length > 0 && (
        <Card title="我的假期额度" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            {quotas.map((quota) => (
              <Col xs={24} sm={12} lg={6} key={quota.id}>
                <Card size="small" className="quota-card">
                  <p style={{ fontWeight: 600, marginBottom: 8 }}>{quota.holiday_type_name}</p>
                  <p style={{ fontSize: 24, fontWeight: 600, color: '#1890ff', margin: 0 }}>
                    {quota.remaining_days}
                    <span style={{ fontSize: 14, color: '#999' }}> 天</span>
                  </p>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 4, marginBottom: 0 }}>
                    总额度 {quota.total_days} 天，已使用 {quota.used_days} 天
                  </p>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="最近申请记录">
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Dashboard
