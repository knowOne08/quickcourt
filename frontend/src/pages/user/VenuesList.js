// frontend/src/pages/user/VenuesList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenues } from '../../hooks/useVenues';
import SearchWithSuggestions from '../../components/common/SearchWithSuggestions';
import VenueCard from '../../components/venue/VenueCard';
import { FiFilter, FiSearch, FiXCircle, FiGrid, FiActivity, FiShield, FiTrendingUp, FiBox, FiAlertCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const VenuesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    minPrice: 0,
    maxPrice: 5000,
    rating: 0
  });

  const {
    venues,
    loading,
    error,
    pagination,
    fetchVenues,
    searchVenues,
    getSearchSuggestions,
    updateFilters,
    clearFilters
  } = useVenues(filters);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateFilters(updatedFilters);
  };

  const handleSearch = () => {
    searchVenues(filters);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'venue') {
      navigate(`/venue/${suggestion.id}`);
    } else if (suggestion.type === 'location') {
      const updatedFilters = { ...filters, search: suggestion.value || suggestion.text };
      setFilters(updatedFilters);
      searchVenues(updatedFilters);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVenues({ ...filters, page: newPage });
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row p-6 md:p-12 gap-12">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-96 shrink-0 space-y-12">
          <div className="bg-gray-900 rounded-[50px] p-12 space-y-12 shadow-2xl relative overflow-hidden group sticky top-12">
            <div className="absolute top-0 right-0 w-full h-full bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/5">
                <FiFilter size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Filter Matrix</h3>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">Operational Tuning</p>
              </div>
            </div>

            <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1 italic flex items-center gap-2"><FiSearch className="text-primary" /> LOCATION / IDENTITY</label>
                <div className="relative group/search">
                  <SearchWithSuggestions
                    value={filters.search}
                    onChange={(value) => handleFilterChange({ search: value })}
                    onSearch={handleSearch}
                    onSuggestionSelect={handleSuggestionSelect}
                    getSuggestions={getSearchSuggestions}
                    placeholder="SEARCH COORDINATES..."
                    className="w-full bg-white/5 border-2 border-transparent rounded-[24px] p-2 text-sm font-black text-white focus-within:border-primary transition-all duration-500 italic uppercase"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1 italic flex items-center gap-2"><FiActivity className="text-primary" /> SPORTING SECTOR</label>
                <select
                  value={filters.sport}
                  onChange={(e) => handleFilterChange({ sport: e.target.value })}
                  className="w-full bg-white/5 border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-white focus:border-primary transition-all duration-500 outline-none italic uppercase appearance-none"
                >
                  <option value="" className="bg-gray-900">ALL DISCIPLINES</option>
                  {['badminton', 'football', 'cricket', 'tennis', 'basketball', 'table_tennis', 'volleyball'].map(sport => (
                    <option key={sport} value={sport} className="bg-gray-900">{sport.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1 italic flex items-center gap-2"><FiTrendingUp className="text-primary" /> BUDGET PARAMETERS (₹/HR)</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="MIN"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange({ minPrice: parseInt(e.target.value) || 0 })}
                    className="bg-white/5 border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-white focus:border-primary transition-all duration-500 outline-none italic uppercase"
                  />
                  <input
                    type="number"
                    placeholder="MAX"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange({ maxPrice: parseInt(e.target.value) || 5000 })}
                    className="bg-white/5 border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-white focus:border-primary transition-all duration-500 outline-none italic uppercase"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1 italic flex items-center gap-2"><FiShield className="text-primary" /> INTEGRITY RANKING</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange({ rating: parseInt(e.target.value) })}
                  className="w-full bg-white/5 border-2 border-transparent rounded-[24px] p-6 text-sm font-black text-white focus:border-primary transition-all duration-500 outline-none italic uppercase appearance-none"
                >
                  <option value="0" className="bg-gray-900">ANY INTEGRITY</option>
                  <option value="5" className="bg-gray-900">ELITE (5★)</option>
                  <option value="4" className="bg-gray-900">HIGH CLASS (4★+)</option>
                  <option value="3" className="bg-gray-900">RELIABLE (3★+)</option>
                  <option value="2" className="bg-gray-900">VALUE (2★+)</option>
                </select>
              </div>

              <button
                className="w-full py-6 rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] text-gray-400 border-2 border-dashed border-white/10 hover:border-primary hover:text-primary transition-all duration-500 flex items-center justify-center gap-3 italic"
                onClick={clearFilters}
              >
                <FiXCircle /> RESET PARAMETERS
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-16">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-4">
              <div className="w-16 h-1 bg-primary rounded-full mb-8 shadow-lg shadow-primary/20" />
              <h2 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Global <span className="text-primary">Facilities</span></h2>
              <p className="text-xl text-gray-400 font-medium italic max-w-2xl leading-relaxed">Discover and synchronize with high-performance sports infrastructure across the matrix.</p>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 px-8 py-5 rounded-[24px] border border-gray-100 shadow-premium shrink-0 group">
              <FiGrid className="text-primary text-xl group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">REGISTRY SCAN</span>
                <span className="text-sm font-black text-gray-900 uppercase italic">
                  {venues.length} UNITS DETECTED
                </span>
              </div>
            </div>
          </header>

          <div className="animate-fade-in min-h-[600px]">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-gray-50 rounded-[50px] aspect-[4/5] animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-48 bg-red-50 rounded-[60px] border-2 border-dashed border-red-100 space-y-8">
                <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-red-500 shadow-premium">
                  <FiAlertCircle size={60} />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-4xl font-black text-red-900 uppercase italic tracking-tighter leading-none">Signal Failure</h3>
                  <p className="text-xl text-red-600 font-medium italic max-w-md mx-auto leading-relaxed">{error}</p>
                </div>
                <button onClick={() => fetchVenues(filters)} className="bg-red-500 text-white px-16 py-6 rounded-[30px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-110 transition-all duration-500 italic">
                  RETRY CONNECTION
                </button>
              </div>
            ) : venues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-12">
                {venues.map((venue) => (
                  <div key={venue._id} className="animate-fade-in" style={{ animationDelay: `${venues.indexOf(venue) * 100}ms` }}>
                    <VenueCard venue={venue} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-48 bg-gray-50 rounded-[60px] border-2 border-dashed border-gray-200 text-center space-y-8">
                <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-primary text-6xl mx-auto shadow-premium">
                  <FiBox />
                </div>
                <div className="space-y-3">
                  <h3 className="text-4xl font-black text-gray-800 uppercase italic tracking-tighter">Sector Clear</h3>
                  <p className="text-xl text-gray-400 font-medium italic max-w-lg mx-auto leading-relaxed">No high-grade venues identified with current parameters. Adjust your tuning.</p>
                </div>
                <button onClick={clearFilters} className="bg-primary text-white px-16 py-6 rounded-[30px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:scale-110 transition-all duration-500 italic">
                  RESET MATRIX TUNING
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && !error && venues.length > 0 && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-8 pt-20">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="w-20 h-20 bg-white border border-gray-100 rounded-[30px] flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:scale-110 transition-all duration-500 shadow-premium disabled:opacity-20 disabled:hover:scale-100"
              >
                <FiChevronLeft size={32} />
              </button>
              <div className="bg-gray-900 px-12 py-6 rounded-[30px] font-black text-white text-lg italic shadow-2xl border border-white/5 uppercase tracking-widest">
                <span className="text-primary">{pagination.currentPage}</span> <span className="text-white/20 mx-2">/</span> {pagination.totalPages}
              </div>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="w-20 h-20 bg-white border border-gray-100 rounded-[30px] flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:scale-110 transition-all duration-500 shadow-premium disabled:opacity-20 disabled:hover:scale-100"
              >
                <FiChevronRight size={32} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VenuesList;


