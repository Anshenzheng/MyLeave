import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Progress, Select, message } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import axios from 'axios'

const MyQuota = () => {
  const [quotas, setQuotas] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)

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
      const response = await axios.get('/api/holidays/quotas', {
        params: { year }
      })
      setQuotas(response.data.quotas || [])
    } catch (error) {
      message.error('获取数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  return (
    <div className="page-container">
      <h1 className="page-title">我的假期额度</h1>

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
      </div>

      {quotas.length === 0 ? (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>暂无额度数据</p>
        </Card>
      ) : (
        <Row gutter={16}>
          {quotas.map((quota) => {
            const percentage = quota.total_days > 0 ? (quota.used_days / quota.total_days) * 100 : 0
            const remaining = quota.total_days - quota.used_days
            const progressColor = percentage > 80 ? '#f5222d' : percentage > 50 ? '#faad14' : '#52c41a'

            return (
              <Col xs={24} sm={12} lg={8} key={quota.id}>
                <Card className="quota-card" loading={loading}>
                  <Statistic
                    title={quota.holiday_type_name}
                    value={remaining}
                    suffix="天"
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: remaining > 0 ? '#1890ff' : '#f5222d' }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Progress
                      percent={Math.round(percentage)}
                      strokeColor={progressColor}
                      format={() => `已使用 ${quota.used_days}/${quota.total_days} 天`}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: '#999', marginTop: 8, marginBottom: 0 }}>
                    {year}年度
                  </p>
                </Card>
              </Col>
            )
          })}
        </Row>
      )}
    </div>
  )
}

export default MyQuota
