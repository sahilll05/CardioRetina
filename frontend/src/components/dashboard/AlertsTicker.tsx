import React from 'react';
import { useWsStore } from '@/store/wsStore';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AlertsTicker: React.FC = () => {
  const { criticalAlerts, dismissAlert } = useWsStore();

  if (criticalAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {criticalAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/40 rounded text-xs text-foreground font-normal"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span>{alert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissAlert(alert.id, 'Acknowledged by user')}
              className="p-1 hover:bg-destructive/20 text-muted-foreground hover:text-foreground rounded transition-colors duration-150"
              aria-label="Dismiss alert"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
