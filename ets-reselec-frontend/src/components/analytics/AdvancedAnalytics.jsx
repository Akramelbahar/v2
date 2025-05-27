
// 18. Advanced Analytics Dashboard
// ets-reselec-frontend/src/components/analytics/AdvancedAnalytics.jsx
import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Activity, Users, Package, Wrench, 
  Calendar, Filter, Download, RefreshCw 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';

const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetrics, setSelectedMetrics] = useState(['interventions', 'equipment', 'performance']);

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['advanced-analytics', timeRange],
    queryFn: () => analyticsService.getAdvancedAnalytics(timeRange),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // KPI Cards
  const KPICard = ({ title, value, trend, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend.positive ? '' : 'rotate-180'}`} />
              <span>{trend.value}% vs last period</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  // Intervention Trends Chart
  const InterventionTrendsChart = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Intervention Trends</h3>
        <div className="flex space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Filter className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data?.monthlyTrends || []}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Interventions" />
          <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
          <Line type="monotone" dataKey="urgent" stroke="#ffc658" name="Urgent" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Equipment Status Distribution
  const EquipmentStatusChart = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Equipment Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data?.equipmentByStatus || []}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {(data?.equipmentByStatus || []).map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  // Performance Metrics
  const PerformanceMetrics = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
      <div className="space-y-4">
        {data?.performanceMetrics?.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{metric.name}</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${metric.percentage}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Top Performers
  const TopPerformers = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Clients</h3>
      <div className="space-y-4">
        {data?.topClients?.map((client, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{client.name}</div>
              <div className="text-sm text-gray-500">{client.interventions} interventions</div>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">{client.completionRate}%</div>
              <div className="text-sm text-gray-500">completion</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Interventions"
          value={analytics?.overview?.totalInterventions || 0}
          trend={{ positive: true, value: 12.5 }}
          icon={Wrench}
          color="bg-blue-600"
        />
        <KPICard
          title="Active Equipment"
          value={analytics?.overview?.activeEquipment || 0}
          trend={{ positive: true, value: 8.2 }}
          icon={Package}
          color="bg-green-600"
        />
        <KPICard
          title="Client Satisfaction"
          value={`${analytics?.overview?.satisfaction || 0}%`}
          trend={{ positive: true, value: 3.1 }}
          icon={Users}
          color="bg-purple-600"
        />
        <KPICard
          title="Avg Response Time"
          value={`${analytics?.overview?.avgResponseTime || 0}h`}
          trend={{ positive: false, value: 5.7 }}
          icon={Activity}
          color="bg-orange-600"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InterventionTrendsChart data={analytics} />
        <EquipmentStatusChart data={analytics} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceMetrics data={analytics} />
        <TopPerformers data={analytics} />
      </div>

      {/* Detailed Tables */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
        </div>
        
        <div className="p-6">
          {/* Add detailed tables here */}
          <div className="text-center text-gray-500 py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Detailed analytics tables will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
