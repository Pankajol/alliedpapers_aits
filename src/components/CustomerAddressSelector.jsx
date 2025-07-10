import React, { useState, useEffect } from 'react';

const CustomerAddressSelector = ({ 
  customer, 
  selectedBillingAddress, 
  selectedShippingAddress,
  onBillingAddressSelect,
  onShippingAddressSelect 
}) => {
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [showBillingDropdown, setShowBillingDropdown] = useState(false);
  const [showShippingDropdown, setShowShippingDropdown] = useState(false);

  useEffect(() => {
    if (customer && customer._id) {
      fetchCustomerAddresses(customer._id);
    } else {
      // Clear addresses if no customer is selected
      setBillingAddresses([]);
      setShippingAddresses([]);
    }
  }, [customer]);

  const fetchCustomerAddresses = async (customerId) => {
    try {
      console.log('Fetching addresses for customer:', customerId);
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const customerData = await response.json();
        console.log('Customer data received:', {
          billingAddresses: customerData.billingAddresses?.length || 0,
          shippingAddresses: customerData.shippingAddresses?.length || 0
        });
        
        setBillingAddresses(customerData.billingAddresses || []);
        setShippingAddresses(customerData.shippingAddresses || []);
        
        // Auto-select first address if available and no address is currently selected
        if (customerData.billingAddresses && customerData.billingAddresses.length > 0 && !selectedBillingAddress) {
          console.log('Auto-selecting first billing address');
          onBillingAddressSelect(customerData.billingAddresses[0]);
        }
        if (customerData.shippingAddresses && customerData.shippingAddresses.length > 0 && !selectedShippingAddress) {
          console.log('Auto-selecting first shipping address');
          onShippingAddressSelect(customerData.shippingAddresses[0]);
        }
      } else {
        console.error('Failed to fetch customer data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching customer addresses:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const parts = [
      address.address1,
      address.address2,
      address.city,
      address.state,
      address.zip,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleBillingSelect = (address) => {
    onBillingAddressSelect(address);
    setShowBillingDropdown(false);
  };

  const handleShippingSelect = (address) => {
    onShippingAddressSelect(address);
    setShowShippingDropdown(false);
  };

  if (!customer || !customer._id) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Billing Address Selection */}
      <div>
        <label className="block mb-2 font-medium">Billing Address</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBillingDropdown(!showBillingDropdown)}
            className="w-full p-2 border rounded bg-white text-left flex justify-between items-center"
          >
            <span className="truncate">
              {selectedBillingAddress 
                ? formatAddress(selectedBillingAddress)
                : 'Select billing address'
              }
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showBillingDropdown && billingAddresses.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {billingAddresses.map((address, index) => (
                <div
                  key={index}
                  onClick={() => handleBillingSelect(address)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="text-sm">{formatAddress(address)}</div>
                </div>
              ))}
            </div>
          )}
          
          {billingAddresses.length === 0 && (
            <div className="text-sm text-gray-500 mt-1">No billing addresses found</div>
          )}
        </div>
      </div>

      {/* Shipping Address Selection */}
      <div>
        <label className="block mb-2 font-medium">Shipping Address</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowShippingDropdown(!showShippingDropdown)}
            className="w-full p-2 border rounded bg-white text-left flex justify-between items-center"
          >
            <span className="truncate">
              {selectedShippingAddress 
                ? formatAddress(selectedShippingAddress)
                : 'Select shipping address'
              }
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showShippingDropdown && shippingAddresses.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {shippingAddresses.map((address, index) => (
                <div
                  key={index}
                  onClick={() => handleShippingSelect(address)}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="text-sm">{formatAddress(address)}</div>
                </div>
              ))}
            </div>
          )}
          
          {shippingAddresses.length === 0 && (
            <div className="text-sm text-gray-500 mt-1">No shipping addresses found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerAddressSelector;
