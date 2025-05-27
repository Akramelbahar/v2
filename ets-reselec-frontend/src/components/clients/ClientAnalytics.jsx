
// 10. Enhanced Client Management with Analytics
// ets-reselec-frontend/src/components/clients/ClientAnalytics.jsx
import React from 'react';
import { BarChart3, TrendingUp, Package, Wrench, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '../../services/clientService';

const ClientAnalytics = ({ clientId }) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['client-analytics', clientId],
    queryFn: () => clientService.getAnalytics(clientId),
    enabled: !!clientId
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  }

  const stats = [
    {
      title: 'Total Equipment',
      value: analytics?.equipmentCount || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Interventions',
      value: analytics?.activeInterventions || 0,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Completed This Month',
      value: analytics?.completedThisMonth || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Maintenance Cost',
      value: `${analytics?.totalCost || 0} MAD`,
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Client Analytics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment Status Chart */}
      {analytics?.equipmentByStatus && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Equipment Status Distribution</h4>
          <div className="space-y-3">
            {Object.entries(analytics.equipmentByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.equipmentCount) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAnalytics;
