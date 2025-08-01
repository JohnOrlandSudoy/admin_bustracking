import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BusesTab } from './components/BusesTab';
import { BusListTab } from './components/BusListTab';
import { TerminalsTab } from './components/TerminalsTab';
import { RoutesTab } from './components/RoutesTab';
import { UsersTab } from './components/UsersTab';
import { FeedbacksTab } from './components/FeedbacksTab';
import { NotificationsTab } from './components/NotificationsTab';
import { EmployeeTab } from './components/EmployeeTab';
import { ConfirmEmployeeTab } from './components/ConfirmEmployeeTab';
import { ReportsTab } from './components/ReportsTab';
import { useAppContext } from './context/AppContext';
import { busAPI, terminalAPI, routeAPI } from './utils/api';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorAlert } from './components/ErrorAlert';

function App() {
  const [activeTab, setActiveTab] = useState('buses');
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string | null>(null);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'bus-list':
        return 'Bus List';
      default:
        return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch buses
        dispatch({ type: 'SET_LOADING', resource: 'buses', payload: true });
        const busesResponse = await busAPI.getBuses();
        dispatch({ type: 'SET_BUSES', payload: busesResponse.data });
        dispatch({ type: 'SET_LOADING', resource: 'buses', payload: false });

        // Fetch terminals
        dispatch({ type: 'SET_LOADING', resource: 'terminals', payload: true });
        const terminalsResponse = await terminalAPI.getTerminals();
        dispatch({ type: 'SET_TERMINALS', payload: terminalsResponse.data });
        dispatch({ type: 'SET_LOADING', resource: 'terminals', payload: false });

        // Fetch routes
        dispatch({ type: 'SET_LOADING', resource: 'routes', payload: true });
        const routesResponse = await routeAPI.getRoutes();
        dispatch({ type: 'SET_ROUTES', payload: routesResponse.data });
        dispatch({ type: 'SET_LOADING', resource: 'routes', payload: false });
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      }
    };

    fetchData();
  }, [dispatch]);

  const renderActiveTab = () => {
    // Show loading spinner if data is still loading
    if (
      (activeTab === 'buses' && state.loading.buses) ||
      (activeTab === 'terminals' && state.loading.terminals) ||
      (activeTab === 'routes' && state.loading.routes)
    ) {
      return <LoadingSpinner />;
    }

    // Show error if there's an error
    if (
      (activeTab === 'buses' && state.errors.buses) ||
      (activeTab === 'terminals' && state.errors.terminals) ||
      (activeTab === 'routes' && state.errors.routes)
    ) {
      return (
        <ErrorAlert
          message={state.errors[activeTab as 'buses' | 'terminals' | 'routes'] || 'An error occurred'}
          onClose={() => dispatch({ type: 'SET_ERROR', resource: activeTab as 'buses' | 'terminals' | 'routes', payload: null })}
        />
      );
    }

    // Render the active tab
    switch (activeTab) {
      case 'buses':
        return <BusesTab />;
      case 'bus-list':
        return <BusListTab />;
      case 'terminals':
        return <TerminalsTab />;
      case 'routes':
        return <RoutesTab />;
      case 'users':
        return <UsersTab />;
      case 'feedbacks':
        return <FeedbacksTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'employee':
        return <EmployeeTab />;
      case 'confirm-employee':
        return <ConfirmEmployeeTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <BusesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="ml-64 min-h-screen">
        <header className="bg-white shadow-sm border-b border-pink-100">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {getTabTitle(activeTab)} Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your bus tracking system with ease
            </p>
          </div>
        </header>
        
        <main className="p-8">
          {error ? (
            <ErrorAlert message={error} onClose={() => setError(null)} />
          ) : (
            renderActiveTab()
          )}
        </main>
      </div>
    </div>
  );
}

export default App;