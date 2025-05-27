

// ets-reselec-frontend/src/services/searchService.js
import api from './api';

export const searchService = {
  searchAll: async (query) => {
    const [clients, equipment, interventions] = await Promise.all([
      api.get('/clients', { params: { search: query, limit: 5 } }).catch(() => ({ data: { data: [] } })),
      api.get('/equipment', { params: { search: query, limit: 5 } }).catch(() => ({ data: { data: [] } })),
      api.get('/interventions', { params: { search: query, limit: 5 } }).catch(() => ({ data: { data: [] } }))
    ]);

    const formatResults = (items, type) => items.data.data.map(item => ({
      id: item.id,
      type,
      title: item.nom || item.nom_entreprise || item.description,
      subtitle: type === 'client' ? item.secteur_activite : 
                type === 'equipment' ? item.proprietaire?.nom_entreprise :
                item.equipement?.proprietaire?.nom_entreprise
    }));

    const byType = {
      client: formatResults(clients, 'client'),
      equipment: formatResults(equipment, 'equipment'),
      intervention: formatResults(interventions, 'intervention')
    };

    const allResults = [...byType.client, ...byType.equipment, ...byType.intervention];
    
    return {
      byType,
      allResults,
      total: allResults.length
    };
  }
};

// 15. Backend Routes Configuration