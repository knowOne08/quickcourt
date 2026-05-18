// frontend/src/pages/admin/UserManagement.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { FiUsers, FiSearch, FiFilter, FiTrash2, FiEye, FiActivity, FiUserX, FiShield } from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', search: '' });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllUsers(filters);
      setUsers(response.data.data.users);
    } catch (error) {
      toast.error('User directory synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}.`);
      fetchUsers();
    } catch (error) {
      toast.error('Operational override failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-12 lg:p-20 font-inter">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              <FiActivity /> Identity Governance
            </div>
            <h1 className="text-5xl font-black text-gray-800 tracking-tight uppercase italic leading-none">User <span className="text-primary">Registry</span></h1>
            <p className="text-gray-400 font-medium italic">Managing global identities and operational clearances.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="relative w-full sm:w-80 group">
              <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search coordinates..." 
                className="w-full pl-14 pr-8 py-5 rounded-[24px] bg-white border-2 border-transparent focus:border-primary/20 outline-none font-bold text-gray-700 shadow-premium transition-all text-sm"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-4 bg-white px-8 py-5 rounded-[24px] shadow-premium border border-gray-100 w-full sm:w-auto">
              <FiFilter className="text-primary" />
              <select 
                value={filters.role} 
                onChange={(e) => setFilters({...filters, role: e.target.value})}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest focus:outline-none text-gray-600 cursor-pointer w-full"
              >
                <option value="">Global Roles</option>
                <option value="user">Civilian (User)</option>
                <option value="facility_owner">Commander (Owner)</option>
                <option value="admin">System High-Command</option>
              </select>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[60px] border border-gray-100 p-12 lg:p-16 shadow-premium relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          {loading ? (
            <div className="py-40 flex flex-col items-center justify-center relative z-10">
              <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-primary w-1/2 animate-[loading_1s_ease-in-out_infinite]" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">Synchronizing Identities...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-40 text-center relative z-10">
              <div className="w-24 h-24 bg-gray-50 text-gray-300 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-8">
                <FiUsers />
              </div>
              <h3 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter mb-4">No Identities Found</h3>
              <p className="text-gray-400 font-medium italic text-lg">No personnel matching your search parameters were identified in the current sector.</p>
            </div>
          ) : (
            <div className="overflow-x-auto relative z-10">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                    <th className="pb-10 text-left italic">Operational Profile</th>
                    <th className="pb-10 text-left italic">Encryption (Email)</th>
                    <th className="pb-10 text-left italic">Sector Role</th>
                    <th className="pb-10 text-left italic">Deployment Date</th>
                    <th className="pb-10 text-right italic">Override Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(user => (
                    <tr key={user._id} className="group hover:bg-gray-50/50 transition-all duration-300">
                      <td className="py-8">
                        <div className="flex items-center gap-6">
                          <img className="w-14 h-14 rounded-2xl border border-gray-100 shadow-sm" src={`https://ui-avatars.com/api/?name=${user.name}&background=714B67&color=fff&bold=true&italic=true`} alt="" />
                          <strong className="text-lg font-black text-gray-800 uppercase italic group-hover:text-primary transition-colors">{user.name}</strong>
                        </div>
                      </td>
                      <td className="py-8 text-sm font-bold text-gray-500 italic lowercase">{user.email}</td>
                      <td className="py-8">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                          user.role === 'admin' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                          user.role === 'facility_owner' ? 'bg-primary text-white shadow-lg shadow-primary/20' :
                          'bg-gray-800 text-white shadow-lg shadow-gray-800/20'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-8 text-sm font-black text-gray-400 italic uppercase">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-8">
                        <div className="flex gap-3 justify-end">
                          <button className="w-12 h-12 rounded-xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm group/btn" title="View Intel"><FiEye size={18} /></button>
                          <button 
                            className="w-12 h-12 rounded-xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group/btn" 
                            onClick={() => handleStatusUpdate(user._id, 'suspended')}
                            title="Suspend Account"
                          >
                            <FiUserX size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

