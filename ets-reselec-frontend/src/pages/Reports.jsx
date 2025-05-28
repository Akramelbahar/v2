// src/pages/Reports.jsx
import React, { useState } from 'react';
import { 
  FileText, Download, Calendar, Filter, Search, Eye, 
  Printer, Share2, BarChart3, Users, Package, Wrench,
  Clock, CheckCircle, AlertCircle, TrendingUp, Building,
  User, Settings, RefreshCw, Plus, PieChart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import FormField from '../components/forms/FormField';
import Select from '../components/forms/Select';

import {
  useDashboardStats,
  useChartsData,
  usePerformanceMetrics
} from '../hooks/useDashboard';
import { useClients } from '../hooks/useClients';
import { useEquipment } from '../hooks/useEquipment';
import { useInterventions } from '../hooks/useInterventions';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatNumber, formatCurrency, formatPercentage } from '../utils/formatUtils';

const Reports = () => {
  const { user, hasPermission } = useAuth();
  const [selectedReport, setSelectedReport] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    clientId: '',
    equipmentType: '',
    status: ''
  });

  // Data queries
  const { data: statsData, isLoading: statsLoading } = useDashboardStats('30');
  const { data: chartsData, isLoading: chartsLoading } = useChartsData('month');
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceMetrics('30');
  const { data: clientsData } = useClients({ limit: 1000 });
  const { data: equipmentData } = useEquipment({ limit: 1000 });
  const { data: interventionsData } = useInterventions({ 
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    limit: 1000
  });

  // Report Types Configuration
  const reportTypes = [
    {
      id: 'activity-summary',
      title: 'Résumé d\'Activité',
      description: 'Vue d\'ensemble des interventions et performances',
      icon: BarChart3,
      category: 'Général',
      color: 'bg-blue-500'
    },
    {
      id: 'interventions-detailed',
      title: 'Rapport Détaillé des Interventions',
      description: 'Liste complète des interventions avec détails',
      icon: Wrench,
      category: 'Interventions',
      color: 'bg-orange-500'
    },
    {
      id: 'client-report',
      title: 'Rapport par Client',
      description: 'Activité et statistiques par client',
      icon: Users,
      category: 'Clients',
      color: 'bg-green-500'
    },
    {
      id: 'equipment-maintenance',
      title: 'Rapport de Maintenance',
      description: 'État et historique de maintenance des équipements',
      icon: Package,
      category: 'Équipements',
      color: 'bg-purple-500'
    },
    {
      id: 'performance-report',
      title: 'Rapport de Performance',
      description: 'Métriques de performance et KPIs',
      icon: TrendingUp,
      category: 'Performance',
      color: 'bg-pink-500'
    },
    {
      id: 'technician-workload',
      title: 'Charge de Travail Techniciens',
      description: 'Analyse de la répartition du travail',
      icon: User,
      category: 'Ressources Humaines',
      color: 'bg-indigo-500'
    }
  ];

  // Generate Report Data
  const generateReportData = async (reportType) => {
    setIsGenerating(true);
    
    try {
      let data = {};
      
      switch (reportType) {
        case 'activity-summary':
          data = {
            title: 'Résumé d\'Activité',
            period: `Du ${formatDate(filters.dateFrom)} au ${formatDate(filters.dateTo)}`,
            summary: {
              totalInterventions: statsData?.overview?.totalInterventions || 0,
              completedInterventions: statsData?.overview?.completedInterventions || 0,
              activeInterventions: statsData?.overview?.activeInterventions || 0,
              completionRate: statsData?.overview?.completionRate || 0,
              totalEquipment: statsData?.overview?.totalEquipment || 0,
              totalClients: statsData?.overview?.totalClients || 0
            },
            charts: chartsData,
            performance: performanceData
          };
          break;
          
        case 'interventions-detailed':
          data = {
            title: 'Rapport Détaillé des Interventions',
            period: `Du ${formatDate(filters.dateFrom)} au ${formatDate(filters.dateTo)}`,
            interventions: interventionsData?.data || [],
            summary: {
              total: interventionsData?.total || 0,
              byStatus: chartsData?.interventionsByStatus || []
            }
          };
          break;
          
        case 'client-report':
          data = {
            title: 'Rapport par Client',
            period: `Du ${formatDate(filters.dateFrom)} au ${formatDate(filters.dateTo)}`,
            clients: clientsData?.data || [],
            clientActivity: chartsData?.clientActivity || []
          };
          break;
          
        case 'equipment-maintenance':
          data = {
            title: 'Rapport de Maintenance des Équipements',
            period: `Du ${formatDate(filters.dateFrom)} au ${formatDate(filters.dateTo)}`,
            equipment: equipmentData?.data || [],
            reliability: chartsData?.equipmentReliability || [],
            byType: chartsData?.equipmentByType || []
          };
          break;
          
        case 'performance-report':
          data = {
            title: 'Rapport de Performance',
            period: `Du ${formatDate(filters.dateFrom)} au ${formatDate(filters.dateTo)}`,
            metrics: performanceData || {},
            trends: chartsData?.monthlyTrends || []
          };
          break;
          
        case 'technician-workload':
          data = {
            title: 'Charge de Travail des Techniciens',
            period: `Du ${formatDate(filters.dateFrom)} au ${formatDate(filters.dateTo)}`,
            workload: performanceData?.workload || []
          };
          break;
          
        default:
          data = { title: 'Rapport Non Configuré', error: 'Type de rapport non supporté' };
      }
      
      setReportData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Report Preview Components
  const ActivitySummaryReport = ({ data }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
        <p className="text-gray-600">{data.period}</p>
        <p className="text-sm text-gray-500">Généré le {formatDateTime(new Date())}</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-blue-900">Total Interventions</h3>
          <p className="text-3xl font-bold text-blue-600">{formatNumber(data.summary.totalInterventions)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-green-900">Terminées</h3>
          <p className="text-3xl font-bold text-green-600">{formatNumber(data.summary.completedInterventions)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-orange-900">En Cours</h3>
          <p className="text-3xl font-bold text-orange-600">{formatNumber(data.summary.activeInterventions)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-purple-900">Taux Complétion</h3>
          <p className="text-3xl font-bold text-purple-600">{data.summary.completionRate}%</p>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-indigo-900">Équipements</h3>
          <p className="text-3xl font-bold text-indigo-600">{formatNumber(data.summary.totalEquipment)}</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-4 text-center">
          <h3 className="text-lg font-semibold text-pink-900">Clients</h3>
          <p className="text-3xl font-bold text-pink-600">{formatNumber(data.summary.totalClients)}</p>
        </div>
      </div>

      {/* Performance Metrics */}
      {data.performance && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Métriques de Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Temps Moyen de Résolution</h4>
              <p className="text-2xl font-bold text-gray-700">
                {formatNumber(data.performance.completion?.averageDays || 0)} jours
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">Temps de Réponse Urgent</h4>
              <p className="text-2xl font-bold text-gray-700">
                {formatNumber(data.performance.response?.urgent || 0)} jours
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const InterventionsDetailedReport = ({ data }) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
        <p className="text-gray-600">{data.period}</p>
        <p className="text-sm text-gray-500">Total: {formatNumber(data.summary.total)} interventions</p>
      </div>

      {/* Status Distribution */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Répartition par Statut</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.summary.byStatus.map((status, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-900">{status.status}</h4>
              <p className="text-2xl font-bold text-gray-700">{formatNumber(status.count)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interventions List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Liste des Interventions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Équipement</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Client</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Statut</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Urgence</th>
              </tr>
            </thead>
            <tbody>
              {data.interventions.slice(0, 50).map((intervention, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="px-4 py-2">{formatDate(intervention.date)}</td>
                  <td className="px-4 py-2">{intervention.equipement?.nom || 'N/A'}</td>
                  <td className="px-4 py-2">{intervention.equipement?.proprietaire?.nom_entreprise || 'N/A'}</td>
                  <td className="px-4 py-2">{intervention.statut}</td>
                  <td className="px-4 py-2">{intervention.urgence ? 'Oui' : 'Non'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.interventions.length > 50 && (
            <p className="text-center text-gray-500 mt-4">
              ... et {data.interventions.length - 50} autres interventions
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const ClientReport = ({ data }) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
        <p className="text-gray-600">{data.period}</p>
        <p className="text-sm text-gray-500">Total: {formatNumber(data.clients.length)} clients</p>
      </div>

      {/* Top Clients */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Clients les Plus Actifs</h2>
        <div className="space-y-3">
          {data.clientActivity.slice(0, 10).map((client, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <div>
                <h4 className="font-medium text-gray-900">{client.client}</h4>
                <p className="text-sm text-gray-600">{client.interventions} interventions</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-green-600">{client.completionRate}% complétées</p>
                <p className="text-sm text-gray-500">{client.completed} terminées</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Clients Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Résumé Tous Clients</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Entreprise</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Secteur</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Ville</th>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Équipements</th>
              </tr>
            </thead>
            <tbody>
              {data.clients.map((client, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium">{client.nom_entreprise}</td>
                  <td className="px-4 py-2">{client.secteur_activite || 'N/A'}</td>
                  <td className="px-4 py-2">{client.ville || 'N/A'}</td>
                  <td className="px-4 py-2">{client.equipmentCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const EquipmentMaintenanceReport = ({ data }) => (
    <div className="space-y-6">
      <div className="text-center border-b pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
        <p className="text-gray-600">{data.period}</p>
        <p className="text-sm text-gray-500">Total: {formatNumber(data.equipment.length)} équipements</p>
      </div>

      {/* Equipment by Type */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Répartition par Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.byType.map((type, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
              <h4 className="font-medium text-gray-900">{type.type?.replace(/_/g, ' ')}</h4>
              <p className="text-2xl font-bold text-gray-700">{formatNumber(type.count)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reliability Analysis */}
      {data.reliability.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Analyse de Fiabilité</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Interventions</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Échecs</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Taux d'Échec</th>
                </tr>
              </thead>
              <tbody>
                {data.reliability.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="px-4 py-2">{item.type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2 text-center">{item.totalInterventions}</td>
                    <td className="px-4 py-2 text-center">{item.failedInterventions}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`font-medium ${item.failureRate > 20 ? 'text-red-600' : item.failureRate > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.failureRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderReportPreview = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'activity-summary':
        return <ActivitySummaryReport data={reportData} />;
      case 'interventions-detailed':
        return <InterventionsDetailedReport data={reportData} />;
      case 'client-report':
        return <ClientReport data={reportData} />;
      case 'equipment-maintenance':
        return <EquipmentMaintenanceReport data={reportData} />;
      case 'performance-report':
        return <ActivitySummaryReport data={reportData} />; // Reuse for simplicity
      case 'technician-workload':
        return <ActivitySummaryReport data={reportData} />; // Reuse for simplicity
      default:
        return <div>Type de rapport non supporté</div>;
    }
  };

  const handleGenerateReport = (reportType) => {
    setSelectedReport(reportType);
    generateReportData(reportType);
  };

  const handleExportReport = (format) => {
    // Implementation for exporting reports
    console.log(`Exporting report in ${format} format`);
  };

  const isLoading = statsLoading || chartsLoading || performanceLoading;

  if (!hasPermission('reports:read')) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour générer des rapports.</p>
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
              <FileText className="w-8 h-8 text-blue-600" />
              <span>Rapports</span>
            </h1>
            <p className="text-gray-600 mt-1">Générez et consultez vos rapports d'activité</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Filtres de Période</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="Date de début" name="dateFrom">
            <input
              type="date"
              className="form-input"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
          </FormField>
          
          <FormField label="Date de fin" name="dateTo">
            <input
              type="date"
              className="form-input"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </FormField>

          <FormField label="Client" name="clientId">
            <select
              className="form-input"
              value={filters.clientId}
              onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
            >
              <option value="">Tous les clients</option>
              {clientsData?.data?.map(client => (
                <option key={client.id} value={client.id}>{client.nom_entreprise}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Statut" name="status">
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Tous les statuts</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="EN_COURS">En Cours</option>
              <option value="TERMINEE">Terminée</option>
              <option value="ANNULEE">Annulée</option>
            </select>
          </FormField>
        </div>
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-6">Types de Rapports</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <div
                  key={report.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => handleGenerateReport(report.id)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500">{report.category}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{report.description}</p>
                  <button 
                    className="w-full btn btn-primary"
                    disabled={isGenerating}
                  >
                    {isGenerating && selectedReport === report.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Génération...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Générer
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Rapports Récents</h2>
          <button className="btn btn-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
        
        <div className="space-y-3">
          {/* Mock recent reports */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Résumé d'Activité - Mars 2024</h4>
                <p className="text-sm text-gray-500">Généré le {formatDate(new Date())}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-secondary btn-sm">
                <Eye className="w-4 h-4 mr-1" />
                Voir
              </button>
              <button className="btn btn-secondary btn-sm">
                <Download className="w-4 h-4 mr-1" />
                Télécharger
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="font-medium text-gray-900">Rapport Client - Février 2024</h4>
                <p className="text-sm text-gray-500">Généré le {formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="btn btn-secondary btn-sm">
                <Eye className="w-4 h-4 mr-1" />
                Voir
              </button>
              <button className="btn btn-secondary btn-sm">
                <Download className="w-4 h-4 mr-1" />
                Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Aperçu du Rapport"
        size="4xl"
      >
        <div className="space-y-6">
          {/* Export Actions */}
          <div className="flex justify-end space-x-2 border-b pb-4">
            <button 
              onClick={() => handleExportReport('pdf')}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
            <button 
              onClick={() => handleExportReport('excel')}
              className="btn btn-secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="btn btn-secondary"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </button>
          </div>

          {/* Report Content */}
          <div className="max-h-96 overflow-y-auto">
            {renderReportPreview()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;