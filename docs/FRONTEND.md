# Frontend Development Guide

## Overview

The QuickCourt frontend is built with React 18 and follows modern React patterns including functional components, hooks, and context for state management.

## Project Structure

```
frontend/src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication related components
│   ├── booking/         # Booking flow components
│   ├── common/          # Shared UI components
│   ├── dashboard/       # Dashboard components
│   └── venue/           # Venue related components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── pages/               # Route-based page components
│   ├── admin/           # Admin dashboard pages
│   ├── auth/            # Authentication pages
│   ├── owner/           # Facility owner pages
│   └── user/            # Regular user pages
├── services/            # API service layer
├── styles/              # CSS stylesheets
└── utils/               # Utility functions
```

## Key Components

### Authentication Flow

#### AuthContext (`src/context/AuthContext.js`)
Manages global authentication state using React Context and useReducer.

**Usage:**
```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <button onClick={() => login(credentials)}>Login</button>
      )}
    </div>
  );
}
```

#### ProtectedRoute Component
Wraps components that require authentication.

```jsx
<Route path="/profile" element={
  <ProtectedRoute>
    <Profile />
  </ProtectedRoute>
} />

// With role-based access
<Route path="/admin" element={
  <ProtectedRoute requiredRole="admin">
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### Booking System

#### BookingContext (`src/context/BookingContext.js`)
Manages booking flow state including venue selection, date/time, and payment.

```jsx
import { useBooking } from '../context/BookingContext';

function BookingFlow() {
  const { 
    selectedVenue, 
    selectedDate, 
    selectedTimeSlot,
    setBookingDetails,
    createBooking 
  } = useBooking();
  
  const handleBooking = async () => {
    try {
      await createBooking();
      // Handle success
    } catch (error) {
      // Handle error
    }
  };
}
```

#### BookingCalendar Component
Calendar interface for date selection with availability checking.

```jsx
<BookingCalendar
  venueId={venueId}
  onDateSelect={handleDateSelect}
  minDate={new Date()}
  maxDate={maxBookingDate}
/>
```

#### TimeSlotSelector Component
Interactive time slot selection with real-time availability.

```jsx
<TimeSlotSelector
  venueId={venueId}
  selectedDate={selectedDate}
  onSlotSelect={handleSlotSelect}
  sport={selectedSport}
/>
```

### Venue Components

#### VenueCard Component
Displays venue information in a card format.

```jsx
<VenueCard
  venue={venue}
  onBookClick={handleBooking}
  showDistance={true}
/>
```

#### VenueSearch Component
Search and filter interface for venues.

```jsx
<VenueSearch
  onSearch={handleSearch}
  onFilterChange={handleFilterChange}
  filters={currentFilters}
/>
```

### Common Components

#### LoadingSpinner
Reusable loading indicator.

```jsx
<LoadingSpinner size="large" message="Loading venues..." />
```

#### Modal Component
Flexible modal dialog component.

```jsx
<Modal
  isOpen={showModal}
  onClose={handleCloseModal}
  title="Confirm Booking"
>
  <BookingConfirmation />
</Modal>
```

#### ErrorMessage Component
Standardized error display.

```jsx
<ErrorMessage
  message={error.message}
  type="error"
  onDismiss={clearError}
/>
```

## Custom Hooks

### useApi Hook
Simplifies API calls with loading and error states.

```jsx
import { useApi } from '../hooks/useApi';

function VenuesList() {
  const { data: venues, loading, error, refetch } = useApi('/venues');
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error.message} />;
  
  return (
    <div>
      {venues.map(venue => (
        <VenueCard key={venue._id} venue={venue} />
      ))}
    </div>
  );
}
```

### useDebounce Hook
Debounces values to optimize API calls.

```jsx
import { useDebounce } from '../hooks/useDebounce';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchVenues(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
}
```

### useVenues Hook
Manages venue-related state and operations.

```jsx
import { useVenues } from '../hooks/useVenues';

