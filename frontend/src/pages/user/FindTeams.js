// frontend/src/pages/user/FindTeams.js
import React, { useEffect, useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import { toast } from 'react-hot-toast';
import { FiUsers, FiClock, FiMapPin, FiActivity, FiChevronRight, FiCheckCircle, FiSend, FiShield, FiTrendingUp, FiFilter, FiBox } from 'react-icons/fi';

const FindTeams = () => {
  const { teams, fetchTeams, loading, joinTeam } = useTeam();
  const [filters, setFilters] = useState({ sport: '', skillLevel: '' });
  const [joinMessage, setJoinMessage] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => { fetchTeams(filters); }, [filters, fetchTeams]);

  const handleJoin = async (teamId) => {
    const result = await joinTeam(teamId, { message: joinMessage });
    if (result.success) {
      toast.success('Strategy dispatched! Awaiting captain approval.', { icon: '🚀' });
      setSelectedTeamId(null);
      setJoinMessage('');
    } else { toast.error(result.error || 'Failed to send join request.'); }
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-[1600px] mx-auto py-24 px-6 md:px-16 lg:px-24 space-y-24">
        {/* High-Impact Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-red-500/10 text-red-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] italic">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              REAL-TIME MATCHMAKING
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">STRATEGIZE & <br/><span className="text-primary underline decoration-primary/10">CONQUER</span></h1>
            <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Join elite squads looking for reinforcements or recruit champions for your next arena battle matrix.</p>
          </div>
          
          <div className="flex items-center gap-4 text-gray-300 font-black text-[10px] uppercase tracking-[0.5em] italic">
            <FiActivity /> ACTIVE OPERATIONS READY
          </div>
        </header>

        {/* Premium Filter Bar */}
        <div className="bg-gray-900 p-4 rounded-[40px] shadow-2xl flex flex-col md:flex-row gap-4 items-center max-w-5xl group">
          <div className="w-full flex items-center gap-4 bg-white/5 px-8 py-6 rounded-[30px] border border-white/10 focus-within:border-primary transition-all duration-500">
            <FiFilter className="text-primary text-xl" />
            <div className="flex-1 flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic mb-1">Discipline Sector</span>
              <select 
                onChange={(e) => setFilters({...filters, sport: e.target.value})}
                className="bg-transparent w-full font-black text-white outline-none cursor-pointer uppercase italic text-sm"
              >
                <option value="" className="bg-gray-900">All Disciplines</option>
                {['Box Cricket', 'Badminton', 'Football', 'Volleyball', 'Basketball', 'Pickleball', 'Tennis', 'Table Tennis'].map(sport => (
                  <option key={sport} value={sport} className="bg-gray-900">{sport}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="w-full flex items-center gap-4 bg-white/5 px-8 py-6 rounded-[30px] border border-white/10 focus-within:border-primary transition-all duration-500">
            <FiTrendingUp className="text-primary text-xl" />
            <div className="flex-1 flex flex-col">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic mb-1">Operational Rank</span>
              <select 
                onChange={(e) => setFilters({...filters, skillLevel: e.target.value})}
                className="bg-transparent w-full font-black text-white outline-none cursor-pointer uppercase italic text-sm"
              >
                <option value="" className="bg-gray-900">All Ranks</option>
                {['Beginner', 'Intermediate', 'Advanced'].map(rank => (
                  <option key={rank} value={rank} className="bg-gray-900">{rank}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="animate-fade-in min-h-[600px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-50 rounded-[50px] aspect-square animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {teams.map(team => (
                <div key={team._id} className="bg-white rounded-[50px] p-12 border border-gray-100 flex flex-col group transition-all duration-700 hover:shadow-premium hover:-translate-y-3 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 px-10 py-3 rounded-bl-[30px] text-[10px] font-black uppercase tracking-[0.2em] italic ${
                    team.status === 'open' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {team.status === 'open' ? 'SECTOR OPEN' : 'SECTOR CLOSED'}
                  </div>

                  <div className="mb-10 space-y-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-[24px] flex items-center justify-center text-primary text-3xl group-hover:scale-110 transition-transform duration-500">
                      <FiUsers />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black text-gray-800 leading-tight group-hover:text-primary transition-colors uppercase italic tracking-tighter">{team.name}</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                          <FiActivity className="text-primary" /> <span>{team.sport} • {team.skillLevel} RANK</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                          <FiMapPin className="text-primary" /> <span className="truncate">{team.venue?.name || 'SECTOR COORDINATES TBA'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                          <FiClock className="text-primary" /> <span>{team.startTime} - {team.endTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] italic">SYNC PROGRESS</span>
                        <span className="text-sm font-black text-primary italic">{team.members.length} / {team.maxPlayers} UNITS</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-1000 ease-out shadow-lg" 
                          style={{ width: `${(team.members.length / team.maxPlayers) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-red-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                        <FiBox /> MISSING {team.maxPlayers - team.members.length} SPECIALIZED OPERATIVES
                      </p>
                    </div>

                    {team.status === 'open' && (
                      <div className="pt-8 border-t border-gray-50">
                        {selectedTeamId === team._id ? (
                          <div className="space-y-4 animate-fade-in">
                            <textarea 
                              placeholder="BRIEF YOUR OPERATIONAL SKILLS TO THE CAPTAIN..." 
                              value={joinMessage}
                              onChange={(e) => setJoinMessage(e.target.value)}
                              className="w-full p-8 bg-gray-50 border-2 border-transparent rounded-[30px] h-32 text-sm font-black text-gray-800 focus:bg-white focus:border-primary transition-all outline-none resize-none italic uppercase placeholder:text-gray-300"
                            />
                            <div className="flex gap-4">
                              <button onClick={() => handleJoin(team._id)} className="flex-1 py-6 bg-gray-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-primary transition-all flex items-center justify-center gap-3 italic">
                                <FiSend /> DISPATCH REQUEST
                              </button>
                              <button onClick={() => setSelectedTeamId(null)} className="px-8 py-6 bg-gray-100 text-gray-400 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-all italic">
                                ABORT
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setSelectedTeamId(team._id)} className="w-full py-6 bg-primary/5 text-primary rounded-[30px] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 flex items-center justify-center gap-3 italic group/btn">
                            INITIALIZE ENROLLMENT <FiChevronRight className="group-hover/btn:translate-x-2 transition-transform" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {teams.length === 0 && (
                <div className="col-span-full py-48 text-center bg-gray-50 rounded-[60px] border-2 border-dashed border-gray-200 space-y-8">
                  <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-primary text-6xl mx-auto shadow-premium">
                    <FiShield />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter">No Squads Identified</h3>
                    <p className="text-xl text-gray-400 font-medium italic max-w-lg mx-auto leading-relaxed">Adjust your filtration parameters to discover active operational units within the sector.</p>
                  </div>
                  <button onClick={() => setFilters({ sport: '', skillLevel: '' })} className="bg-primary text-white px-12 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-110 transition-all duration-500 italic">RESET FILTERS</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindTeams;


