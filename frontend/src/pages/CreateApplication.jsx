import React, { useEffect, useState } from 'react'
import { Form, Select, DatePicker, Input, Button, Card, message, Alert } from 'antd'
import axios from 'axios'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const { TextArea } = Input
const { RangePicker } = DatePicker

const CreateApplication = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [holidayTypes, setHolidayTypes] = useState([])
  const [quotas, setQuotas] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedHolidayType, setSelectedHolidayType] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [typesRes, quotasRes] = await Promise.all([
        axios.get('/api/holidays/types?is_active=true'),
        axios.get('/api/holidays/quotas')
      ])
      setHolidayTypes(typesRes.data.types || [])
      setQuotas(quotasRes.data.quotas || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
  }

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    return end.diff(start, 'day') + 1
  }

  const getRemainingDays = (holidayTypeId, date) => {
    if (!holidayTypeId || !date) return null
    const year = dayjs(date).year()
    const quota = quotas.find(q => q.holiday_type_id === holidayTypeId && q.year === year)
    return quota ? quota.remaining_days : null
  }

  const handleHolidayTypeChange = (value) => {
    setSelectedHolidayType(value)
  }

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const [startDate, endDate] = values.date_range
      const data = {
        holiday_type_id: values.holiday_type_id,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        reason: values.reason
      }

      await axios.post('/api/applications', data)
      message.success('申请提交成功')
      navigate('/applications')
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败')
    }
    setLoading(false)
  }

  const selectedQuota = selectedHolidayType ? quotas.find(q => q.holiday_type_id === selectedHolidayType) : null

  return (
    <div className="page-container">
      <h1 className="page-title">提交请假申请</h1>

      <Card>
        {selectedQuota && (
          <Alert
            message={`当前 ${selectedQuota.holiday_type_name} 剩余额度：${selectedQuota.remaining_days} 天（总额度 ${selectedQuota.total_days} 天，已使用 ${selectedQuota.used_days} 天）`}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{}}
        >
          <Form.Item
            name="holiday_type_id"
            label="假期类型"
            rules={[{ required: true, message: '请选择假期类型' }]}
          >
            <Select
              placeholder="请选择假期类型"
              onChange={handleHolidayTypeChange}
            >
              {holidayTypes.map((type) => (
                <Select.Option key={type.id} value={type.id}>
                  {type.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date_range"
            label="请假日期"
            rules={[{ required: true, message: '请选择请假日期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const dateRange = getFieldValue('date_range')
              let days = 0
              if (dateRange && dateRange.length === 2) {
                days = calculateDays(dateRange[0], dateRange[1])
              }

              return (
                <Form.Item label="请假天数">
                  <Input
                    value={days > 0 ? `${days} 天` : '请选择日期'}
                    disabled
                  />
                </Form.Item>
              )
            }}
          </Form.Item>

          <Form.Item
            name="reason"
            label="请假原因"
            rules={[{ required: true, message: '请填写请假原因' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细说明请假原因"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <div className="action-buttons">
              <Button type="primary" htmlType="submit" loading={loading}>
                提交申请
              </Button>
              <Button onClick={() => navigate('/applications')}>
                取消
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default CreateApplication
