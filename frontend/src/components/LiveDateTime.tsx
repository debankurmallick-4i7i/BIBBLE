import { useEffect, useState } from 'react'
import './LiveDateTime.css'

function getDateTime() {
  const now = new Date()

  return {
    time: now.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    date: now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }
}

function LiveDateTime() {
  const [dateTime, setDateTime] = useState(getDateTime)

  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(getDateTime())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="live-datetime">
      <div className="live-time">
        <span className="clock-symbol">◷</span>
        {dateTime.time}
      </div>

      <div className="live-date">
        {dateTime.date}
      </div>
    </div>
  )
}

export default LiveDateTime