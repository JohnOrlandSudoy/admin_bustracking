import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Bus, Terminal, Route, User } from '../types';

// Define the state shape
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  buses: Bus[];
  terminals: Terminal[];
  routes: Route[];
  loading: {
    buses: boolean;
    terminals: boolean;
    routes: boolean;
    auth: boolean;
  };
  errors: {
    buses: string | null;
    terminals: string | null;
    routes: string | null;
    auth: string | null;
  };
}

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  buses: [],
  terminals: [],
  routes: [],
  loading: {
    buses: false,
    terminals: false,
    routes: false,
    auth: false,
  },
  errors: {
    buses: null,
    terminals: null,
    routes: null,
    auth: null,
  },
};

// Action types
type ActionType =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_BUSES'; payload: Bus[] }
  | { type: 'SET_TERMINALS'; payload: Terminal[] }
  | { type: 'SET_ROUTES'; payload: Route[] }
  | { type: 'SET_LOADING'; resource: 'buses' | 'terminals' | 'routes' | 'auth'; payload: boolean }
  | { type: 'SET_ERROR'; resource: 'buses' | 'terminals' | 'routes' | 'auth'; payload: string | null };

// Reducer function
const appReducer = (state: AppState, action: ActionType): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_BUSES':
      return { ...state, buses: action.payload };
    case 'SET_TERMINALS':
      return { ...state, terminals: action.payload };
    case 'SET_ROUTES':
      return { ...state, routes: action.payload };
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.resource]: action.payload },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.resource]: action.payload },
      };
    default:
      return state;
  }
};

// Create context
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<ActionType>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};