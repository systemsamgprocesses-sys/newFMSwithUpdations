import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Workflow, LayoutDashboard, GitBranch, PlayCircle, FileText, List, Users, AlertTriangle, ListTodo, Lock, Settings, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/create-fms', label: 'Create FMS', icon: GitBranch },
    { path: '/view-fms', label: 'View FMS', icon: List },
    { path: '/fms-progress', label: 'FMS Progress', icon: Target },
    { path: '/start-project', label: 'Start Project', icon: PlayCircle },
    { path: '/tasks', label: 'Task Management', icon: ListTodo },
    { path: '/logs', label: 'Logs', icon: FileText },
    { path: '/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        className="glass border-b border-slate-200/50 shadow-premium sticky top-0 z-50"
      >
        <div className="w-full px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center py-2 lg:py-0 lg:h-16 gap-2 lg:gap-4">
            {/* Logo Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between lg:justify-start lg:gap-4 flex-shrink-0"
            >
              <div className="flex items-center gap-3">
                <motion.img
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  src="/assets/AMG LOGO.webp" 
                  alt="Company Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center';
                    fallback.innerHTML = '<svg class="w-6 h-6 sm:w-8 sm:h-8 text-slate-900"><use href="#workflow-icon"></use></svg>';
                    e.currentTarget.parentElement?.insertBefore(fallback, e.currentTarget);
                  }}
                />
                <div className="hidden" id="workflow-icon">
                  <Workflow className="w-6 h-6 sm:w-8 sm:h-8 text-slate-900" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gradient whitespace-nowrap">
                    Task Management System
                  </h1>
                  <p className="text-xs text-slate-600 hidden md:block">Streamline Your Workflows</p>
                </div>
              </div>
            </motion.div>

            {/* Navigation Items */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overflow-x-auto scrollbar-premium -mx-3 px-3 lg:mx-0 lg:px-0 lg:flex-1"
            >
              <div className="flex gap-1 lg:gap-2 min-w-max lg:min-w-0 lg:justify-center">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(item.path)}
                      className={`btn-premium flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-accent-600 to-brand-600 text-white shadow-glow'
                          : 'text-slate-700 hover:bg-white/80 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* User Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between lg:justify-end gap-2 sm:gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-shrink-0"
            >
              <div className="text-xs sm:text-sm min-w-0 flex-shrink">
                <div className="text-slate-600 hidden sm:inline">Logged in as</div>
                <div className="font-semibold text-slate-900 truncate max-w-[120px] sm:max-w-none">{user?.username}</div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/change-password')}
                  className="btn-premium flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all text-xs sm:text-sm"
                  title="Change Password"
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xl:inline">Password</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="btn-premium flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg transition-all text-xs sm:text-sm"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <main className="py-3 sm:py-6">{children}</main>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelLogout}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="bg-white rounded-xl shadow-premium max-w-md w-full p-6 pointer-events-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Confirm Logout</h3>
                <p className="text-sm text-slate-600">Are you sure you want to logout?</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelLogout}
                className="btn-premium px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={confirmLogout}
                className="btn-premium px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 hover:shadow-glow rounded-lg transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
        )}
      </AnimatePresence>
    </div>
  );
}
