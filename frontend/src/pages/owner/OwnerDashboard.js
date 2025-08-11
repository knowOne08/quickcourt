// frontend/src/pages/owner/OwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Charts from '../../components/dashboard/Charts';
import { ownerService } from '../../services/ownerService';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    activeCourts: 0,
    earnings: 0,
    recentBookings: []
  });
  const [chartData, setChartData] = useState({
    bookingTrends: [],
    earningsSummary: [],
    peakHours: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('weekly');

  useEffect(() => {
    fetchDashboardData();
    fetchChartData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ownerService.getDashboardStats();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await ownerService.getChartData(timeRange);
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="owner-dashboard">
      <div className="dashboard-header">
        <h1>Facility Owner Dashboard</h1>
        <p>Welcome back, {user?.fullName}!</p>
        
        <div className="time-range-selector">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <h3>{dashboardData.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">🏟️</div>
          <div className="kpi-content">
            <h3>{dashboardData.activeCourts}</h3>
            <p>Active Courts</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>₹{dashboardData.earnings.toLocaleString()}</h3>
            <p>Earnings (Simulated)</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon">📅</div>
          <div className="kpi-content">
            <h3>{dashboardData.recentBookings.length}</h3>
            <p>Recent Bookings</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Booking Trends ({timeRange})</h3>
          <Charts 
            type="line"
            data={chartData.bookingTrends}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Bookings'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="chart-container">
          <h3>Earnings Summary</h3>
          <Charts 
            type="doughnut"
            data={chartData.earningsSummary}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }}
          />
        </div>
        
        <div className="chart-container full-width">
          <h3>Peak Booking Hours</h3>
          <Charts 
            type="bar"
            data={chartData.peakHours}
            options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Bookings Count'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Hours (24h format)'
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Booking Calendar */}
      <div className="booking-calendar-section">
        <h3>Booking Calendar</h3>
        <div className="calendar-placeholder">
          {/* Calendar component would go here */}
          <p>Interactive booking calendar showing all court reservations</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="recent-bookings-section">
        <h3>Recent Bookings</h3>
        <div className="bookings-table">
          <table>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Court</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentBookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.user.fullName}</td>
                  <td>{booking.court.name}</td>
                  <td>
                    {new Date(booking.date).toLocaleDateString()} 
                    {' '}
                    {booking.startTime} - {booking.endTime}
                  </td>
                  <td>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>₹{booking.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;