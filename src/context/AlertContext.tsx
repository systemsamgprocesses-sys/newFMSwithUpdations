import { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertContextType {
  showSuccess: (message: string, title?: string, duration?: number) => void;
  showError: (message: string, title?: string, duration?: number) => void;
  showWarning: (message: string, title?: string, duration?: number) => void;
  showInfo: (message: string, title?: string, duration?: number) => void;
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

// Custom toast component with premium styling
const CustomToast = ({ 
  type, 
  title, 
  message 
}: { 
  type: AlertType; 
  title?: string; 
  message: string;
}) => {
  const config = {
    success: {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50',
      borderClass: 'border-green-200',
      titleClass: 'text-green-900',
      textClass: 'text-green-800',
    },
    error: {
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      bgClass: 'bg-gradient-to-r from-red-50 to-rose-50',
      borderClass: 'border-red-200',
      titleClass: 'text-red-900',
      textClass: 'text-red-800',
    },
    warning: {
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      bgClass: 'bg-gradient-to-r from-yellow-50 to-amber-50',
      borderClass: 'border-yellow-200',
      titleClass: 'text-yellow-900',
      textClass: 'text-yellow-800',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-600" />,
      bgClass: 'bg-gradient-to-r from-blue-50 to-sky-50',
      borderClass: 'border-blue-200',
      titleClass: 'text-blue-900',
      textClass: 'text-blue-800',
    },
  };

  const styles = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`${styles.bgClass} ${styles.borderClass} border-2 rounded-xl shadow-premium p-4 max-w-md backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold text-sm mb-1 ${styles.titleClass}`}>
              {title}
            </h4>
          )}
          <p className={`text-sm leading-relaxed ${styles.textClass}`}>
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export function AlertProvider({ children }: AlertProviderProps) {
  const showSuccess = (message: string, title?: string, duration = 4000) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && (
            <CustomToast type="success" title={title} message={message} />
          )}
        </AnimatePresence>
      ),
      { duration }
    );
  };

  const showError = (message: string, title?: string, duration = 6000) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && (
            <CustomToast type="error" title={title} message={message} />
          )}
        </AnimatePresence>
      ),
      { duration }
    );
  };

  const showWarning = (message: string, title?: string, duration = 5000) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && (
            <CustomToast type="warning" title={title} message={message} />
          )}
        </AnimatePresence>
      ),
      { duration }
    );
  };

  const showInfo = (message: string, title?: string, duration = 4000) => {
    toast.custom(
      (t) => (
        <AnimatePresence>
          {t.visible && (
            <CustomToast type="info" title={title} message={message} />
          )}
        </AnimatePresence>
      ),
      { duration }
    );
  };

  return (
    <AlertContext.Provider
      value={{
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
          },
        }}
        containerStyle={{
          top: 20,
          right: 20,
        }}
      />
    </AlertContext.Provider>
  );
}
