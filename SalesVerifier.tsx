import React, { useState, useEffect } from 'react';
import { Check, X, Clock, MapPin, User, Mail, Phone, Search } from 'lucide-react';
import { SaleRecord, SaleStatus } from '../types';
import { getSales, updateSaleStatus } from '../services/storageService';

const SalesVerifier: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [filter, setFilter] = useState<SaleStatus>(SaleStatus.PENDING);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');

  useEffect(() => {
    loadSales();
    const interval = setInterval(loadSales, 5000); // Poll for new sales
    return () => clearInterval(interval);
  }, []);

  const loadSales = async () => {
    const allSales = await getSales();
    allSales.sort((a, b) => b.timestamp - a.timestamp);
    setSales(allSales);
  };

  const handleStatusChange = async (id: string, status: SaleStatus) => {
    await updateSaleStatus(id, status);
    loadSales();
    if (selectedSaleId === id) setSelectedSaleId(''); // Clear selection after action
  };

  // Logic for the verification dropdown
  const pendingSales = sales.filter(s => s.status === SaleStatus.PENDING);
  
  // Logic for the main list view
  const filteredSales = selectedSaleId 
    ? sales.filter(s => s.id === selectedSaleId) 
    : sales.filter(s => s.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Sales Verification</h2>
        <p className="text-slate-500">Verify customer entries from Brand Promoters</p>
      </div>

      {/* Primary Verification Action: Dropdown */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl mb-8 shadow-sm">
         <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-indigo-900 mb-2">
                Quick Verify (Select Customer Code)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={20} />
                <select 
                  value={selectedSaleId}
                  onChange={(e) => {
                    setSelectedSaleId(e.target.value);
                    setFilter(SaleStatus.PENDING); // Switch view to pending if selecting a pending item
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-indigo-200 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 font-medium appearance-none"
                >
                  <option value="">-- Select Customer to Verify --</option>
                  {pendingSales.length === 0 && <option disabled>No pending customers found</option>}
                  {pendingSales.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.uniqueCode || 'NO-CODE'} — {s.customer.name} ({s.customer.mobile})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 text-xs font-bold">
                  {pendingSales.length} Pending
                </div>
              </div>
            </div>
            {selectedSaleId && (
              <button 
                onClick={() => setSelectedSaleId('')}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Selection
              </button>
            )}
         </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-slate-700">
            {selectedSaleId ? 'Selected Entry Details' : `${filter} Entries`}
        </h3>
        {!selectedSaleId && (
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            {(Object.values(SaleStatus) as SaleStatus[]).map(status => (
                <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === status 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
                >
                {status}
                </button>
            ))}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredSales.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-xl border border-dashed">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sales found.</p>
          </div>
        ) : (
          filteredSales.map((sale) => (
            <div key={sale.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${selectedSaleId === sale.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'}`}>
              <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <h3 className="font-semibold text-lg text-slate-800">{sale.customer.name}</h3>
                     {sale.uniqueCode && (
                       <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono font-bold border border-slate-200">
                         {sale.uniqueCode}
                       </span>
                     )}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 space-x-3">
                     <span className="flex items-center"><User size={12} className="mr-1"/> Age: {sale.customer.age}</span>
                     <span className="flex items-center"><MapPin size={12} className="mr-1"/> {sale.customer.location}</span>
                  </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Promoter</span>
                    <p className="text-sm font-medium text-indigo-600">{sale.promoterName}</p>
                </div>
              </div>
              
              <div className="p-5 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center text-slate-600">
                    <Phone size={14} className="mr-2 text-slate-400" /> {sale.customer.mobile}
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Mail size={14} className="mr-2 text-slate-400" /> {sale.customer.email}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Tickets</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(sale.items).map(([type, count]) => (
                      typeof count === 'number' && count > 0 ? (
                        <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {type}: {count}
                        </span>
                      ) : null
                    ))}
                  </div>
                </div>

                {sale.status === SaleStatus.PENDING && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleStatusChange(sale.id, SaleStatus.VERIFIED)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors"
                    >
                      <Check size={18} className="mr-2" /> Verify
                    </button>
                    <button
                      onClick={() => handleStatusChange(sale.id, SaleStatus.REJECTED)}
                      className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors"
                    >
                      <X size={18} className="mr-2" /> Reject
                    </button>
                  </div>
                )}
                
                {sale.status !== SaleStatus.PENDING && (
                    <div className={`mt-4 text-center py-2 rounded-lg font-medium text-sm ${
                        sale.status === SaleStatus.VERIFIED ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                        {sale.status === SaleStatus.VERIFIED ? 'Verified Entry' : 'Entry Rejected'}
                    </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SalesVerifier;