import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Select, DatePicker, Space, message, Modal, Descriptions, Popconfirm } from 'antd'
import { EyeOutlined, CloseOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'
import useAuthStore from '../store/authStore'

const { RangePicker } = DatePicker

const Applications = () => {
  const user = useAuthStore((state) => state.user)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: undefined,
    department_id: undefined,
    start_date: undefined,
    end_date: undefined
  })
  const [departments, setDepartments] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)

  const isManager = user?.role === 'manager' || user?.role === 'admin'

  useEffect(() => {
    fetchData()
    if (isManager) {
      fetchDepartments()
    }
  }, [filters, user])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.department_id) params.department_id = filters.department_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date

      const response = await axios.get('/api/applications', { params })
      setApplications(response.data.applications || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/users/departments')
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleCancel = async (id) => {
    try {
      await axios.post(`/api/applications/${id}/cancel`)
      message.success('申请已取消')
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
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
    ...(isManager ? [
      {
        title: '员工姓名',
        dataIndex: 'employee_name',
        key: 'employee_name'
      },
      {
        title: '部门',
        dataIndex: 'employee_department',
        key: 'employee_department'
      }
    ] : []),
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
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedApp(record)
              setModalVisible(true)
            }}
          >
            详情
          </Button>
          {record.status === 'pending' && !isManager && (
            <Popconfirm
              title="确定要取消这个申请吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<CloseOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">
        {isManager ? '请假记录' : '我的申请'}
      </h1>

      <div className="filter-bar">
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 150 }}
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="pending">待审批</Select.Option>
          <Select.Option value="approved">已通过</Select.Option>
          <Select.Option value="rejected">已拒绝</Select.Option>
          <Select.Option value="cancelled">已取消</Select.Option>
        </Select>

        {isManager && (
          <Select
            placeholder="部门筛选"
            allowClear
            style={{ width: 150 }}
            value={filters.department_id}
            onChange={(value) => setFilters({ ...filters, department_id: value })}
          >
            {departments.map((dept) => (
              <Select.Option key={dept.id} value={dept.id}>
                {dept.name}
              </Select.Option>
            ))}
          </Select>
        )}

        <RangePicker
          placeholder={['开始日期', '结束日期']}
          onChange={(dates) => {
            if (dates) {
              setFilters({
                ...filters,
                start_date: dates[0].format('YYYY-MM-DD'),
                end_date: dates[1].format('YYYY-MM-DD')
              })
            } else {
              setFilters({ ...filters, start_date: undefined, end_date: undefined })
            }
          }}
        />

        <Button onClick={fetchData} type="primary">
          搜索
        </Button>
        <Button onClick={() => {
          setFilters({ status: undefined, department_id: undefined, start_date: undefined, end_date: undefined })
        }}>
          重置
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={applications}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title="请假详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedApp && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="员工姓名">{selectedApp.employee_name}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedApp.employee_department || '-'}</Descriptions.Item>
            <Descriptions.Item label="假期类型">{selectedApp.holiday_type_name}</Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {dayjs(selectedApp.start_date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {dayjs(selectedApp.end_date).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="请假天数">{selectedApp.days} 天</Descriptions.Item>
            <Descriptions.Item label="请假原因">{selectedApp.reason || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {getStatusTag(selectedApp.status)}
            </Descriptions.Item>
            {selectedApp.approver_name && (
              <Descriptions.Item label="审批人">{selectedApp.approver_name}</Descriptions.Item>
            )}
            {selectedApp.approval_comment && (
              <Descriptions.Item label="审批意见">{selectedApp.approval_comment}</Descriptions.Item>
            )}
            {selectedApp.approved_at && (
              <Descriptions.Item label="审批时间">
                {dayjs(selectedApp.approved_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default Applications
