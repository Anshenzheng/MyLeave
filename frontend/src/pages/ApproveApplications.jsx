import React, { useEffect, useState } from 'react'
import { Table, Button, Tag, Modal, Input, message, Descriptions, Space, Popconfirm, Select, DatePicker } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

const ApproveApplications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [filters, setFilters] = useState({
    department_id: undefined,
    start_date: undefined,
    end_date: undefined
  })
  const [departments, setDepartments] = useState([])
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetchData()
    fetchDepartments()
  }, [filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = { status: 'pending' }
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

  const handleApprove = async (id, approve) => {
    try {
      const url = approve ? `/api/applications/${id}/approve` : `/api/applications/${id}/reject`
      await axios.post(url, { comment })
      message.success(approve ? '审批通过' : '已拒绝')
      setModalVisible(false)
      setComment('')
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const openDetail = (record) => {
    setSelectedApp(record)
    setComment('')
    setModalVisible(true)
  }

  const columns = [
    {
      title: '员工姓名',
      dataIndex: 'employee_name',
      key: 'employee_name'
    },
    {
      title: '部门',
      dataIndex: 'employee_department',
      key: 'employee_department',
      render: (text) => text || '-'
    },
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
      title: '请假原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => text || '-'
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
            onClick={() => openDetail(record)}
          >
            详情
          </Button>
          <Popconfirm
            title="确定要通过这个申请吗？"
            onConfirm={() => handleApprove(record.id, true)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>
              通过
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确定要拒绝这个申请吗？"
            onConfirm={() => handleApprove(record.id, false)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<CloseOutlined />}>
              拒绝
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">待审核申请</h1>

      <div className="filter-bar">
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
          setFilters({ department_id: undefined, start_date: undefined, end_date: undefined })
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
          showTotal: (total) => `共 ${total} 条待审核记录`
        }}
      />

      <Modal
        title="请假详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="reject"
            danger
            onClick={() => handleApprove(selectedApp?.id, false)}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => handleApprove(selectedApp?.id, true)}
          >
            通过
          </Button>
        ]}
      >
        {selectedApp && (
          <div>
            <Descriptions column={1} bordered style={{ marginBottom: 24 }}>
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
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>审批意见：</label>
              <TextArea
                rows={3}
                placeholder="请输入审批意见（可选）"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ApproveApplications
