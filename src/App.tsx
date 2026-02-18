import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BusesTab } from './components/BusesTab';
import { BusListTab } from './components/BusListTab';
import { TerminalsTab } from './components/TerminalsTab';
import { RoutesTab } from './components/RoutesTab';
import { UsersTab } from './components/UsersTab';
import { FeedbacksTab } from './components/FeedbacksTab';
import { NotificationsTab } from './components/NotificationsTab';
import { ContactsTab } from './components/ContactsTab';
import { RefundsTab } from './components/RefundsTab';
import { EmployeeTab } from './components/EmployeeTab';
import { ConfirmEmployeeTab } from './components/ConfirmEmployeeTab';
import { ReportsTab } from './components/ReportsTab';
import { BookingsTab } from './components/BookingsTab';
import { DiscountsTab } from './components/DiscountsTab';
import { useAppContext } from './context/AppContext';
import { busAPI, terminalAPI, routeAPI, adminAPI } from './utils/api';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorAlert } from './components/ErrorAlert';
import { RealTimeProvider } from './context/RealTimeContext';

function App() {
  const [activeTab, setActiveTab] = useState('buses');
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [assignedEmployees, setAssignedEmployees] = useState<Record<string, any>>({});

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'bus-list':
        return 'Bus List';
      default:
        return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  // Fetch assigned employees data
  const fetchAssignedEmployees = async () => {
    if (!state.buses || state.buses.length === 0) return;
    
    const employeeDetails: Record<string, any> = {};
    for (const bus of state.buses) {
      if (bus.driver_id && !assignedEmployees[bus.driver_id]) {
        try {
          const response = await adminAPI.getEmployeeById(bus.driver_id);
          if (response.data) {
            employeeDetails[bus.driver_id] = response.data;
          }
        } catch (error) {
          console.error(`Failed to fetch driver details for bus ${bus.id}`, error);
        }
      }
      if (bus.conductor_id && !assignedEmployees[bus.conductor_id]) {
        try {
          const response = await adminAPI.getEmployeeById(bus.conductor_id);
          if (response.data) {
            employeeDetails[bus.conductor_id] = response.data;
          }
        } catch (error) {
          console.error(`Failed to fetch conductor details for bus ${bus.id}`, error);
        }
      }
    }
    if (Object.keys(employeeDetails).length > 0) {
      setAssignedEmployees(prev => ({...prev, ...employeeDetails}));
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

  // Fetch assigned employees when buses data changes
  useEffect(() => {
    fetchAssignedEmployees();
  }, [state.buses]);

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
        return (
          <BusesTab
            buses={state.buses || []}
            routes={state.routes || []}
            terminals={state.terminals || []}
            assignedEmployees={assignedEmployees}
            loading={state.loading.buses}
            error={state.errors.buses}
          />
        );
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
      case 'contacts':
        return <ContactsTab />;
      case 'employee':
        return <EmployeeTab />;
      case 'confirm-employee':
        return <ConfirmEmployeeTab />;
      case 'reports':
        return <ReportsTab />;
      case 'bookings':
        return <BookingsTab />;
      case 'refunds':
        return <RefundsTab />;
      case 'discounts':
        return <DiscountsTab />;
      default:
        return (
          <BusesTab
            buses={state.buses || []}
            routes={state.routes || []}
            terminals={state.terminals || []}
            assignedEmployees={assignedEmployees}
            loading={state.loading.buses}
            error={state.errors.buses}
          />
        );
    }
  };

  return (
    <RealTimeProvider>
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
    </RealTimeProvider>
  );
}

export default App;
