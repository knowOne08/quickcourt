// frontend/src/pages/user/FindPlayers.js
import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { toast } from 'react-hot-toast';
import { FiSearch, FiUserPlus, FiUsers, FiAward, FiActivity, FiShield, FiTrendingUp, FiBox } from 'react-icons/fi';

const FindPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPlayers(); }, []);

  const fetchPlayers = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await userService.getAllUsers(searchQuery);
      if (response.success) setPlayers(response.users);
    } catch (error) { toast.error(error.error || 'Failed to fetch players'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlayers(search);
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-[1600px] mx-auto py-24 px-6 md:px-16 lg:px-24 space-y-24">
        {/* High-Impact Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic">
              <FiUsers /> GLOBAL SPORTS MATRIX
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">FIND YOUR <br/><span className="text-primary underline decoration-primary/10">TEAMMATES</span></h1>
            <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Connect with elite athletes, discover local talent, and build your perfect high-performance squad.</p>
          </div>
          
          <div className="flex items-center gap-4 text-gray-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
            <FiActivity /> SYNCHRONIZING REAL-TIME DATA
          </div>
        </header>

        {/* Premium Search Bar */}
        <div className="flex justify-center">
          <form onSubmit={handleSearch} className="w-full max-w-4xl group">
            <div className="relative bg-gray-900 p-3 rounded-[40px] shadow-2xl flex items-center border border-white/10 group-focus-within:border-primary transition-all duration-500">
              <div className="w-20 h-20 bg-white/5 rounded-[30px] flex items-center justify-center text-gray-500 group-focus-within:text-primary transition-colors">
                <FiSearch size={32} />
              </div>
              <input 
                type="text" 
                placeholder="SEARCH ATHLETES BY IDENTITY..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent px-8 text-xl font-black text-white placeholder-gray-600 outline-none uppercase italic"
              />
              <button 
                type="submit"
                className="bg-primary text-white px-16 py-6 rounded-[30px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-primary hover:scale-[1.05] transition-all duration-500 italic"
              >
                EXECUTE SEARCH
              </button>
            </div>
          </form>
        </div>

        <div className="animate-fade-in min-h-[600px]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="bg-gray-50 rounded-[50px] aspect-[4/5] animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
              {players.map(player => (
                <div 
                  key={player._id} 
                  className="bg-white rounded-[50px] p-12 text-center border border-gray-100 flex flex-col items-center group transition-all duration-700 hover:shadow-premium hover:-translate-y-3"
                >
                  <div className="relative mb-10">
                    <div className="w-32 h-32 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white transition-all group-hover:scale-110 duration-700 p-1 bg-gray-50">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover rounded-[35px]" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-4xl text-white font-black italic rounded-[35px]">
                          {player.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-gray-900 text-primary w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white group-hover:rotate-12 transition-transform duration-500">
                      <FiAward size={20} />
                    </div>
                  </div>

                  <div className="space-y-4 mb-12">
                    <h3 className="text-3xl font-black text-gray-900 leading-none group-hover:text-primary transition-colors uppercase italic tracking-tighter">{player.name}</h3>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em] italic bg-primary/5 px-4 py-1 rounded-full border border-primary/10">
                        {player.role === 'owner' ? 'COMMANDER RANK' : 'ATHLETE RANK'}
                      </span>
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] italic mt-1">
                        REGISTRY EST. {new Date(player.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => toast.success(`Invitation signal dispatched to ${player.name}!`)}
                    className="w-full py-6 rounded-[24px] bg-gray-50 text-gray-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-primary hover:text-white hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 italic group/btn"
                  >
                    <FiUserPlus size={18} /> SEND RECRUITMENT SIGNAL
                  </button>
                </div>
              ))}
              
              {players.length === 0 && (
                <div className="col-span-full py-48 text-center bg-gray-50 rounded-[60px] border-2 border-dashed border-gray-200 space-y-8">
                  <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-primary text-6xl mx-auto shadow-premium">
                    <FiShield />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter">Athletes Not Identified</h3>
                    <p className="text-xl text-gray-400 font-medium italic max-w-lg mx-auto leading-relaxed">Recalibrate your search parameters to find more sports operatives in the global matrix.</p>
                  </div>
                  <button onClick={() => fetchPlayers()} className="bg-primary text-white px-12 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-110 transition-all duration-500 italic">RESET MATRIX</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindPlayers;


