import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building, Mail, Phone, MapPin } from 'lucide-react';
import { Vendor } from '../../types/vendor';
import { Button } from '../ui/Button';
import { VendorForm } from './VendorForm';

interface VendorListProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Vendor>;
  onUpdateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  onDeleteVendor: (id: string) => Promise<void>;
  loading: boolean;
}

export const VendorList: React.FC<VendorListProps> = ({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  loading,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const handleAddVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    await onAddVendor(vendorData);
    setShowForm(false);
  };

  const handleUpdateVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingVendor) {
      await onUpdateVendor(editingVendor.id, vendorData);
      setEditingVendor(null);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      await onDeleteVendor(id);
    }
  };

  if (showForm) {
    return (
      <VendorForm
        onSubmit={handleAddVendor}
        onCancel={() => setShowForm(false)}
        loading={loading}
        title="Add New Vendor"
      />
    );
  }

  if (editingVendor) {
    return (
      <VendorForm
        vendor={editingVendor}
        onSubmit={handleUpdateVendor}
        onCancel={() => setEditingVendor(null)}
        loading={loading}
        title="Edit Vendor"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Vendors</h2>
        <Button onClick={() => setShowForm(true)} icon={Plus}>
          Add New Vendor
        </Button>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No vendors</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first vendor.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowForm(true)} icon={Plus}>
              Add New Vendor
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{vendor.name}</h3>
                  {vendor.businessName && (
                    <p className="text-sm text-gray-600 mt-1">{vendor.businessName}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingVendor(vendor)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{vendor.email}</span>
                </div>
                
                {vendor.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{vendor.phone}</span>
                  </div>
                )}

                {vendor.gstin && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>GSTIN: {vendor.gstin}</span>
                  </div>
                )}

                {(vendor.city || vendor.state || vendor.country) && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                      {[vendor.city, vendor.state, vendor.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-start text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{vendor.billingAddress}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Added {vendor.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};