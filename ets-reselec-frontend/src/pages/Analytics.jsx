// src/pages/Analytics.jsx
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { 
  BarChart3, TrendingUp, TrendingDown, Activity, Clock, 
  CheckCircle, AlertCircle, Users, Package, Wrench, 
  Calendar, Filter, Download, RefreshCw, Eye, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

import {
  useChartsData,
  usePerformanceMetrics,
  useDashboardStats
} from '../hooks/useDashboard';
import { formatNumber, formatPercentage, formatCurrency } from '../utils/formatUtils';
import { formatDate } from '../utils/dateUtils';

const Analytics = () => {
  const { hasPermission } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30');

  // Data queries
  const { data: chartsData, isLoading: chartsLoading } = useChartsData(selectedPeriod);
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceMetrics(selectedTimeframe);
  const { data: statsData, isLoading: statsLoading } = useDashboardStats(selectedTimeframe);

  // Chart Component (Simple visualization)
  const SimpleChart = ({ data, title, type = 'bar' }) => {
    if (!data || data.length === 0) {
      return (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <div className="text-center text-gray-500 py-8">Aucune donnée disponible</div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => item.count || item.total || item.interventions || 0));

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => {
            const value = item.count || item.total || item.interventions || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const label = item.status || item.type || item.client || item.month || `Item ${index + 1}`;
            
            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-24 text-sm font-medium text-gray-700 truncate">
                  {label}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {formatNumber(value)}
                  </span>
                </div>
                <div className="w-16 text-right text-sm text-gray-600">
                  {item.percentage && `${item.percentage}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Metric Card Component
  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue', loading = false }) => (
    <div className="bg-white rounded-lg border p-6">
      {loading ? (
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div className="w-8 h-8 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-12"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(value || 0)}</p>
              {change && (
                <div className={`flex items-center mt-1 text-sm ${
                  change.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change.positive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span>{change.value}%</span>
                </div>
              )}
            </div>
            <Icon className={`w-8 h-8 text-${color}-600`} />
          </div>
        </>
      )}
    </div>
  );

  // Performance Indicator Component
  const PerformanceIndicator = ({ label, value, target, unit = '', format = 'number' }) => {
    const percentage = target ? (value / target) * 100 : 0;
    const isGood = percentage >= 80;
    const isAverage = percentage >= 60 && percentage < 80;
    
    const formatValue = (val) => {
      switch (format) {
        case 'percentage':
          return formatPercentage(val);
        case 'currency':
          return formatCurrency(val);
        case 'days':
          return `${formatNumber(val)} jours`;
        default:
          return formatNumber(val) + (unit ? ` ${unit}` : '');
      }
    };

    return (
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-gray-700">{label}</h4>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isGood ? 'bg-green-100 text-green-800' :
            isAverage ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {percentage.toFixed(0)}%
          </div>
        </div>
        
        <div className="mb-2">
          <p className="text-2xl font-bold text-gray-900">{formatValue(value || 0)}</p>
          {target && (
            <p className="text-sm text-gray-500">Objectif: {formatValue(target)}</p>
          )}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              isGood ? 'bg-green-500' :
              isAverage ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const isLoading = chartsLoading || performanceLoading || statsLoading;

  if (!hasPermission('analytics:read')) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour voir les analyses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <span>Analyses et Rapports</span>
            </h1>
            <p className="text-gray-600 mt-1">Analysez les performances et tendances de votre activité</p>
          </div>
          
          <div className="flex space-x-2">
            <select
              className="form-input min-w-[150px]"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
            </select>
            
            <button className="btn btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Interventions"
          value={statsData?.overview?.totalInterventions}
          icon={Wrench}
          color="blue"
          loading={statsLoading}
        />
        <MetricCard
          title="Taux de Completion"
          value={statsData?.overview?.completionRate}
          icon={CheckCircle}
          color="green" 
          loading={statsLoading}
        />
        <MetricCard
          title="Interventions Actives"
          value={statsData?.overview?.activeInterventions}
          icon={Activity}
          color="orange"
          loading={statsLoading}
        />
        <MetricCard
          title="Alertes Critiques"
          value={statsData?.alerts?.urgentInterventions}
          icon={AlertCircle}
          color="red"
          loading={statsLoading}
        />
      </div>

      {/* Charts Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border p-6">
              <LoadingSpinner />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interventions by Status */}
          <SimpleChart
            data={chartsData?.interventionsByStatus || []}
            title="Interventions par Statut"
            type="bar"
          />

          {/* Equipment by Type */}
          <SimpleChart
            data={chartsData?.equipmentByType || []}
            title="Équipements par Type"
            type="bar"
          />

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Tendances Mensuelles</h3>
            {chartsData?.monthlyTrends?.length > 0 ? (
              <div className="space-y-4">
                {chartsData.monthlyTrends.slice(-6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.month}</span>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{item.total} interventions</p>
                        <p className="text-xs text-gray-500">{item.completed} terminées</p>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${item.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12">{item.completionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">Aucune donnée disponible</div>
            )}
          </div>

          {/* Client Activity */}
          <SimpleChart
            data={chartsData?.clientActivity?.slice(0, 8) || []}
            title="Activité par Client (Top 8)"
            type="bar"
          />
        </div>
      )}

      {/* Performance Indicators */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Indicateurs de Performance</h2>
          <select
            className="form-input"
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">Cette année</option>
          </select>
        </div>

        {performanceLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PerformanceIndicator
              label="Temps Moyen de Résolution"
              value={performanceData?.completion?.averageDays}
              target={5}
              format="days"
            />
            
            <PerformanceIndicator
              label="Taux de Complétion"
              value={performanceData?.completion?.completionRate}
              target={90}
              format="percentage"
            />
            
            <PerformanceIndicator
              label="Temps de Réponse Urgent"
              value={performanceData?.response?.urgent}
              target={1}
              format="days"
            />
            
            <PerformanceIndicator
              label="Temps de Réponse Normal"
              value={performanceData?.response?.normal}
              target={3}
              format="days"
            />
            
            <PerformanceIndicator
              label="Interventions Traitées"
              value={performanceData?.completion?.totalProcessed}
              target={100}
            />
            
            <PerformanceIndicator
              label="Satisfaction Client"
              value={85}
              target={90}
              format="percentage"
            />
          </div>
        )}
      </div>

      {/* Equipment Reliability */}
      {chartsData?.equipmentReliability?.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Fiabilité des Équipements</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type d'Équipement</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Interventions</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Échecs</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Taux d'Échec</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Fiabilité</th>
                </tr>
              </thead>
              <tbody>
                {chartsData.equipmentReliability.map((item, index) => {
                  const reliability = 100 - item.failureRate;
                  const reliabilityColor = reliability >= 90 ? 'text-green-600' : reliability >= 70 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.type?.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-center">{item.totalInterventions}</td>
                      <td className="py-3 px-4 text-center">{item.failedInterventions}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${item.failureRate > 20 ? 'text-red-600' : item.failureRate > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.failureRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${reliability >= 90 ? 'bg-green-500' : reliability >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${reliability}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${reliabilityColor}`}>
                            {reliability.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workload Analysis */}
      {performanceData?.workload?.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analyse de la Charge de Travail</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.workload.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.user}</h4>
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Interventions actives:</span>
                    <span className="font-medium">{item.activeInterventions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Urgentes:</span>
                    <span className={`font-medium ${item.urgentInterventions > 3 ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.urgentInterventions}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.activeInterventions > 10 ? 'bg-red-500' : item.activeInterventions > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min((item.activeInterventions / 15) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Recommandations</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-2">Amélioration des Performances</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Réduire le temps de résolution moyen</li>
              <li>• Optimiser la planification des interventions urgentes</li>
              <li>• Former l'équipe sur les équipements moins fiables</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-2">Gestion Préventive</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Mettre en place une maintenance préventive</li>
              <li>• Analyser les équipements à fort taux d'échec</li>
              <li>• Équilibrer la charge de travail des techniciens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;