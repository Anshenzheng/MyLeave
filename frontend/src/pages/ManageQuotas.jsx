import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Select, InputNumber, message, Space, Card, Row, Col, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons'
import axios from 'axios'

const ManageQuotas = () => {
  const [quotas, setQuotas] = useState([])
  const [holidayTypes, setHolidayTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [modalVisible, setModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [editingQuota, setEditingQuota] = useState(null)
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()

  const years = []
  for (let y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 1; y++) {
    years.push(y)
  }

  useEffect(() => {
    fetchData()
  }, [year])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [quotasRes, typesRes, deptsRes] = await Promise.all([
        axios.get('/api/holidays/quotas', { params: { year } }),
        axios.get('/api/holidays/types'),
        axios.get('/api/users/departments')
      ])
      setQuotas(quotasRes.data.quotas || [])
      setHolidayTypes(typesRes.data.types || [])
      setDepartments(deptsRes.data.departments || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingQuota(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingQuota(record)
    form.setFieldsValue({
      user_id: record.user_id,
      holiday_type_id: record.holiday_type_id,
      year: record.year,
      total_days: record.total_days
    })
    setModalVisible(true)
  }

  const onFinish = async (values) => {
    try {
      if (editingQuota) {
        await axios.put(`/api/holidays/quotas/${editingQuota.id}`, values)
        message.success('更新成功')
      } else {
        await axios.post('/api/holidays/quotas', {
          ...values,
          year: values.year || year
        })
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const onBatchFinish = async (values) => {
    try {
      await axios.post('/api/holidays/quotas/batch', {
        ...values,
        year: values.year || year
      })
      message.success('批量配置成功')
      setBatchModalVisible(false)
      batchForm.resetFields()
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns = [
    {
      title: '员工',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (_, record) => {
        const userApp = quotas.find(q => q.id === record.id)
        return userApp?.to_dict?.()?.name || `用户 ${record.user_id}`
      }
    },
    {
      title: '假期类型',
      dataIndex: 'holiday_type_name',
      key: 'holiday_type_name'
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year'
    },
    {
      title: '总额度',
      dataIndex: 'total_days',
      key: 'total_days'
    },
    {
      title: '已使用',
      dataIndex: 'used_days',
      key: 'used_days'
    },
    {
      title: '剩余',
      dataIndex: 'remaining_days',
      key: 'remaining_days',
      render: (text) => (
        <span style={{ color: text > 0 ? '#52c41a' : '#f5222d' }}>
          {text}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      )
    }
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">额度配置</h1>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="stat-card">
            <Statistic
              title="总配置数"
              value={quotas.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <div className="filter-bar">
        <Select
          value={year}
          onChange={setYear}
          style={{ width: 120 }}
        >
          {years.map((y) => (
            <Select.Option key={y} value={y}>
              {y}年
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          单个配置
        </Button>
        <Button icon={<TeamOutlined />} onClick={() => setBatchModalVisible(true)}>
          批量配置
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={quotas}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title={editingQuota ? '编辑额度' : '添加额度'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {!editingQuota && (
            <>
              <Form.Item
                name="user_id"
                label="用户"
                rules={[{ required: true, message: '请选择用户' }]}
              >
                <Select placeholder="请选择用户">
                  {quotas.map((q) => (
                    <Select.Option key={q.user_id} value={q.user_id}>
                      {`用户 ${q.user_id}`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="year"
                label="年份"
                initialValue={year}
              >
                <Select>
                  {years.map((y) => (
                    <Select.Option key={y} value={y}>
                      {y}年
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="holiday_type_id"
                label="假期类型"
                rules={[{ required: true, message: '请选择假期类型' }]}
              >
                <Select placeholder="请选择假期类型">
                  {holidayTypes.map((type) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
          <Form.Item
            name="total_days"
            label="总额度（天）"
            rules={[{ required: true, message: '请输入总额度' }]}
          >
            <InputNumber
              min={0}
              step={0.5}
              style={{ width: '100%' }}
              placeholder="请输入总额度"
            />
          </Form.Item>
          <Form.Item>
            <div className="action-buttons">
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量配置额度"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={onBatchFinish}
        >
          <Form.Item
            name="department_id"
            label="部门（可选，不选则配置所有员工）"
          >
            <Select placeholder="请选择部门" allowClear>
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="year"
            label="年份"
            initialValue={year}
          >
            <Select>
              {years.map((y) => (
                <Select.Option key={y} value={y}>
                  {y}年
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="holiday_type_id"
            label="假期类型"
            rules={[{ required: true, message: '请选择假期类型' }]}
          >
            <Select placeholder="请选择假期类型">
              {holidayTypes.map((type) => (
                <Select.Option key={type.id} value={type.id}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="total_days"
            label="总额度（天）"
            rules={[{ required: true, message: '请输入总额度' }]}
          >
            <InputNumber
              min={0}
              step={0.5}
              style={{ width: '100%' }}
              placeholder="请输入总额度"
            />
          </Form.Item>
          <Form.Item>
            <div className="action-buttons">
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                取消
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ManageQuotas
