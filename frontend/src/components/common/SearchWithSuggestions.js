import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import './SearchWithSuggestions.css';

const SearchWithSuggestions = ({ 
  value, 
  onChange, 
  onSearch, 
  onSuggestionSelect,
  getSuggestions,
  placeholder = "Search venues or locations...",
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  // Debounce search query to avoid too many API calls
  const debouncedValue = useDebounce(value, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedValue && debouncedValue.trim().length >= 2) {
        setLoading(true);
        try {
          const results = await getSuggestions(debouncedValue);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue, getSuggestions]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          onSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'venue') {
      onChange(suggestion.text);
      onSuggestionSelect && onSuggestionSelect(suggestion);
    } else if (suggestion.type === 'location') {
      // Extract city from location text
      const city = suggestion.text.split(',')[0].trim();
      onChange(city);
      onSuggestionSelect && onSuggestionSelect({ ...suggestion, value: city });
    }
    
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const getSuggestionIcon = (type) => {
    return type === 'venue' ? '🏟️' : '📍';
  };

  return (
    <div className={`search-with-suggestions ${className}`}>
      <div className="search-input-container">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="search-input"
          autoComplete="off"
        />
        <button 
          type="button" 
          onClick={onSearch}
          className="search-button"
          disabled={loading}
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>
      
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="suggestions-dropdown"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${index}`}
                className={`suggestion-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="suggestion-content">
                  <span className="suggestion-icon">
                    {getSuggestionIcon(suggestion.type)}
                  </span>
                  <div className="suggestion-text">
                    <div className="suggestion-title">{suggestion.text}</div>
                    {suggestion.subtitle && (
                      <div className="suggestion-subtitle">{suggestion.subtitle}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-suggestions">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchWithSuggestions;
