import React, { useState } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';
import { Vendor } from '../../types/vendor';

interface VendorSelectorProps {
  vendors: Vendor[];
  selectedVendor?: Vendor;
  onVendorSelect: (vendor: Vendor | null) => void;
  className?: string;
}

export const VendorSelector: React.FC<VendorSelectorProps> = ({
  vendors,
  selectedVendor,
  onVendorSelect,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVendorSelect = (vendor: Vendor) => {
    onVendorSelect(vendor);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = () => {
    onVendorSelect(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select from saved vendors
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <span className="flex items-center">
            <User className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
            <span className="block truncate">
              {selectedVendor ? selectedVendor.name : 'Choose a vendor...'}
            </span>
          </span>
          <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {selectedVendor && (
              <button
                onClick={clearSelection}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
              >
                Clear selection
              </button>
            )}

            {filteredVendors.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchTerm ? 'No vendors found' : 'No vendors available'}
              </div>
            ) : (
              filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleVendorSelect(vendor)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    selectedVendor?.id === vendor.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{vendor.name}</span>
                    <span className="text-sm text-gray-500">{vendor.businessName}</span>
                    <span className="text-xs text-gray-400">{vendor.email}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};