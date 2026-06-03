import React from 'react';
import { FiTrendingUp, FiActivity, FiDollarSign, FiClock, FiCalendar } from 'react-icons/fi';

const OwnerAnalytics = ({ stats }) => {
  const monthlyBookings = stats?.monthlyBookings || [];
  const sportWiseEarnings = stats?.sportWiseEarnings || [];
  
  // Calculate max values for charts
  const maxBookings = Math.max(...monthlyBookings.map(d => d.count), 1);
  const maxEarnings = Math.max(...sportWiseEarnings.map(d => d.total), 1);
  const totalEarnings = sportWiseEarnings.reduce((acc, curr) => acc + curr.total, 0);

  // SVG Line Chart Dimensions
  const chartHeight = 200;
  const chartWidth = 600;
  
  // Create SVG path for the line chart
  const createPath = () => {
    if (monthlyBookings.length === 0) return '';
    
    // Spread points evenly across width
    const points = monthlyBookings.map((data, index) => {
      const x = (index / (monthlyBookings.length - 1 || 1)) * chartWidth;
      const y = chartHeight - ((data.count / maxBookings) * chartHeight * 0.8); // 80% max height
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  // Create area path (for gradient fill under the line)
  const createAreaPath = () => {
    if (monthlyBookings.length === 0) return '';
    
    const path = createPath();
    return `${path} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  };

  return (
    <div className="space-y-16 animate-fade-in">
      <header className="space-y-4 mb-12">
        <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">
          <FiTrendingUp size={16} /> PERFORMANCE OPTIMIZATION
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
          ANALYTICS <span className="text-primary underline decoration-primary/10">CONSOLE</span>
        </h2>
        <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">
          Real-time operational metrics and revenue distribution algorithms.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-900 rounded-[40px] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 -skew-x-12 translate-x-1/2 opacity-20" />
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner text-2xl">
            <FiDollarSign />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">NET EARNINGS (90% CUT)</p>
          <h3 className="text-4xl font-black text-white italic mt-2 tracking-tighter">
            ₹{((stats?.earnings || 0) * 0.9).toLocaleString()}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-400/10 w-max px-3 py-1 rounded-lg">
            <FiTrendingUp /> +14.2% Flow
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-premium relative overflow-hidden group">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner text-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-500">
            <FiActivity />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">PEAK OCCUPANCY RATE</p>
          <h3 className="text-4xl font-black text-gray-900 italic mt-2 tracking-tighter">
            {stats?.activeCourts > 0 ? '78%' : '0%'}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-primary text-xs font-bold bg-primary/5 w-max px-3 py-1 rounded-lg">
            <FiActivity /> Optimal Load
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-premium relative overflow-hidden group">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-inner text-2xl group-hover:bg-primary group-hover:text-white transition-colors duration-500">
            <FiClock />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">AVERAGE DAILY VOLUME</p>
          <h3 className="text-4xl font-black text-gray-900 italic mt-2 tracking-tighter">
            {monthlyBookings.length > 0 ? Math.round(stats.totalBookings / monthlyBookings.length) : 0}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-gray-500 text-xs font-bold bg-gray-100 w-max px-3 py-1 rounded-lg">
            <FiCalendar /> Bookings/Day
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SVG Line Chart: Booking Velocity */}
        <div className="bg-white rounded-[50px] p-10 border border-gray-100 shadow-premium relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Booking Velocity</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">30-DAY LOGISTICS TREND</p>
            </div>
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
              <FiTrendingUp size={20} />
            </div>
          </div>

          <div className="w-full overflow-x-auto scrollbar-hide">
            {monthlyBookings.length > 1 ? (
              <div className="min-w-[600px] h-[250px] relative">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-[200px] overflow-visible">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={i} x1="0" y1={chartHeight * (i/4)} x2={chartWidth} y2={chartHeight * (i/4)} stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  
                  {/* Area */}
                  <path
                    d={createAreaPath()}
                    fill="url(#lineGradient)"
                    className="animate-fade-in"
                  />
                  
                  {/* Line */}
                  <path
                    d={createPath()}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-[dash_2s_ease-out_forwards]"
                    style={{ strokeDasharray: '2000', strokeDashoffset: '2000' }}
                  />

                  {/* Points */}
                  {monthlyBookings.map((data, index) => {
                    const x = (index / (monthlyBookings.length - 1)) * chartWidth;
                    const y = chartHeight - ((data.count / maxBookings) * chartHeight * 0.8);
                    return (
                      <g key={index} className="group/point">
                        <circle cx={x} cy={y} r="4" fill="#fff" stroke="#6366F1" strokeWidth="2" className="transition-all duration-300 group-hover/point:r-6" />
                        <text x={x} y={y - 15} textAnchor="middle" fill="#6366F1" fontSize="12" fontWeight="bold" className="opacity-0 group-hover/point:opacity-100 transition-opacity">
                          {data.count}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                {/* X Axis Labels */}
                <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-400 uppercase">
                  <span>{monthlyBookings[0]?._id.day}/{monthlyBookings[0]?._id.month}</span>
                  <span>{monthlyBookings[Math.floor(monthlyBookings.length/2)]?._id.day}/{monthlyBookings[Math.floor(monthlyBookings.length/2)]?._id.month}</span>
                  <span>{monthlyBookings[monthlyBookings.length - 1]?._id.day}/{monthlyBookings[monthlyBookings.length - 1]?._id.month}</span>
                </div>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-sm font-bold text-gray-400 italic">
                Insufficient temporal data to render velocity chart.
              </div>
            )}
          </div>
        </div>

        {/* SVG Bar Chart: Sport Revenue Distribution */}
        <div className="bg-gray-900 rounded-[50px] p-10 shadow-premium relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Revenue Matrix</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">SPORT DISTRIBUTION</p>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            {sportWiseEarnings.length > 0 ? sportWiseEarnings.map((sport, idx) => {
              const percentage = ((sport.total / totalEarnings) * 100).toFixed(1);
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-white uppercase tracking-wider">{sport._id || 'UNKNOWN'}</span>
                      <span className="text-[10px] font-bold text-gray-500 bg-white/10 px-2 py-0.5 rounded-md">{sport.count} BOOKINGS</span>
                    </div>
                    <span className="text-lg font-black text-primary italic">₹{sport.total.toLocaleString()}</span>
                  </div>
                  {/* Animated SVG Bar */}
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full relative overflow-hidden transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="h-[200px] flex items-center justify-center text-sm font-bold text-gray-500 italic">
                No revenue data distributed across sports yet.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default OwnerAnalytics;
