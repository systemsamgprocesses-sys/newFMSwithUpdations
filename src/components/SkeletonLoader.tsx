import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6 space-y-4"
    >
      <div className="skeleton h-6 w-3/4 mx-auto rounded-lg" />
      <div className="skeleton h-4 w-full rounded-lg" />
      <div className="skeleton h-4 w-5/6 mx-auto rounded-lg" />
      <div className="flex gap-3 mt-4 justify-center">
        <div className="skeleton h-10 w-24 rounded-lg" />
        <div className="skeleton h-10 w-24 rounded-lg" />
      </div>
    </motion.div>
  );
}

export function SkeletonTable() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl shadow-lg border border-slate-200/50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="skeleton h-8 w-48 mx-auto rounded-lg" />
      </div>
      
      {/* Table Rows */}
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-12 flex-1 rounded-lg" />
            <div className="skeleton h-12 w-32 rounded-lg" />
            <div className="skeleton h-12 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function SkeletonStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 justify-center"
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-4"
        >
          <div className="skeleton h-4 w-20 rounded mb-3" />
          <div className="skeleton h-8 w-16 rounded mb-2" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      ))}
    </motion.div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {[...Array(items)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-lg shadow border border-slate-200/50 p-4 flex items-center gap-4"
        >
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
          <div className="skeleton h-8 w-20 rounded" />
        </motion.div>
      ))}
    </motion.div>
  );
}

export function SkeletonDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6"
    >
      <div className="card-premium">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="skeleton h-8 w-2/3 mx-auto mb-3" />
          <div className="skeleton h-4 w-1/2 mx-auto" />
        </div>

        {/* Stats Grid */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-premium-gradient-subtle">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 h-28 flex flex-col justify-between">
                <div className="skeleton h-4 w-3/4 mx-auto mb-2" />
                <div className="skeleton h-6 w-1/2 mx-auto mb-1" />
                <div className="skeleton h-3 w-1/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50">
          <div className="px-2 sm:px-4 md:px-6 py-3">
            <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-premium -mx-2 sm:-mx-4 md:-mx-6 px-2 sm:px-4 md:px-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-28 rounded-lg flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 sm:p-6">
          <div className="overflow-x-auto scrollbar-premium -mx-2 sm:-mx-4 md:-mx-6 px-2 sm:px-4 md:px-6">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-2 sm:px-3 md:px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                      <div className="skeleton h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="h-20">
                    <td className="px-2 sm:px-3 md:px-4 py-3">
                      <div className="skeleton h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-3">
                      <div className="space-y-2">
                        <div className="skeleton h-4 w-40" />
                        <div className="skeleton h-3 w-24" />
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 hidden sm:table-cell">
                      <div className="skeleton h-4 w-24" />
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-3 hidden md:table-cell">
                      <div className="skeleton h-4 w-20" />
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-3">
                      <div className="skeleton h-6 w-20 rounded-full" />
                    </td>
                    <td className="px-2 sm:px-3 md:px-4 py-3">
                      <div className="flex gap-1">
                        <div className="skeleton h-6 w-16 rounded" />
                        <div className="skeleton h-6 w-12 rounded" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-40 rounded-lg mx-auto sm:mx-0" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Generic Skeleton for any content
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

