import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Client } from '../../types/client';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  title: string;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading,
  title,
}) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    businessName: client?.businessName || '',
    phone: client?.phone || '',
    gstin: client?.gstin || '',
    city: client?.city || '',
    state: client?.state || '',
    country: client?.country || 'India',
    billingAddress: client?.billingAddress || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = 'Billing address is required';
    }

    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.gstin && formData.gstin.length > 0 && formData.gstin.length !== 15) {
      newErrors.gstin = 'GSTIN must be 15 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent double submission
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Form stays open on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const actualLoading = loading || isSubmitting;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">Enter client details for future invoices</p>
          </div>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            size="sm"
            icon={X}
            disabled={actualLoading}
          >
            Close
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Client Name *"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Enter client name"
              disabled={actualLoading}
            />
            
            <Input
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              placeholder="client@example.com"
              disabled={actualLoading}
            />
          </div>

          <Input
            label="Business Name *"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            error={errors.businessName}
            placeholder="Enter business name"
            disabled={actualLoading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
              disabled={actualLoading}
            />
            
            <Input
              label="GSTIN"
              value={formData.gstin}
              onChange={(e) => handleInputChange('gstin', e.target.value)}
              error={errors.gstin}
              placeholder="Enter GSTIN number"
              helperText="15-digit GSTIN number (optional)"
              disabled={actualLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Input
              label="City"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city"
              disabled={actualLoading}
            />
            
            <Input
              label="State"
              value={formData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="Enter state"
              disabled={actualLoading}
            />
            
            <Input
              label="Country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="Enter country"
              disabled={actualLoading}
            />
          </div>

          <Textarea
            label="Billing Address *"
            value={formData.billingAddress}
            onChange={(e) => handleInputChange('billingAddress', e.target.value)}
            error={errors.billingAddress}
            placeholder="Enter complete billing address"
            rows={3}
            disabled={actualLoading}
          />

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={actualLoading}
              className="w-full sm:w-32 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actualLoading}
              className="w-full sm:w-40 px-6 py-3 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {actualLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};