function VenuesList() {
  const {
    venues,
    loading,
    filters,
    setFilters,
    searchVenues,
    loadMore
  } = useVenues();
  
  return (
    <div>
      <VenueSearch 
        onSearch={searchVenues}
        onFilterChange={setFilters}
      />
      <VenueGrid venues={venues} />
      {hasMore && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

## Services Layer

### API Service (`src/services/api.js`)
Base API configuration and interceptors.

```jsx
import api from '../services/api';

// GET request
const venues = await api.get('/venues');

// POST request with data
const booking = await api.post('/bookings', bookingData);

// Request with custom headers
const response = await api.get('/protected-route', {
  headers: { 'Custom-Header': 'value' }
});
```

### Service Modules

#### authService (`src/services/authService.js`)
```jsx
import { authService } from '../services/authService';

// Login
const { user, token } = await authService.login(email, password);

// Register
await authService.register(userData);

// Verify email
await authService.verifyEmail(email, otp);
```

#### venueService (`src/services/venueService.js`)
```jsx
import { venueService } from '../services/venueService';

// Get venues with filters
const venues = await venueService.getVenues({
  location: 'Ahmedabad',
  sport: 'badminton',
  page: 1,
  limit: 10
});

// Get venue details
const venue = await venueService.getVenueById(venueId);
```

## Styling Architecture

### CSS Organization
- `globals.css` - Global styles and CSS variables
- `odoo-theme.css` - Theme-specific styles
- Component-specific CSS files alongside components

### CSS Variables (Custom Properties)
```css
:root {
  /* Colors */
  --primary-color: #0066cc;
  --secondary-color: #f0f0f0;
  --accent-color: #ff6b35;
  --text-primary: #333333;
  --text-secondary: #666666;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Breakpoints */
  --mobile: 480px;
  --tablet: 768px;
  --desktop: 1024px;
  --wide: 1200px;
}
```

### Responsive Design
```css
.component {
  /* Mobile first approach */
  padding: var(--spacing-sm);
  
  /* Tablet */
  @media (min-width: 768px) {
    padding: var(--spacing-md);
  }
  
  /* Desktop */
  @media (min-width: 1024px) {
    padding: var(--spacing-lg);
  }
}
```

## State Management Patterns

### Local State with useState
```jsx
function Component() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
}
```

### Complex State with useReducer
```jsx
const initialState = {
  venues: [],
  filters: {},
  pagination: { page: 1, hasMore: true }
};

function venueReducer(state, action) {
  switch (action.type) {
    case 'SET_VENUES':
      return { ...state, venues: action.payload };
    case 'ADD_VENUES':
      return { 
        ...state, 
        venues: [...state.venues, ...action.payload] 
      };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    default:
      return state;
  }
}
```

### Global State with Context
```jsx
const VenueContext = createContext();

export function VenueProvider({ children }) {
  const [state, dispatch] = useReducer(venueReducer, initialState);
  
  const setVenues = (venues) => {
    dispatch({ type: 'SET_VENUES', payload: venues });
  };
  
  return (
    <VenueContext.Provider value={{ ...state, setVenues }}>
      {children}
    </VenueContext.Provider>
  );
}
```

## Performance Optimization

### Code Splitting
```jsx
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  );
}
```

### Memoization
```jsx
import { memo, useMemo, useCallback } from 'react';

const VenueCard = memo(({ venue, onBook }) => {
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'usd'
    }).format(venue.pricing.hourly);
  }, [venue.pricing.hourly]);
  
  const handleBook = useCallback(() => {
    onBook(venue._id);
  }, [venue._id, onBook]);
  
  return (
    <div className="venue-card">
      {/* Component content */}
    </div>
  );
});
```

## Error Handling

### Error Boundaries
```jsx
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### Try-Catch in Async Operations
```jsx
const handleSubmit = async (formData) => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await apiCall(formData);
    setSuccess(true);
    
  } catch (error) {
    setError(error.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

## Testing Guidelines

### Component Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import VenueCard from './VenueCard';

test('displays venue information correctly', () => {
  const mockVenue = {
    name: 'Test Venue',
    location: { address: 'Test Address' },
    pricing: { hourly: 500 }
  };
  
  render(<VenueCard venue={mockVenue} />);
  
  expect(screen.getByText('Test Venue')).toBeInTheDocument();
  expect(screen.getByText('Test Address')).toBeInTheDocument();
});
```

### Custom Hook Testing
```jsx
import { renderHook, act } from '@testing-library/react';
import { useVenues } from './useVenues';

test('should fetch venues on mount', async () => {
  const { result } = renderHook(() => useVenues());
  
  expect(result.current.loading).toBe(true);
  
  await act(async () => {
    // Wait for async operation
  });
  
  expect(result.current.loading).toBe(false);
  expect(result.current.venues).toBeDefined();
});
```

## Development Best Practices

1. **Component Structure**: Keep components small and focused on a single responsibility
2. **Props Validation**: Use PropTypes or TypeScript for type checking
3. **Error Handling**: Implement proper error boundaries and user feedback
4. **Performance**: Use React.memo, useMemo, and useCallback judiciously
5. **Accessibility**: Include proper ARIA attributes and semantic HTML
6. **Testing**: Write tests for critical user flows and complex logic
7. **Code Organization**: Group related files together and use consistent naming
