import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, UserCheck, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import SearchInput from '../components/common/SearchInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  useSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection
} from '../hooks/useSections';
import { useQuery } from '@tanstack/react-query';
import { sectionService } from '../services/sectionService';

const Sections = () => {
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data queries
  const { data: sectionsResponse, isLoading } = useSections({
    page: currentPage,
    limit: pageSize,
    search: searchQuery
  });

  // Extract data and pagination from response
  const sectionsData = sectionsResponse?.data || [];
  const pagination = sectionsResponse?.pagination || { total: 0, pages: 1 };

  // Get available users for responsable selection
  const { data: usersData } = useQuery({
    queryKey: ['available-users'],
    queryFn: () => sectionService.getAvailableUsers().then(res => res.data.data),
    staleTime: 300000
  });

  // Mutations
  const createMutation = useCreateSection();
  const updateMutation = useUpdateSection();
  const deleteMutation = useDeleteSection();

  // Handlers
  const openModal = (section = null) => {
    setSelectedSection(section);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSection(null);
  };

  const openDeleteDialog = (section) => {
    setSelectedSection(section);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedSection) return;
    
    try {
      await deleteMutation.mutateAsync(selectedSection.id);
      setShowDeleteDialog(false);
      setSelectedSection(null);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Section Form Component
  const SectionForm = ({ section, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
      nom: section?.nom || '',
      responsable_id: section?.responsable_id || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const submitData = {
        nom: formData.nom,
        responsable_id: formData.responsable_id || null
      };
      onSubmit(submitData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la section *
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            placeholder="Ex: Maintenance Préventive"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Responsable de section
          </label>
          <select
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={formData.responsable_id}
            onChange={(e) => handleChange('responsable_id', e.target.value)}
          >
            <option value="">Aucun responsable</option>
            {usersData?.map(user => (
              <option key={user.id} value={user.id}>
                {user.nom} ({user.username})
                {user.sectionBelongsTo && ` - ${user.sectionBelongsTo.nom}`}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Le responsable sera automatiquement assigné à cette section
          </p>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            <span>{section ? 'Modifier' : 'Créer'}</span>
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Sections</h1>
            <p className="text-gray-600 mt-1">Gérez les sections et départements de votre organisation</p>
          </div>
          {isAdmin() && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Section</span>
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Les interventions sont automatiquement filtrées selon la section de l'utilisateur qui les a créées. 
          Les administrateurs peuvent voir toutes les interventions.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <SearchInput
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Rechercher une section..."
        />
      </div>

      {/* Sections Table */}
      <DataTable
        data={sectionsData}
        loading={isLoading}
        columns={[
          {
            key: 'nom',
            header: 'Nom de la Section',
            render: (value, row) => (
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{value}</span>
              </div>
            )
          },
          {
            key: 'responsable',
            header: 'Responsable',
            render: (value) => value ? (
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                <span>{value.nom}</span>
              </div>
            ) : (
              <span className="text-gray-500 italic">Non assigné</span>
            )
          },
          {
            key: 'userCount',
            header: 'Nombre d\'utilisateurs',
            render: (value) => (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{value || 0}</span>
              </div>
            )
          },
          {
            key: 'interventionCount',
            header: 'Interventions',
            render: (value) => (
              <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                {value || 0}
              </span>
            )
          }
        ]}
        actions={isAdmin() ? [
          {
            icon: Edit,
            label: 'Modifier',
            onClick: (row) => openModal(row),
            className: 'text-blue-600 hover:text-blue-800'
          },
          {
            icon: Trash2,
            label: 'Supprimer',
            onClick: (row) => openDeleteDialog(row),
            className: 'text-red-600 hover:text-red-800',
            disabled: (row) => row.userCount > 0
          }
        ] : null}
        pagination={
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        }
      />

      {/* Section Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={selectedSection ? 'Modifier la Section' : 'Nouvelle Section'}
        size="md"
      >
        <SectionForm
          section={selectedSection}
          onSubmit={async (data) => {
            try {
              if (selectedSection) {
                await updateMutation.mutateAsync({ id: selectedSection.id, data });
              } else {
                await createMutation.mutateAsync(data);
              }
              closeModal();
            } catch (error) {
              console.error('Form submission error:', error);
            }
          }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer la section "${selectedSection?.nom}" ? Cette action est irréversible.`}
        type="danger"
        confirmText="Supprimer"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Sections;