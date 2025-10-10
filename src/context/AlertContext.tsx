import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number; // Auto-dismiss after this many ms (0 = no auto-dismiss)
  persistent?: boolean; // If true, won't auto-dismiss
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (alert: Omit<Alert, 'id'>) => void;
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

interface AlertProviderProps {
  children: ReactNode;
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (alert: Omit<Alert, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newAlert: Alert = { ...alert, id };
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto-dismiss if duration is specified
    if (alert.duration && alert.duration > 0) {
      setTimeout(() => {
        dismissAlert(id);
      }, alert.duration);
    }
  };

  const showSuccess = (message: string, title?: string, duration = 5000) => {
    showAlert({ type: 'success', message, title, duration });
  };

  const showError = (message: string, title?: string, duration = 0) => {
    showAlert({ type: 'error', message, title, duration, persistent: true });
  };

  const showWarning = (message: string, title?: string, duration = 7000) => {
    showAlert({ type: 'warning', message, title, duration });
  };

  const showInfo = (message: string, title?: string, duration = 5000) => {
    showAlert({ type: 'info', message, title, duration });
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return (
    <AlertContext.Provider value={{
      alerts,
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      dismissAlert,
      clearAllAlerts
    }}>
      {children}
      <AlertContainer />
    </AlertContext.Provider>
  );
}

function AlertContainer() {
  const { alerts, dismissAlert } = useAlert();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map(alert => (
        <AlertItem key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
      ))}
    </div>
  );
}

function AlertItem({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: 'text-green-900'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          title: 'text-red-900'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          title: 'text-yellow-900'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-600" />,
          title: 'text-blue-900'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`border rounded-lg p-4 shadow-lg animate-in slide-in-from-right-full duration-300 ${styles.container}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          {alert.title && (
            <h4 className={`font-semibold text-sm mb-1 ${styles.title}`}>
              {alert.title}
            </h4>
          )}
          <p className="text-sm leading-relaxed">
            {alert.message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
