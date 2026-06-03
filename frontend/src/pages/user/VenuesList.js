import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenues } from '../../hooks/useVenues';
import SearchWithSuggestions from '../../components/common/SearchWithSuggestions';
import VenueCard from '../../components/venue/VenueCard';
import VenuesMap from '../../components/venue/VenuesMap';
import { FiFilter, FiSearch, FiXCircle, FiGrid, FiActivity, FiShield, FiTrendingUp, FiBox, FiAlertCircle, FiChevronLeft, FiChevronRight, FiMap } from 'react-icons/fi';

const VenuesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    minPrice: 0,
    maxPrice: 5000,
    rating: 0
  });

  const [hoveredVenueId, setHoveredVenueId] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'map'

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

  const handleMarkerClick = (venue) => {
    navigate(`/venue/${venue._id}`);
  };

  return (
    <div className="h-screen flex flex-col bg-white font-inter overflow-hidden">
      {/* Mobile Toggle */}
      <div className="lg:hidden z-50 bg-white border-b border-gray-100 p-4 flex gap-4 shrink-0 shadow-sm">
        <button 
          onClick={() => setMobileView('list')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${mobileView === 'list' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <FiGrid /> List View
        </button>
        <button 
          onClick={() => setMobileView('map')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${mobileView === 'map' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <FiMap /> Map View
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Filters + List */}
        <div className={`w-full lg:w-[60%] xl:w-[65%] flex-col lg:flex-row p-4 md:p-8 gap-8 overflow-y-auto scrollbar-hide ${mobileView === 'map' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-80 shrink-0 space-y-8">
            <div className="bg-gray-900 rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-full h-full bg-primary opacity-[0.05] -skew-x-12 translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-2xl border border-white/5">
                  <FiFilter size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Filters</h3>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Find Venues</p>
                </div>
              </div>

              <div className="relative z-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1 flex items-center gap-2"><FiSearch className="text-primary" /> LOCATION / NAME</label>
                  <div className="relative group/search">
                    <SearchWithSuggestions
                      value={filters.search}
                      onChange={(value) => handleFilterChange({ search: value })}
                      onSearch={handleSearch}
                      onSuggestionSelect={handleSuggestionSelect}
                      getSuggestions={getSearchSuggestions}
                      placeholder="Search venues..."
                      className="w-full bg-white/5 border-2 border-transparent rounded-2xl p-3 text-sm font-semibold text-white focus-within:border-primary transition-all duration-500"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1 flex items-center gap-2"><FiActivity className="text-primary" /> SPORT / CATEGORY</label>
                  <select
                    value={filters.sport}
                    onChange={(e) => handleFilterChange({ sport: e.target.value })}
                    className="w-full bg-white/5 border-2 border-transparent rounded-2xl p-3 text-sm font-semibold text-white focus:border-primary transition-all duration-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-900">ALL SPORTS</option>
                    {['badminton', 'football', 'cricket', 'tennis', 'basketball', 'table_tennis', 'volleyball'].map(sport => (
                      <option key={sport} value={sport} className="bg-gray-900">{sport.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1 flex items-center gap-2"><FiTrendingUp className="text-primary" /> PRICE RANGE (₹/HR)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="MIN"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange({ minPrice: parseInt(e.target.value) || 0 })}
                      className="bg-white/5 border-2 border-transparent rounded-2xl p-3 text-sm font-semibold text-white focus:border-primary transition-all duration-500 outline-none"
                    />
                    <input
                      type="number"
                      placeholder="MAX"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange({ maxPrice: parseInt(e.target.value) || 5000 })}
                      className="bg-white/5 border-2 border-transparent rounded-2xl p-3 text-sm font-semibold text-white focus:border-primary transition-all duration-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1 flex items-center gap-2"><FiShield className="text-primary" /> MINIMUM RATING</label>
                  <select
                    value={filters.rating}
                    onChange={(e) => handleFilterChange({ rating: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border-2 border-transparent rounded-2xl p-3 text-sm font-semibold text-white focus:border-primary transition-all duration-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="0" className="bg-gray-900">ANY RATING</option>
                    <option value="5" className="bg-gray-900">5 Stars (5★)</option>
                    <option value="4" className="bg-gray-900">4 Stars & above (4★+)</option>
                    <option value="3" className="bg-gray-900">3 Stars & above (3★+)</option>
                    <option value="2" className="bg-gray-900">2 Stars & above (2★+)</option>
                  </select>
                </div>

                <button
                  className="w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-wider text-gray-400 border-2 border-dashed border-white/10 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-500 flex items-center justify-center gap-2"
                  onClick={clearFilters}
                >
                  <FiXCircle size={16} /> RESET FILTERS
                </button>
              </div>
            </div>
          </aside>

          {/* List Area */}
          <main className="flex-1 space-y-8 flex flex-col">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-none tracking-tight">Explore <span className="text-primary">Venues</span></h2>
                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">Find and book the perfect sports venue near you.</p>
              </div>
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                <FiGrid className="text-primary text-lg" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">RESULTS</span>
                  <span className="text-xs font-bold text-gray-900 uppercase">
                    {venues.length} VENUES
                  </span>
                </div>
              </div>
            </header>

            <div className="animate-fade-in flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-50 rounded-3xl aspect-[4/5] animate-pulse border border-gray-100"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 bg-red-50 rounded-[40px] border border-red-100 space-y-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                    <FiAlertCircle size={40} />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-extrabold text-red-900">Failed to load</h3>
                    <p className="text-sm text-red-600 font-medium max-w-sm mx-auto">{error}</p>
                  </div>
                  <button onClick={() => fetchVenues(filters)} className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-red-600 transition-colors">
                    RETRY
                  </button>
                </div>
              ) : venues.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  {venues.map((venue) => (
                    <div 
                      key={venue._id} 
                      className="animate-fade-in transition-transform duration-300 hover:-translate-y-2" 
                      style={{ animationDelay: `${venues.indexOf(venue) * 50}ms` }}
                      onMouseEnter={() => setHoveredVenueId(venue._id)}
                      onMouseLeave={() => setHoveredVenueId(null)}
                    >
                      <VenueCard venue={venue} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-[40px] border border-gray-100 text-center space-y-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-primary text-4xl shadow-sm">
                    <FiBox />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-gray-800">No Venues Found</h3>
                    <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">Try adjusting your filters to find more results.</p>
                  </div>
                  <button onClick={clearFilters} className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-primary/90 transition-colors">
                    RESET FILTERS
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && !error && venues.length > 0 && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-8 shrink-0">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  <FiChevronLeft size={24} />
                </button>
                <div className="bg-gray-900 px-6 py-3 rounded-xl font-bold text-white text-sm shadow-md">
                  <span className="text-primary">{pagination.currentPage}</span> <span className="text-gray-500 mx-1">/</span> {pagination.totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-30"
                >
                  <FiChevronRight size={24} />
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Right Side: Sticky Map */}
        <div className={`w-full lg:w-[40%] xl:w-[35%] bg-gray-100 relative ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="absolute inset-0 p-4 md:p-8 pl-0">
            <VenuesMap 
              venues={venues} 
              hoveredVenueId={hoveredVenueId}
              onMarkerClick={handleMarkerClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenuesList;
