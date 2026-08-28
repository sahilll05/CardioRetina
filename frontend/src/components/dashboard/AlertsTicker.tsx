import React, { useEffect } from 'react';
import { useWsStore } from '@/store/wsStore';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AlertsTicker: React.FC = () => {
  const { criticalAlerts, dismissAlert } = useWsStore();

  if (criticalAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-4 mb-6">
      <AnimatePresence>
        {criticalAlerts.map(alert => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{alert.message}</span>
            </div>
            <button 
              onClick={() => dismissAlert(alert.id, 'Acknowledged by user')}
              className="p-1 hover:bg-destructive/20 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
