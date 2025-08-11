// frontend/src/pages/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Charts from '../../components/dashboard/Charts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFacilityOwners: 0,
    totalBookings: 0,
    totalActiveCourts: 0
  });
  const [chartData, setChartData] = useState({
    bookingActivity: [],
    userRegistration: [],
    facilityApproval: [],
    activeSports: [],
    earnings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getChartData()
      ]);
      
      setStats(statsRes.data);
      setChartData(chartsRes.data);
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Global platform overview and management</p>
      </div>

      {/* Global Stats */}
      <div className="global-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.totalFacilityOwners}</h3>
            <p>Facility Owners</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalBookings}</h3>
            <p>Total Bookings</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏟️</div>
          <div className="stat-content">
            <h3>{stats.totalActiveCourts}</h3>
            <p>Active Courts</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        <div className="chart-container">
          <h3>Booking Activity Over Time</h3>
          <Charts 
            type="line"
            data={chartData.bookingActivity}
            options={{
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
          <h3>User Registration Trends</h3>
          <Charts 
            type="bar"
            data={chartData.userRegistration}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'New Users'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="chart-container">
          <h3>Facility Approval Trend</h3>
          <Charts 
            type="line"
            data={chartData.facilityApproval}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Facilities Approved'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="chart-container">
          <h3>Most Active Sports</h3>
          <Charts 
            type="doughnut"
            data={chartData.activeSports}
            options={{
              plugins: {
                legend: {
                  position: 'right'
                }
              }
            }}
          />
        </div>
        
        <div className="chart-container full-width">
          <h3>Earnings Simulation Chart</h3>
          <Charts 
            type="bar"
            data={chartData.earnings}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Earnings (₹)'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;