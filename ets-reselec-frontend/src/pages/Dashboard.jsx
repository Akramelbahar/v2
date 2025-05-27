import React, { useState } from 'react';
import { Users, Settings, Wrench, FileText, AlertCircle, CheckCircle, Clock, Pause, X, Plus, Search, Edit, Trash2, Eye, Play, ArrowRight, Upload, Download, FileCheck } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  // Mock data
  const stats = {
    totalInterventions: 245,
    inProgress: 18,
    pending: 12,
    completed: 215,
    equipments: 89,
    clients: 34
  };

  const recentInterventions = [
    { 
      id: 1, 
      equipment: 'Moteur Électrique - ABC Corp', 
      type: 'Maintenance', 
      status: 'EN_COURS', 
      urgence: true, 
      date: '2025-05-26',
      operations: {
        diagnostic: { status: 'TERMINEE', date: '2025-05-24', travailRequis: ['Remplacer roulements', 'Contrôler bobinage'], besoinPDR: ['Roulements SKF', 'Huile isolante'] },
        planification: { status: 'TERMINEE', date: '2025-05-25', capaciteExecution: 85, urgencePrise: true, disponibilitePDR: true },
        controleQualite: { status: 'EN_COURS', date: '2025-05-26', resultatsEssais: 'En cours...', analyseVibratoire: 'Pending' }
      }
    },
    { 
      id: 2, 
      equipment: 'Transformateur - XYZ Industries', 
      type: 'Renovation', 
      status: 'PLANIFIEE', 
      urgence: false, 
      date: '2025-05-25',
      operations: {
        diagnostic: { status: 'TERMINEE', date: '2025-05-23', travailRequis: ['Changement huile', 'Test isolation'], besoinPDR: ['Huile transformateur', 'Joints'] },
        planification: { status: 'EN_COURS', date: '2025-05-25', capaciteExecution: 60, urgencePrise: false, disponibilitePDR: false },
        controleQualite: { status: 'EN_ATTENTE', date: null, resultatsEssais: '', analyseVibratoire: '' }
      }
    }
  ];

  const clients = [
    { id: 1, nom: 'ABC Corporation', secteur: 'Manufacturing', equipments: 12, interventions: 23 },
    { id: 2, nom: 'XYZ Industries', secteur: 'Energy', equipments: 8, interventions: 15 },
    { id: 3, nom: 'Tech Solutions', secteur: 'Technology', equipments: 6, interventions: 11 }
  ];

  const equipments = [
    { id: 1, nom: 'Moteur Principal', type: 'MOTEUR_ELECTRIQUE', marque: 'Siemens', client: 'ABC Corp', status: 'Active' },
    { id: 2, nom: 'Transformateur T1', type: 'TRANSFORMATEUR', marque: 'ABB', client: 'XYZ Industries', status: 'Maintenance' },
    { id: 3, nom: 'Générateur G1', type: 'GENERATEUR', marque: 'Caterpillar', client: 'Tech Solutions', status: 'Active' }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'EN_COURS': return 'bg-blue-100 text-blue-800';
      case 'PLANIFIEE': return 'bg-yellow-100 text-yellow-800';
      case 'TERMINEE': return 'bg-green-100 text-green-800';
      case 'EN_ATTENTE_PDR': return 'bg-orange-100 text-orange-800';
      case 'ANNULEE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'EN_COURS': return <Clock className="w-4 h-4" />;
      case 'PLANIFIEE': return <AlertCircle className="w-4 h-4" />;
      case 'TERMINEE': return <CheckCircle className="w-4 h-4" />;
      case 'EN_ATTENTE_PDR': return <Pause className="w-4 h-4" />;
      case 'ANNULEE': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const openWorkflowModal = (intervention) => {
    setSelectedIntervention(intervention);
    setShowWorkflowModal(true);
  };

  const InterventionWorkflow = () => {
    const [filterStatus, setFilterStatus] = useState('ALL');

    const filteredInterventions = filterStatus === 'ALL' 
      ? recentInterventions 
      : recentInterventions.filter(i => i.status === filterStatus);

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">Workflow des Interventions</h2>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PLANIFIEE">Planifiée</option>
                <option value="EN_COURS">En Cours</option>
                <option value="EN_ATTENTE_PDR">En Attente PDR</option>
                <option value="TERMINEE">Terminée</option>
              </select>
            </div>
            <button 
              onClick={() => openModal('intervention')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Intervention</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredInterventions.map(intervention => (
            <div key={intervention.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold">{intervention.equipment}</h3>
                      {intervention.urgence && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>URGENT</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Type: {intervention.type}</span>
                      <span>Date: {intervention.date}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(intervention.status)}`}>
                        {intervention.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => openWorkflowModal(intervention)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Détails</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        intervention.operations.diagnostic.status === 'TERMINEE' 
                          ? 'bg-green-500 text-white' 
                          : intervention.operations.diagnostic.status === 'EN_COURS'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {intervention.operations.diagnostic.status === 'TERMINEE' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">Diagnostic</div>
                        <div className="text-xs text-gray-500">
                          {intervention.operations.diagnostic.date || 'En attente'}
                        </div>
                        <div className={`text-xs font-medium ${
                          intervention.operations.diagnostic.status === 'TERMINEE' ? 'text-green-600' : 
                          intervention.operations.diagnostic.status === 'EN_COURS' ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {intervention.operations.diagnostic.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4">
                    <ArrowRight className={`w-5 h-5 ${
                      intervention.operations.diagnostic.status === 'TERMINEE' ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        intervention.operations.planification.status === 'TERMINEE' 
                          ? 'bg-green-500 text-white' 
                          : intervention.operations.planification.status === 'EN_COURS'
                          ? 'bg-blue-500 text-white'
                          : intervention.operations.planification.status === 'EN_ATTENTE_PDR'
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {intervention.operations.planification.status === 'TERMINEE' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : intervention.operations.planification.status === 'EN_ATTENTE_PDR' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <Settings className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">Planification</div>
                        <div className="text-xs text-gray-500">
                          {intervention.operations.planification.date || 'En attente'}
                        </div>
                        <div className={`text-xs font-medium ${
                          intervention.operations.planification.status === 'TERMINEE' ? 'text-green-600' : 
                          intervention.operations.planification.status === 'EN_COURS' ? 'text-blue-600' : 
                          intervention.operations.planification.status === 'EN_ATTENTE_PDR' ? 'text-orange-600' : 'text-gray-500'
                        }`}>
                          {intervention.operations.planification.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-4">
                    <ArrowRight className={`w-5 h-5 ${
                      intervention.operations.planification.status === 'TERMINEE' ? 'text-green-500' : 'text-gray-300'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        intervention.operations.controleQualite.status === 'TERMINEE' 
                          ? 'bg-green-500 text-white' 
                          : intervention.operations.controleQualite.status === 'EN_COURS'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {intervention.operations.controleQualite.status === 'TERMINEE' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <FileCheck className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">Contrôle Qualité</div>
                        <div className="text-xs text-gray-500">
                          {intervention.operations.controleQualite.date || 'En attente'}
                        </div>
                        <div className={`text-xs font-medium ${
                          intervention.operations.controleQualite.status === 'TERMINEE' ? 'text-green-600' : 
                          intervention.operations.controleQualite.status === 'EN_COURS' ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {intervention.operations.controleQualite.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{
                        width: `${
                          intervention.operations.controleQualite.status === 'TERMINEE' ? 100 :
                          intervention.operations.controleQualite.status === 'EN_COURS' ? 80 :
                          intervention.operations.planification.status === 'TERMINEE' ? 66 :
                          intervention.operations.planification.status === 'EN_COURS' || intervention.operations.planification.status === 'EN_ATTENTE_PDR' ? 50 :
                          intervention.operations.diagnostic.status === 'TERMINEE' ? 33 :
                          intervention.operations.diagnostic.status === 'EN_COURS' ? 16 : 0
                        }%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Début</span>
                    <span>
                      {intervention.operations.controleQualite.status === 'TERMINEE' ? 'Terminé' :
                       intervention.operations.controleQualite.status === 'EN_COURS' ? '80% Complété' :
                       intervention.operations.planification.status === 'TERMINEE' ? '66% Complété' :
                       intervention.operations.planification.status === 'EN_COURS' || intervention.operations.planification.status === 'EN_ATTENTE_PDR' ? '50% Complété' :
                       intervention.operations.diagnostic.status === 'TERMINEE' ? '33% Complété' :
                       intervention.operations.diagnostic.status === 'EN_COURS' ? '16% Complété' : '0% Complété'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const WorkflowDetailModal = () => {
    if (!showWorkflowModal || !selectedIntervention) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Détails de l'Intervention</h3>
              <button onClick={() => setShowWorkflowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mt-2 text-lg text-gray-700">{selectedIntervention.equipment}</div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Diagnostic</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIntervention.operations.diagnostic.status)}`}>
                  {selectedIntervention.operations.diagnostic.status.replace('_', ' ')}
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Travail Requis:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedIntervention.operations.diagnostic.travailRequis?.map((travail, idx) => (
                      <li key={idx}>{travail}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Besoin PDR:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {selectedIntervention.operations.diagnostic.besoinPDR?.map((besoin, idx) => (
                      <li key={idx}>{besoin}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-lg mb-3">Actions Disponibles</h4>
              <div className="flex flex-wrap gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                  <Play className="w-4 h-4" />
                  <span>Continuer Workflow</span>
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100">
                  <Upload className="w-4 h-4" />
                  <span>Ajouter Documents</span>
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-100">
                  <Edit className="w-4 h-4" />
                  <span>Modifier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Modal = () => {
    if (!showModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {modalType === 'client' && 'Nouveau Client'}
              {modalType === 'equipment' && 'Nouvel Équipement'}
              {modalType === 'intervention' && 'Nouvelle Intervention'}
            </h3>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {modalType === 'client' && (
              <>
                <input type="text" placeholder="Nom de l'entreprise" className="w-full p-2 border rounded-lg" />
                <input type="text" placeholder="Secteur d'activité" className="w-full p-2 border rounded-lg" />
                <input type="email" placeholder="Email" className="w-full p-2 border rounded-lg" />
                <input type="tel" placeholder="Téléphone" className="w-full p-2 border rounded-lg" />
              </>
            )}
            
            {modalType === 'equipment' && (
              <>
                <input type="text" placeholder="Nom de l'équipement" className="w-full p-2 border rounded-lg" />
                <select className="w-full p-2 border rounded-lg">
                  <option>Type d'équipement</option>
                  <option>MOTEUR_ELECTRIQUE</option>
                  <option>TRANSFORMATEUR</option>
                  <option>GENERATEUR</option>
                  <option>POMPE_INDUSTRIELLE</option>
                </select>
                <input type="text" placeholder="Marque" className="w-full p-2 border rounded-lg" />
                <select className="w-full p-2 border rounded-lg">
                  <option>Client propriétaire</option>
                  {clients.map(client => (
                    <option key={client.id}>{client.nom}</option>
                  ))}
                </select>
              </>
            )}
            
            {modalType === 'intervention' && (
              <>
                <select className="w-full p-2 border rounded-lg">
                  <option>Équipement</option>
                  {equipments.map(eq => (
                    <option key={eq.id}>{eq.nom} - {eq.client}</option>
                  ))}
                </select>
                <select className="w-full p-2 border rounded-lg">
                  <option>Type d'intervention</option>
                  <option>Maintenance</option>
                  <option>Renovation</option>
                </select>
                <textarea placeholder="Description" className="w-full p-2 border rounded-lg h-20"></textarea>
                <div className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>Intervention urgente</span>
                </div>
              </>
            )}
            
            <div className="flex space-x-2 pt-4">
              <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Créer
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Interventions" value={stats.totalInterventions} icon={Wrench} color="text-blue-600" />
              <StatCard title="En Cours" value={stats.inProgress} icon={Clock} color="text-orange-600" />
              <StatCard title="Équipements" value={stats.equipments} icon={Settings} color="text-green-600" />
              <StatCard title="Clients" value={stats.clients} icon={Users} color="text-purple-600" />
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Interventions Récentes</h2>
                  <button 
                    onClick={() => openModal('intervention')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle Intervention</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4">Équipement</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-left p-4">Statut</th>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInterventions.map(intervention => (
                      <tr key={intervention.id} className="border-t">
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {intervention.urgence && <AlertCircle className="w-4 h-4 text-red-500" />}
                            <span>{intervention.equipment}</span>
                          </div>
                        </td>
                        <td className="p-4">{intervention.type}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit ${getStatusColor(intervention.status)}`}>
                            {getStatusIcon(intervention.status)}
                            <span>{intervention.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="p-4">{intervention.date}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button onClick={() => openWorkflowModal(intervention)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                            <button className="text-yellow-600 hover:text-yellow-800"><Edit className="w-4 h-4" /></button>
                            <button className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'interventions':
        return <InterventionWorkflow />;

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Section en développement
            </h2>
            <p className="text-gray-600">
              Cette section sera bientôt disponible.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="text-gray-600 mt-1">Vue d'ensemble du système ETS RESELEC</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm text-gray-500">
              <p>Dernière mise à jour</p>
              <p className="font-medium">{new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: FileText },
              { id: 'interventions', label: 'Workflow Interventions', icon: Wrench }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      <Modal />
      <WorkflowDetailModal />
    </div>
  );
};

export default Dashboard;