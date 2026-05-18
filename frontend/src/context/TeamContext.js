import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';

const TeamContext = createContext(null);

const initialState = {
  teams: [],
  userTeams: [],
  currentTeam: null,
  joinRequests: [],
  loading: false,
  error: null,
  socket: null
};

const teamReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_TEAMS':
      return { ...state, teams: action.payload, loading: false };
    case 'SET_USER_TEAMS':
      return { ...state, userTeams: action.payload, loading: false };
    case 'ADD_TEAM':
      // Prevent duplicates if socket already added it
      if (state.teams.some(t => t._id === action.payload._id)) return state;
      return { ...state, teams: [action.payload, ...state.teams] };
    case 'UPDATE_TEAM':
      return {
        ...state,
        teams: state.teams.map(t => t._id === action.payload._id ? action.payload : t),
        userTeams: state.userTeams.map(t => t._id === action.payload._id ? action.payload : t),
        currentTeam: state.currentTeam?._id === action.payload._id ? action.payload : state.currentTeam
      };
    case 'SET_JOIN_REQUESTS':
      return { ...state, joinRequests: action.payload };
    default:
      return state;
  }
};

export const TeamProvider = ({ children }) => {
  const [state, dispatch] = useReducer(teamReducer, initialState);

  // Initialize Socket Connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:4000', {
      withCredentials: true,
    });

    dispatch({ type: 'SET_SOCKET', payload: newSocket });

    // Listen for global team updates
    newSocket.on('team_list_updated', (newTeam) => {
      dispatch({ type: 'ADD_TEAM', payload: newTeam });
      // We don't want to show toast here if we are the one who created it, 
      // but simple enough for demonstration:
      if (window.location.pathname.includes('teams')) {
        import('react-hot-toast').then(toast => {
          toast.default.success(`New team created: ${newTeam.name}!`, { icon: '🙌' });
        });
      }
    });

    newSocket.on('receive_team_update', (data) => {
      import('react-hot-toast').then(toast => {
        toast.default.success(`Live Update: ${data.message}`, { icon: '⚡' });
      });
      console.log("Real-time team update:", data);
    });

    return () => newSocket.close();
  }, []);

  const fetchTeams = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/teams', { params: filters });
      dispatch({ type: 'SET_TEAMS', payload: response.data.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to fetch teams' });
    }
  }, []);

  const createTeam = async (teamData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post('/teams', teamData);
      const newTeam = response.data.data;
      dispatch({ type: 'ADD_TEAM', payload: newTeam });
      
      // Notify others in real-time
      if (state.socket) {
        state.socket.emit('new_team_created', newTeam);
      }
      
      return { success: true, team: newTeam };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || 'Failed to create team' });
      return { success: false, error: error.response?.data?.error };
    }
  };

  const joinTeam = async (teamId, messageData) => {
    try {
      const response = await api.post(`/teams/${teamId}/join`, messageData);
      
      // Notify team room in real-time
      if (state.socket) {
        state.socket.emit('team_update', { 
          teamId, 
          message: 'New join request received', 
          user: 'System' 
        });
      }
      
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to join team' };
    }
  };

  const respondToRequest = async (requestId, status) => {
    try {
      const response = await api.put(`/teams/requests/${requestId}`, { status });
      const updatedTeam = response.data.data.team;
      dispatch({ type: 'UPDATE_TEAM', payload: updatedTeam });
      
      if (state.socket) {
        state.socket.emit('team_update', { 
          teamId: updatedTeam._id, 
          message: `Request ${status}`, 
          user: 'System' 
        });
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to respond to request' };
    }
  };

  return (
    <TeamContext.Provider
      value={{
        ...state,
        fetchTeams,
        createTeam,
        joinTeam,
        respondToRequest
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeam must be used within a TeamProvider');
  return context;
};
