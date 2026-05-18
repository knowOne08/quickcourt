// frontend/src/pages/owner/Notifications.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import { FiBell, FiCheck, FiInfo, FiAlertCircle, FiClock, FiArrowLeft, FiTrash2, FiMaximize2, FiActivity, FiShield, FiRefreshCw } from 'react-icons/fi';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data.data || []);
    } catch (error) { console.error('Telemetry failure'); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) { console.error('Sync failure'); }
  };

  const deleteNotification = async (id) => {
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const getIconConfig = (type) => {
    switch (type) {
      case 'VENUE_APPROVED': return { icon: <FiCheck />, bg: 'bg-emerald-500', color: 'text-white shadow-emerald-500/20' };
      case 'VENUE_REJECTED': return { icon: <FiAlertCircle />, bg: 'bg-red-500', color: 'text-white shadow-red-500/20' };
      case 'BOOKING_CONFIRMED': return { icon: <FiInfo />, bg: 'bg-primary', color: 'text-white shadow-primary/20' };
      default: return { icon: <FiBell />, bg: 'bg-gray-800', color: 'text-white shadow-gray-800/20' };
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white font-inter">
      <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden mb-8">
        <div className="h-full bg-primary w-1/2 animate-progress-fast" />
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] animate-pulse italic">SYNCING LIVE INTEL...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex items-start justify-center py-24 px-6 md:px-12 font-inter relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-screen bg-primary opacity-[0.02] -skew-x-12 translate-x-1/2" />
      
      <div className="bg-white rounded-[70px] shadow-premium border border-gray-100 w-full max-w-4xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 -skew-x-12 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />
        
        {/* Header */}
        <header className="p-16 pb-12 border-b-2 border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-12 relative z-10">
          <div className="flex items-center gap-10">
            <button
              className="w-16 h-16 flex items-center justify-center rounded-[24px] bg-gray-50 text-gray-400 hover:bg-primary hover:text-white transition-all duration-500 shadow-sm border border-transparent hover:rotate-12"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft size={24} />
            </button>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none mb-1">
                <FiActivity size={14} /> LIVE UPDATE FEED
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">COMMAND <br/><span className="text-primary underline decoration-primary/10">UPDATES</span></h1>
              <p className="text-xl text-gray-400 font-medium italic">Managing {notifications.length} active status logs.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={fetchNotifications} className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 group/sync">
              <FiRefreshCw className="group-hover/sync:rotate-180 transition-transform duration-700" />
            </button>
            {notifications.length > 0 && (
              <button onClick={() => setNotifications([])} className="bg-red-50 text-red-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all duration-500 italic shadow-sm">PURGE ARCHIVE</button>
            )}
          </div>
        </header>

        {/* List */}
        <div className="divide-y-2 divide-gray-50 relative z-10">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-48 text-center px-12 space-y-10 group/void">
              <div className="w-32 h-32 rounded-[45px] bg-gray-50 flex items-center justify-center text-gray-200 border-2 border-dashed border-gray-100 group-hover/void:scale-110 transition-transform duration-1000 shadow-inner">
                <FiBell size={60} className="group-hover/void:rotate-12 transition-transform duration-700" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">PROTOCOL CLEAR</h3>
                <p className="text-xl text-gray-400 font-medium italic max-w-md mx-auto leading-relaxed">No new operational updates detected in the current sector. Stand by for live telemetry.</p>
              </div>
              <button onClick={() => navigate('/owner/dashboard')} className="bg-primary text-white px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 hover:bg-gray-900 transition-all duration-500 italic">RETURN TO COMMAND</button>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
              {notifications.map(notif => {
                const { icon, bg, color } = getIconConfig(notif.type);
                return (
                  <div
                    key={notif._id}
                    className={`flex items-start gap-10 p-12 cursor-pointer group transition-all duration-700 relative overflow-hidden border-l-[12px] border-transparent ${notif.isRead ? 'bg-white' : 'bg-primary/5 hover:bg-primary/10 !border-primary'}`}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                  >
                    <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center flex-shrink-0 text-3xl shadow-2xl ${bg} ${color} group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 border-4 border-white/20`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className={`text-2xl font-black tracking-tighter leading-tight uppercase italic ${notif.isRead ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary transition-colors duration-500'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-2.5 flex-shrink-0 italic">
                          <FiClock size={14} className="text-primary" /> {new Date(notif.createdAt).toLocaleDateString().toUpperCase()}
                        </span>
                      </div>
                      <p className="text-lg font-medium text-gray-500 leading-relaxed italic max-w-3xl">{notif.message}</p>
                      <div className="flex items-center gap-8 pt-4">
                        <button className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3 group/link transition-all italic hover:text-gray-900">
                          VIEW INTEL <FiMaximize2 className="group-hover/link:scale-110 transition-transform duration-500" />
                        </button>
                        <button
                          className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 hover:text-red-600 flex items-center gap-3 transition-all italic"
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                        >
                          <FiTrash2 /> PURGE LOG
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <footer className="p-12 bg-gray-50/50 border-t border-gray-50 flex justify-center relative z-10">
          <div className="flex items-center gap-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.5em] italic">
            <FiShield /> END OF TRANSMISSION
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Notifications;
