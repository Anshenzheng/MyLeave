import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Switch, message, Space, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import axios from 'axios'

const ManageHolidayTypes = () => {
  const [holidayTypes, setHolidayTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/holidays/types')
      setHolidayTypes(response.data.types || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  const handleAdd = () => {
    setEditingType(null)
    form.resetFields()
    form.setFieldsValue({ is_active: true })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingType(record)
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      is_active: record.is_active
    })
    setModalVisible(true)
  }

  const onFinish = async (values) => {
    try {
      if (editingType) {
        await axios.put(`/api/holidays/types/${editingType.id}`, values)
        message.success('更新成功')
      } else {
        await axios.post('/api/holidays/types', values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const toggleStatus = async (record) => {
    try {
      await axios.put(`/api/holidays/types/${record.id}`, {
        is_active: !record.is_active
      })
      message.success('状态更新成功')
      fetchData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title={record.is_active ? '确定要禁用这个假期类型吗？' : '确定要启用这个假期类型吗？'}
            onConfirm={() => toggleStatus(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small">
              {record.is_active ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <h1 className="page-title">假期类型管理</h1>

      <div className="filter-bar" style={{ justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加假期类型
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={holidayTypes}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title={editingType ? '编辑假期类型' : '添加假期类型'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称，如：年假" />
          </Form.Item>
          <Form.Item
            name="code"
            label="代码"
            rules={[{ required: true, message: '请输入代码' }]}
            help="唯一标识，如：annual"
          >
            <Input placeholder="请输入代码，如：annual" disabled={!!editingType} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="is_active"
            label="是否启用"
            valuePropName="checked"
          >
            <Switch />
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
    </div>
  )
}

export default ManageHolidayTypes
