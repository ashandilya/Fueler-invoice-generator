import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building, Mail, Phone, MapPin } from 'lucide-react';
import { Client } from '../../types/client';
import { Button } from '../ui/Button';
import { ClientForm } from './ClientForm';

interface ClientListProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Client>;
  onUpdateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  loading: boolean;
  saving?: boolean;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  loading,
  saving = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      const newClient = await onAddClient(clientData);
      if (newClient) {
        // Show success message is handled by the error handler
      }
      setShowForm(false);
    } catch (error) {
      // Error is already handled by the error handler
      console.error('Failed to add client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingClient) return;
    
    setIsSubmitting(true);
    try {
      await onUpdateClient(editingClient.id, clientData);
      // Success message is handled by the error handler
      setEditingClient(null);
    } catch (error) {
      // Error is already handled by the error handler
      console.error('Failed to update client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      if (saving) {
        // Show toast instead of alert
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Please wait for the current operation to complete.',
            type: 'warning'
          }
        });
        window.dispatchEvent(event);
        return;
      }
      
      try {
        await onDeleteClient(id);
        // Success message is handled by the error handler
      } catch (error) {
        // Error is already handled by the error handler
        console.error('Failed to delete client:', error);
      }
    }
  };

  if (showForm) {
    return (
      <ClientForm
        onSubmit={handleAddClient}
        onCancel={() => setShowForm(false)}
        loading={isSubmitting || saving}
        title="Add New Client"
      />
    );
  }

  if (editingClient) {
    return (
      <ClientForm
        client={editingClient}
        onSubmit={handleUpdateClient}
        onCancel={() => setEditingClient(null)}
        loading={isSubmitting || saving}
        title="Edit Client"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Clients</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your client information and history</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          icon={Plus} 
          className="w-full sm:w-auto"
          disabled={saving}
        >
          Add New Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 px-4">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first client.
          </p>
          <div className="mt-6">
            <Button 
              onClick={() => setShowForm(true)} 
              icon={Plus} 
              className="w-full sm:w-auto"
              disabled={saving}
            >
              Add New Client
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-soft-lg transition-all duration-200 shadow-soft"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{client.name}</h3>
                  {client.businessName && (
                    <p className="text-sm text-gray-600 mt-1 truncate">{client.businessName}</p>
                  )}
                </div>
                <div className="flex space-x-2 flex-shrink-0 ml-2">
                  <button
                    onClick={() => {
                      if (saving) {
                        alert('Please wait for the current operation to complete.');
                        return;
                      }
                      setEditingClient(client);
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                    disabled={saving}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    disabled={saving}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                
                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}

                {client.gstin && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">GSTIN: {client.gstin}</span>
                  </div>
                )}

                {(client.city || client.state || client.country) && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="break-words">
                      {[client.city, client.state, client.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-start text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line break-words line-clamp-3">{client.billingAddress}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Added {client.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
};