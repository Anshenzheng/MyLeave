import React, { useEffect, useState } from 'react'
import { Card, Button, Select, DatePicker, Table, Statistic, Row, Col, Tag, message, Space } from 'antd'
import { DownloadOutlined, BarChartOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const Reports = () => {
  const [filters, setFilters] = useState({
    department_id: undefined,
    start_date: undefined,
    end_date: undefined,
    status: 'approved'
  })
  const [statistics, setStatistics] = useState(null)
  const [applications, setApplications] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())

  const years = []
  for (let y = new Date().getFullYear() - 2; y <= new Date().getFullYear(); y++) {
    years.push(y)
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchStatistics()
    fetchApplications()
  }, [filters, year])

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/users/departments')
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchStatistics = async () => {
    try {
      const params = { year }
      if (filters.department_id) {
        params.department_id = filters.department_id
      }
      const response = await axios.get('/api/reports/statistics', { params })
      setStatistics(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.department_id) params.department_id = filters.department_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.status) params.status = filters.status

      const response = await axios.get('/api/applications', { params })
      setApplications(response.data.applications || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (filters.department_id) params.department_id = filters.department_id
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.status) params.status = filters.status

      const queryString = new URLSearchParams(params).toString()
      const url = `/api/reports/export${queryString ? '?' + queryString : ''}`

      const response = await axios.get(url, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `请假记录_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
      link.click()
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
      console.error(error)
    }
  }

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { text: '待审批', color: 'orange' },
      approved: { text: '已通过', color: 'green' },
      rejected: { text: '已拒绝', color: 'red' },
      cancelled: { text: '已取消', color: 'default' }
    }
    const info = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={info.color}>{info.text}</Tag>
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag
    }
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">报表导出</h1>

      {statistics && (
        <Card title={`${year}年度统计`} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="申请总数"
                value={statistics.total_applications || 0}
                prefix={<BarChartOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title="请假总天数"
                value={statistics.total_days || 0}
                suffix="天"
                prefix={<BarChartOutlined />}
              />
            </Col>
          </Row>

          {Object.keys(statistics.by_type || {}).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12 }}>按假期类型统计：</h4>
              <Row gutter={16}>
                {Object.entries(statistics.by_type).map(([type, data]) => (
                  <Col xs={24} sm={12} lg={6} key={type}>
                    <Card size="small">
                      <p style={{ fontWeight: 600, margin: 0 }}>{type}</p>
                      <p style={{ margin: 0, color: '#666' }}>
                        {data.count} 次申请，共 {data.days} 天
                      </p>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {Object.keys(statistics.by_department || {}).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 12 }}>按部门统计：</h4>
              <Row gutter={16}>
                {Object.entries(statistics.by_department).map(([dept, data]) => (
                  <Col xs={24} sm={12} lg={6} key={dept}>
                    <Card size="small">
                      <p style={{ fontWeight: 600, margin: 0 }}>{dept}</p>
                      <p style={{ margin: 0, color: '#666' }}>
                        {data.count} 次申请，共 {data.days} 天
                      </p>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Card>
      )}

      <div className="filter-bar">
        <Select
          placeholder="年度"
          style={{ width: 120 }}
          value={year}
          onChange={setYear}
        >
          {years.map((y) => (
            <Select.Option key={y} value={y}>
              {y}年
            </Select.Option>
          ))}
        </Select>

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

        <Select
          placeholder="状态"
          style={{ width: 120 }}
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="approved">已通过</Select.Option>
          <Select.Option value="pending">待审批</Select.Option>
          <Select.Option value="rejected">已拒绝</Select.Option>
        </Select>

        <Button onClick={fetchApplications} type="primary">
          查询
        </Button>
        <Button onClick={handleExport} type="primary" icon={<DownloadOutlined />}>
          导出Excel
        </Button>
      </div>

      <Card title="请假记录列表">
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
      </Card>
    </div>
  )
}

export default Reports
