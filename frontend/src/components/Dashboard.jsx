"use client"

import { useState, useEffect } from "react"

const Dashboard = ({ user, onLogout }) => {
  const [timeRecords, setTimeRecords] = useState([])
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const [currentStatus, setCurrentStatus] = useState("OUT")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [totalHours, setTotalHours] = useState(0)

  useEffect(() => {
    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Fetch time records
    fetchTimeRecords()

    return () => clearInterval(timer)
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const fetchTimeRecords = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/time-records", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch time records")
      }

      const data = await response.json()
      setTimeRecords(data.records)

      // Check if user is currently clocked in
      const lastRecord = data.records[0]
      if (lastRecord && !lastRecord.timeOut) {
        setCurrentStatus("IN")
      } else {
        setCurrentStatus("OUT")
      }

      // Calculate total hours
      setTotalHours(data.totalHours || 0)
    } catch (error) {
      console.error("Error fetching time records:", error)
    }
  }

  const handleClockIn = async () => {
    setIsClockingIn(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/clock-in", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to clock in")
      }

      setCurrentStatus("IN")
      fetchTimeRecords()
    } catch (error) {
      console.error("Error clocking in:", error)
    } finally {
      setIsClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    setIsClockingOut(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/api/clock-out", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to clock out")
      }

      setCurrentStatus("OUT")
      fetchTimeRecords()
    } catch (error) {
      console.error("Error clocking out:", error)
    } finally {
      setIsClockingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Daily Time Record</h1>
          <button onClick={onLogout} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100">
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Time Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Current Time</h3>
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Intern Info Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Intern Info</h3>
            <div className="flex items-center">
              <div>
                <div className="font-bold">{user?.name || "Intern"}</div>
                <div className="text-sm text-gray-500">{user?.email || "intern@oaktree.com"}</div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  currentStatus === "IN" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentStatus === "IN" ? "CLOCKED IN" : "CLOCKED OUT"}
              </span>
              <div>
                {currentStatus === "OUT" ? (
                  <button
                    onClick={handleClockIn}
                    disabled={isClockingIn}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isClockingIn ? "Clocking in..." : "Clock In"}
                  </button>
                ) : (
                  <button
                    onClick={handleClockOut}
                    disabled={isClockingOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isClockingOut ? "Clocking out..." : "Clock Out"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Time Records Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Time Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeRecords.length > 0 ? (
                  timeRecords.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatTime(record.timeIn)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatTime(record.timeOut)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{record.hours ? record.hours.toFixed(2) : "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No time records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t flex justify-end">
            <div className="bg-gray-100 px-4 py-2 rounded-md">
              <span className="font-medium">Total Hours: </span>
              <span className="font-bold">{totalHours.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

