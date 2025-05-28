import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending actions from localStorage
    const stored = localStorage.getItem('pendingActions');
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addPendingAction = (action) => {
    const newActions = [...pendingActions, { ...action, id: Date.now(), timestamp: new Date() }];
    setPendingActions(newActions);
    localStorage.setItem('pendingActions', JSON.stringify(newActions));
  };

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    setSyncing(true);
    const successfulActions = [];

    for (const action of pendingActions) {
      try {
        // Execute the pending action
        await executeAction(action);
        successfulActions.push(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }

    // Remove successful actions
    const remainingActions = pendingActions.filter(action => !successfulActions.includes(action.id));
    setPendingActions(remainingActions);
    localStorage.setItem('pendingActions', JSON.stringify(remainingActions));
    
    setSyncing(false);
  };

  const executeAction = async (action) => {
    // Implementation would depend on your API structure
    const { method, url, data } = action;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  };

  // Status Banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-3 z-50">
        <div className="flex items-center justify-center space-x-2">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">You're offline</span>
          {pendingActions.length > 0 && (
            <span className="bg-yellow-600 px-2 py-1 rounded-full text-xs">
              {pendingActions.length} pending changes
            </span>
          )}
        </div>
      </div>
    );
  }

  // Sync Status
  if (syncing) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-3 z-50">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-medium">Syncing changes...</span>
        </div>
      </div>
    );
  }

  // Success notification
  if (isOnline && pendingActions.length === 0) {
    return (
      <div className="fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50 animate-fade-in">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">All changes synced</span>
        </div>
      </div>
    );
  }

  return null;
};

// Hook for offline functionality
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueAction = (action) => {
    if (!isOnline) {
      const pendingActions = JSON.parse(localStorage.getItem('pendingActions') || '[]');
      pendingActions.push({ ...action, id: Date.now(), timestamp: new Date() });
      localStorage.setItem('pendingActions', JSON.stringify(pendingActions));
      return true; // Queued
    }
    return false; // Execute immediately
  };

  return { isOnline, queueAction };
};

export default OfflineSync;