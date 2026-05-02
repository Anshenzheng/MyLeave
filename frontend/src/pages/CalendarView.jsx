import React, { useEffect, useState } from 'react'
import { Calendar, Card, Select, Badge, Popover, Tag, message, Spin } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

const CalendarView = () => {
  const [calendarData, setCalendarData] = useState({})
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchCalendarData()
  }, [currentYear, currentMonth, selectedDept])

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/users/departments')
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const params = {
        year: currentYear,
        month: currentMonth
      }
      if (selectedDept) {
        params.department_id = selectedDept
      }

      const response = await axios.get('/api/reports/calendar', { params })
      setCalendarData(response.data.calendar_data || {})
    } catch (error) {
      message.error('获取日历数据失败')
      console.error(error)
    }
    setLoading(false)
  }

  const onPanelChange = (value) => {
    setCurrentYear(value.year())
    setCurrentMonth(value.month() + 1)
  }

  const dateCellRender = (value) => {
    const dateStr = value.format('YYYY-MM-DD')
    const dayLeaves = calendarData[dateStr] || []

    if (dayLeaves.length === 0) {
      return null
    }

    const content = (
      <div style={{ maxWidth: 300 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{dateStr} 请假人员</p>
        {dayLeaves.map((leave, idx) => (
          <div key={idx} style={{ marginBottom: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>{leave.employee_name}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              部门：{leave.employee_department || '-'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              假期类型：{leave.holiday_type_name}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
              时间：{leave.start_date} ~ {leave.end_date}
            </p>
          </div>
        ))}
      </div>
    )

    return (
      <Popover content={content} title={null} trigger="hover">
        <ul className="events" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <li>
            <Badge
              status="blue"
              text={
                <span style={{ fontSize: 12 }}>
                  {dayLeaves.length} 人请假
                </span>
              }
            />
          </li>
        </ul>
      </Popover>
    )
  }

  const monthCellRender = (value) => {
    const year = value.year()
    const month = value.month() + 1
    const monthStart = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD')
    const monthEnd = value.endOf('month').format('YYYY-MM-DD')

    let count = 0
    Object.keys(calendarData).forEach((dateStr) => {
      if (dateStr >= monthStart && dateStr <= monthEnd) {
        count += calendarData[dateStr].length
      }
    })

    if (count === 0) {
      return null
    }

    return (
      <div style={{ padding: 4 }}>
        <Tag color="blue">{count} 条记录</Tag>
      </div>
    )
  }

  return (
    <div className="page-container">
      <h1 className="page-title">日历视图</h1>

      <div className="filter-bar">
        <Select
          placeholder="选择部门"
          allowClear
          style={{ width: 200 }}
          value={selectedDept}
          onChange={setSelectedDept}
        >
          {departments.map((dept) => (
            <Select.Option key={dept.id} value={dept.id}>
              {dept.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      <Card>
        <Spin spinning={loading}>
          <Calendar
            dateCellRender={dateCellRender}
            monthCellRender={monthCellRender}
            onPanelChange={onPanelChange}
            headerRender={({ value, onChange }) => {
              const start = value.clone().startOf('year').month(0)
              const end = value.clone().endOf('year').month(11)

              const monthOptions = []
              let current = start.clone()
              while (current.isBefore(end) || current.isSame(end)) {
                monthOptions.push(
                  <Select.Option key={current.format('YYYY-MM')} value={current.month()}>
                    {current.format('MM月')}
                  </Select.Option>
                )
                current = current.clone().add(1, 'month')
              }

              return (
                <div style={{ padding: 8, display: 'flex', gap: 8 }}>
                  <Select
                    value={value.year()}
                    onChange={(year) => {
                      const newValue = value.clone().year(year)
                      onChange(newValue)
                      setCurrentYear(year)
                    }}
                    style={{ width: 100 }}
                  >
                    {[
                      new Date().getFullYear() - 2,
                      new Date().getFullYear() - 1,
                      new Date().getFullYear(),
                      new Date().getFullYear() + 1
                    ].map((year) => (
                      <Select.Option key={year} value={year}>
                        {year}年
                      </Select.Option>
                    ))}
                  </Select>
                  <Select
                    value={value.month()}
                    onChange={(month) => {
                      const newValue = value.clone().month(month)
                      onChange(newValue)
                      setCurrentMonth(month + 1)
                    }}
                    style={{ width: 100 }}
                  >
                    {monthOptions}
                  </Select>
                </div>
              )
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default CalendarView
