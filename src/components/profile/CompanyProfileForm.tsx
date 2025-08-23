import React, { useState, useEffect } from 'react';
import { Save, LogOut, Upload } from 'lucide-react';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { FileUpload } from '../common/FileUpload';

export const CompanyProfileForm: React.FC = () => {
  const { profile, loading, error, updateProfile, uploadFile } = useCompanyProfile();
  const { signOut } = useAuth();
  
  // CRITICAL: Always show default data, even when profile is null
  const [formData, setFormData] = useState({
    company_name: 'KiwisMedia Technologies Pvt. Ltd.',
    company_address: 'HNO 238 , Bhati Abhoynagar, Nr\nVivekananda club rd, Agartala\nWard No - 1, P.O - Ramnagar,\nAgartala, West Tripura TR\n799002 IN.',
    city: 'Agartala',
    state: 'West Tripura',
    country: 'India',
    company_logo_url: '/fueler_logo.png',
    digital_signature_url: '/signature.png.jpg',
    invoice_prefix: 'FLB',
  });
  
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Update form data when profile loads, but keep defaults if profile is empty
  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || 'KiwisMedia Technologies Pvt. Ltd.',
        company_address: profile.company_address || 'HNO 238 , Bhati Abhoynagar, Nr\nVivekananda club rd, Agartala\nWard No - 1, P.O - Ramnagar,\nAgartala, West Tripura TR\n799002 IN.',
        city: profile.city || 'Agartala',
        state: profile.state || 'West Tripura',
        country: profile.country || 'India',
        company_logo_url: profile.company_logo_url || '/fueler_logo.png',
        digital_signature_url: profile.digital_signature_url || '/signature.png.jpg',
        invoice_prefix: profile.invoice_prefix || 'FLB',
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: string) => {
    if (file.startsWith('data:')) {
      try {
        setUploadingLogo(true);
        // Convert data URL to File
        const response = await fetch(file);
        const blob = await response.blob();
        const fileObj = new File([blob], 'logo.png', { type: blob.type });
        
        const url = await uploadFile(fileObj, 'logo');
        setFormData(prev => ({ ...prev, company_logo_url: url }));
      } catch (error) {
        console.error('Error uploading logo:', error);
        alert('Failed to upload logo. Please try again.');
      } finally {
        setUploadingLogo(false);
      }
    } else {
      setFormData(prev => ({ ...prev, company_logo_url: file }));
    }
  };

  const handleSignatureUpload = async (file: string) => {
    if (file.startsWith('data:')) {
      try {
        setUploadingSignature(true);
        // Convert data URL to File
        const response = await fetch(file);
        const blob = await response.blob();
        const fileObj = new File([blob], 'signature.png', { type: blob.type });
        
        const url = await uploadFile(fileObj, 'signature');
        setFormData(prev => ({ ...prev, digital_signature_url: url }));
      } catch (error) {
        console.error('Error uploading signature:', error);
        alert('Failed to upload signature. Please try again.');
      } finally {
        setUploadingSignature(false);
      }
    } else {
      setFormData(prev => ({ ...prev, digital_signature_url: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await updateProfile(formData);
      alert('Company profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  };

  // Show form even while loading, with default data
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Company Profile</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your company information and branding</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            icon={LogOut}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto"
          >
            Logout
          </Button>
        </div>

        {error && (
          <div className="mb-4 sm:mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-600">Loading profile data...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Input
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter your company name"
              />
              
              <Textarea
                label="Company Address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Enter your company address"
                rows={3}
                className="resize-none"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
                
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
                
                <Input
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
              
              <Input
                label="Invoice Prefix"
                value={formData.invoice_prefix}
                onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                placeholder="FLB"
                helperText="This will be used as prefix for all invoice numbers (e.g., FLB-25-0001)"
              />
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="relative">
                <FileUpload
                  label="Company Logo"
                  accept="image/*"
                  onFileSelect={handleLogoUpload}
                  currentFile={formData.company_logo_url}
                  maxSize={2}
                />
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <FileUpload
                  label="Digital Signature"
                  accept="image/*"
                  onFileSelect={handleSignatureUpload}
                  currentFile={formData.digital_signature_url}
                  maxSize={1}
                />
                {uploadingSignature && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 sm:pt-8 border-t border-gray-100">
            <Button
              type="submit"
              icon={Save}
              loading={saving}
              disabled={saving || uploadingLogo || uploadingSignature}
              className="min-w-[140px] w-full sm:w-auto"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};