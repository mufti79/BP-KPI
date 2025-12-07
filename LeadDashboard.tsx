
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Map, CheckCircle, Plus, Trash2, Settings, Check, Layout, MessageSquare, Download, FileText, AlertTriangle, X, Paperclip, Archive, Calendar, Star, Loader2, Database, Upload } from 'lucide-react';
import { Promoter, SaleRecord, SaleStatus, TicketType, KPIStats, Floor, ComplaintRecord, ComplaintStatus, ComplaintPriority, FeedbackRecord } from '../types';
import { 
  getPromoters, getSales, getFloors, getComplaints, getFeedbacks,
  addPromoter, deletePromoter, updatePromoter,
  addFloor, deleteFloor,
  addComplaint, updateComplaint,
  generateId,
  getAllData, restoreData
} from '../services/storageService';

const LeadDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'KPI' | 'COMPLAINTS'>('KPI');
  const [isLoading, setIsLoading] = useState(true);
  
  // KPI Data
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [stats, setStats] = useState<KPIStats[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);

  // Complaint Data
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [complaintResolveId, setComplaintResolveId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  
  // Internal Complaint Form
  const [showInternalForm, setShowInternalForm] = useState(false);
  const [internalDesc, setInternalDesc] = useState('');
  const [internalPriority, setInternalPriority] = useState<ComplaintPriority>(ComplaintPriority.MEDIUM);

  // Management State
  const [newPromoterName, setNewPromoterName] = useState('');
  const [newFloorName, setNewFloorName] = useState('');

  // Complaint Export Filter State
  const [exportStart, setExportStart] = useState(new Date().toISOString().split('T')[0]);
  const [exportEnd, setExportEnd] = useState(new Date().toISOString().split('T')[0]);

  // Sales Export Filter State
  const [salesExportStart, setSalesExportStart] = useState(new Date().toISOString().split('T')[0]);
  const [salesExportEnd, setSalesExportEnd] = useState(new Date().toISOString().split('T')[0]);

  // Feedback Export Filter State
  const [feedbackExportStart, setFeedbackExportStart] = useState(new Date().toISOString().split('T')[0]);
  const [feedbackExportEnd, setFeedbackExportEnd] = useState(new Date().toISOString().split('T')[0]);

  const calculateStats = useCallback((currentPromoters: Promoter[], currentSales: SaleRecord[]) => {
    const verifiedSales = currentSales.filter(s => s.status === SaleStatus.VERIFIED);
    const newStats: KPIStats[] = currentPromoters.map(p => {
      const pSales = verifiedSales.filter(s => s.promoterId === p.id);
      return {
        promoterId: p.id,
        totalKiddo: pSales.reduce((sum, s) => sum + (s.items[TicketType.KIDDO] || 0), 0),
        totalExtreme: pSales.reduce((sum, s) => sum + (s.items[TicketType.EXTREME] || 0), 0),
        totalIndividual: pSales.reduce((sum, s) => sum + (s.items[TicketType.INDIVIDUAL] || 0), 0),
        totalEntry: pSales.reduce((sum, s) => sum + (s.items[TicketType.ENTRY_ONLY] || 0), 0),
        totalSalesLeads: pSales.length,
        totalMailCollect: pSales.filter(s => s.customer.email && s.customer.email.length > 3).length,
        revenue: 0 
      };
    });
    setStats(newStats);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [loadedPromoters, loadedSales, loadedFloors, loadedComplaints, loadedFeedbacks] = await Promise.all([
        getPromoters(),
        getSales(),
        getFloors(),
        getComplaints(),
        getFeedbacks()
      ]);
      
      setPromoters(loadedPromoters);
      setSales(loadedSales);
      setFloors(loadedFloors);
      setComplaints(loadedComplaints.sort((a, b) => b.timestamp - a.timestamp));
      setFeedbacks(loadedFeedbacks);
      
      calculateStats(loadedPromoters, loadedSales);
    } catch (error) {
      console.error("Error loading dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live refresh
    return () => clearInterval(interval);
  }, [loadData]);

  // --- Complaint Management ---

  const handleResolveComplaint = async (id: string) => {
    const complaint = complaints.find(c => c.id === id);
    if (complaint && resolutionNote.trim()) {
      const updated: ComplaintRecord = {
        ...complaint,
        status: ComplaintStatus.RESOLVED,
        resolutionNotes: resolutionNote,
        resolvedAt: Date.now()
      };
      await updateComplaint(updated);
      setComplaintResolveId(null);
      setResolutionNote('');
      loadData();
    }
  };

  const handleClearResolved = async () => {
      if(!confirm("Clear all resolved complaints from this view? \n\nThey will be hidden from this list but will still appear in the downloaded CSV export.")) return;

      const promises = complaints
        .filter(c => c.status === ComplaintStatus.RESOLVED && !c.isArchived)
        .map(c => updateComplaint({ ...c, isArchived: true }));
      
      await Promise.all(promises);
      loadData();
  };

  const handleInternalComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalDesc.trim()) return;
    
    const newComplaint: ComplaintRecord = {
        id: generateId(),
        timestamp: Date.now(),
        customerName: 'Internal / Team Lead',
        customerMobile: 'N/A',
        description: internalDesc,
        priority: internalPriority,
        status: ComplaintStatus.OPEN,
        submittedBy: 'Team Lead'
    };
    
    await addComplaint(newComplaint);
    setInternalDesc('');
    setShowInternalForm(false);
    loadData();
  };

  // --- Export / Import Handlers ---

  const handleBackupDatabase = () => {
    const data = getAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promoter_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if(!confirm("⚠️ WARNING: This will OVERWRITE all current data with the backup file.\n\nAre you sure you want to proceed?")) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        restoreData(json);
        alert("Database restored successfully! The page will now reload.");
        window.location.reload();
      } catch (err) {
        alert("Failed to parse backup file. Please ensure it is a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadComplaints = () => {
    const start = new Date(exportStart).setHours(0, 0, 0, 0);
    const end = new Date(exportEnd).setHours(23, 59, 59, 999);
    
    const dataToExport = complaints.filter(c => c.timestamp >= start && c.timestamp <= end);
    
    if (dataToExport.length === 0) {
      alert("No complaints found for the selected date range.");
      return;
    }

    const headers = ['Date', 'Submitted By', 'Priority', 'Customer', 'Mobile', 'Issue', 'Status', 'Resolution Notes', 'Archived'];
    const rows = dataToExport.map(c => [
      new Date(c.timestamp).toLocaleString(),
      c.submittedBy,
      c.priority,
      `"${c.customerName}"`,
      c.customerMobile,
      `"${c.description.replace(/"/g, '""')}"`,
      c.status,
      `"${(c.resolutionNotes || '').replace(/"/g, '""')}"`,
      c.isArchived ? 'Yes' : 'No'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `complaints_log_${exportStart}_to_${exportEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSales = () => {
    const start = new Date(salesExportStart).setHours(0, 0, 0, 0);
    const end = new Date(salesExportEnd).setHours(23, 59, 59, 999);
    const dataToExport = sales.filter(s => s.timestamp >= start && s.timestamp <= end);

    if (dataToExport.length === 0) {
         alert("No sales found for the selected date range.");
         return;
    }

    const headers = ['Date', 'Unique Code', 'Promoter', 'Sales Floor', 'Customer', 'Mobile', 'Email', 'Customer Origin', 'Age', 'Kiddo', 'Extreme', 'Individual', 'Entry Only', 'Status'];
    const rows = dataToExport.map(s => [
        new Date(s.timestamp).toLocaleDateString() + ' ' + new Date(s.timestamp).toLocaleTimeString(),
        `"${s.uniqueCode || '-'}"`,
        `"${s.promoterName}"`,
        `"${s.saleLocation || 'General'}"`,
        `"${s.customer.name}"`,
        s.customer.mobile,
        s.customer.email,
        `"${s.customer.location}"`,
        s.customer.age,
        s.items[TicketType.KIDDO] || 0,
        s.items[TicketType.EXTREME] || 0,
        s.items[TicketType.INDIVIDUAL] || 0,
        s.items[TicketType.ENTRY_ONLY] || 0,
        s.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${salesExportStart}_to_${salesExportEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFeedback = () => {
    const start = new Date(feedbackExportStart).setHours(0, 0, 0, 0);
    const end = new Date(feedbackExportEnd).setHours(23, 59, 59, 999);
    const dataToExport = feedbacks.filter(f => f.timestamp >= start && f.timestamp <= end);

    if (dataToExport.length === 0) {
         alert("No feedback found for the selected date range.");
         return;
    }

    const headers = ['Date', 'Promoter', 'Customer', 'Age', 'Mobile', 'Email', 'Rating (1-5)', 'Comment'];
    const rows = dataToExport.map(f => [
        new Date(f.timestamp).toLocaleDateString() + ' ' + new Date(f.timestamp).toLocaleTimeString(),
        `"${f.promoterName}"`,
        `"${f.customer.name}"`,
        f.customer.age,
        f.customer.mobile,
        f.customer.email,
        f.rating,
        `"${(f.comment || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customer_feedback_${feedbackExportStart}_to_${feedbackExportEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFloorAssign = async (promoterId: string, floorName: string) => {
    // Optimistic Update
    const promoter = promoters.find(p => p.id === promoterId);
    if (!promoter) return;

    const currentFloors = promoter.assignedFloors || [];
    const exists = currentFloors.includes(floorName);
    const newFloors = exists ? currentFloors.filter(f => f !== floorName) : [...currentFloors, floorName];
    
    // Update local state immediately for responsiveness
    setPromoters(prev => prev.map(p => p.id === promoterId ? { ...p, assignedFloors: newFloors } : p));

    // Persist to DB
    await updatePromoter({ ...promoter, assignedFloors: newFloors });
    
    // Reload to ensure sync
    loadData();
  };

  const handleAddPromoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoterName.trim()) return;
    const newPromoter: Promoter = { id: generateId(), name: newPromoterName, assignedFloors: [] };
    
    await addPromoter(newPromoter);
    setNewPromoterName('');
    loadData();
  };

  const handleDeletePromoter = async (id: string) => {
    if (confirm('Remove this promoter?')) {
      await deletePromoter(id);
      loadData();
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;
    const newFloor: Floor = { id: generateId(), name: newFloorName };
    await addFloor(newFloor);
    setNewFloorName('');
    loadData();
  };

  const handleDeleteFloor = async (id: string) => {
    if (confirm('Remove this floor?')) {
      await deleteFloor(id);
      loadData();
    }
  };

  const chartData = stats.map(s => ({
    name: promoters.find(p => p.id === s.promoterId)?.name.split(' ')[0] || 'Unknown',
    Kiddo: s.totalKiddo,
    Extreme: s.totalExtreme,
    Mails: s.totalMailCollect,
  }));

  const visibleComplaints = complaints.filter(c => !c.isArchived);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Tabs */}
      <div className="flex space-x-4 mb-4 border-b border-slate-200 pb-1">
         <button 
           onClick={() => setActiveTab('KPI')}
           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center ${
             activeTab === 'KPI' 
             ? 'bg-white border border-b-0 border-slate-200 text-indigo-600' 
             : 'text-slate-500 hover:text-slate-700 bg-transparent'
           }`}
         >
            <Layout size={16} className="mr-2" /> BP Dashboard
         </button>
         <button 
           onClick={() => setActiveTab('COMPLAINTS')}
           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center ${
             activeTab === 'COMPLAINTS' 
             ? 'bg-white border border-b-0 border-slate-200 text-rose-600' 
             : 'text-slate-500 hover:text-slate-700 bg-transparent'
           }`}
         >
            <MessageSquare size={16} className="mr-2" /> Complaints & Issues
            {visibleComplaints.filter(c => c.status === ComplaintStatus.OPEN).length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {visibleComplaints.filter(c => c.status === ComplaintStatus.OPEN).length}
                </span>
            )}
         </button>
      </div>

      {activeTab === 'KPI' ? (
        <div className="space-y-8 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-slate-500">Total Ticket Entries</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                        {stats.reduce((acc, curr) => acc + curr.totalEntry + curr.totalExtreme + curr.totalKiddo + curr.totalIndividual, 0)}
                    </h3>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Users size={20} /></div>
                </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-slate-500">Emails Collected</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                        {stats.reduce((acc, curr) => acc + curr.totalMailCollect, 0)}
                    </h3>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><Users size={20} /></div>
                </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-slate-500">Verified Sales</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                        {stats.reduce((acc, curr) => acc + curr.totalSalesLeads, 0)}
                    </h3>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600"><CheckCircle size={20} /></div>
                </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* KPI Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Real-time KPI Overview</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend iconType="circle" />
                        <Bar dataKey="Kiddo" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Extreme" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Mails" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {/* Floor Assignment */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <Map size={18} className="mr-2 text-slate-500" /> Floor Assignments
                </h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {promoters.map(promoter => (
                    <div key={promoter.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-slate-900">{promoter.name}</div>
                        <div className="text-xs text-slate-400">{promoter.assignedFloors?.length || 0} assigned</div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                        {floors.map(f => {
                            const isAssigned = (promoter.assignedFloors || []).includes(f.name);
                            return (
                            <button
                                key={f.id}
                                onClick={() => toggleFloorAssign(promoter.id, f.name)}
                                className={`text-xs px-2 py-1 rounded-md border transition-all duration-200 flex items-center ${
                                isAssigned 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                }`}
                            >
                                {isAssigned && <Check size={10} className="mr-1" />}
                                {f.name}
                            </button>
                            )
                        })}
                        </div>
                    </div>
                    ))}
                    {promoters.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No promoters active.</p>}
                </div>
                </div>
            </div>

            {/* Data Exports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Sales Export Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex items-center mb-4">
                        <Download className="text-emerald-600 mr-2" />
                        <h3 className="text-lg font-bold text-slate-800">Export BP Sales Data Report</h3>
                    </div>
                    <div className="mt-auto space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={salesExportStart}
                                        onChange={(e) => setSalesExportStart(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={salesExportEnd}
                                        onChange={(e) => setSalesExportEnd(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleDownloadSales}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                            <FileText className="mr-2" size={18} /> Download Sales CSV
                        </button>
                    </div>
                </div>

                {/* Feedback Export Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                    <div className="flex items-center mb-4">
                        <Star className="text-yellow-500 mr-2" />
                        <h3 className="text-lg font-bold text-slate-800">Export Customer Feedback Report</h3>
                    </div>
                    <div className="mt-auto space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={feedbackExportStart}
                                        onChange={(e) => setFeedbackExportStart(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                    <input 
                                        type="date" 
                                        value={feedbackExportEnd}
                                        onChange={(e) => setFeedbackExportEnd(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleDownloadFeedback}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                            <FileText className="mr-2" size={18} /> Download Feedback CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Management Section */}
            <div className="border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Settings className="mr-2" size={24} /> Management Console
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Promoter Management */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-semibold text-lg text-slate-700 mb-4">Manage Brand Promoters</h3>
                      <form onSubmit={handleAddPromoter} className="flex gap-2 mb-6">
                          <input 
                          type="text" 
                          value={newPromoterName}
                          onChange={(e) => setNewPromoterName(e.target.value)}
                          placeholder="New promoter name..."
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"><Plus size={18} /></button>
                      </form>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                          {promoters.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                              <span className="text-sm font-medium text-slate-700">{p.name}</span>
                              <button onClick={() => handleDeletePromoter(p.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={16} /></button>
                          </div>
                          ))}
                      </div>
                    </div>

                    {/* Floor Management */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h3 className="font-semibold text-lg text-slate-700 mb-4">Manage Floors</h3>
                      <form onSubmit={handleAddFloor} className="flex gap-2 mb-6">
                          <input 
                          type="text" 
                          value={newFloorName}
                          onChange={(e) => setNewFloorName(e.target.value)}
                          placeholder="New floor name..."
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          />
                          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"><Plus size={18} /></button>
                      </form>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                          {floors.map(f => (
                          <div key={f.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                              <span className="text-sm font-medium text-slate-700">{f.name}</span>
                              <button onClick={() => handleDeleteFloor(f.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"><Trash2 size={16} /></button>
                          </div>
                          ))}
                      </div>
                    </div>
                </div>

                {/* System Data & Backup Section */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <Database className="mr-2 text-slate-600" size={20} /> System Data & Backup
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Export Full Database</h4>
                            <p className="text-xs text-slate-500 mb-4">Download a local copy of all sales, complaints, and settings (JSON format). Keep this safe!</p>
                            <button 
                                onClick={handleBackupDatabase}
                                className="w-full flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg text-sm transition-colors"
                            >
                                <Download size={16} className="mr-2" /> Backup Database (JSON)
                            </button>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-sm text-slate-700 mb-2">Restore Database</h4>
                            <p className="text-xs text-slate-500 mb-4">Overwrite current data with a backup file. ⚠️ This cannot be undone.</p>
                            <label className="w-full flex items-center justify-center bg-white border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-500 py-2 rounded-lg text-sm transition-colors cursor-pointer">
                                <Upload size={16} className="mr-2" /> Select Backup File
                                <input type="file" onChange={handleRestoreDatabase} className="hidden" accept=".json" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      ) : (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Complaints List */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Incoming Complaints</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleClearResolved}
                                className="text-sm bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg flex items-center transition-colors"
                                title="Hide resolved complaints from this view (still available in export)"
                            >
                                <Archive size={16} className="mr-1" />
                                Clear Resolved
                            </button>
                            <button 
                              onClick={() => setShowInternalForm(!showInternalForm)}
                              className="text-sm bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg flex items-center transition-colors"
                            >
                                {showInternalForm ? <X size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
                                Log Internal Issue
                            </button>
                        </div>
                    </div>

                    {showInternalForm && (
                        <div className="mb-6 bg-rose-50 border border-rose-100 rounded-lg p-4 animate-in slide-in-from-top-2">
                             <h4 className="font-semibold text-rose-800 mb-2">New Internal Complaint</h4>
                             <form onSubmit={handleInternalComplaintSubmit} className="space-y-3">
                                 <div>
                                     <label className="block text-xs font-semibold text-rose-700 mb-1">Issue Description</label>
                                     <textarea 
                                       className="w-full border border-rose-200 rounded p-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                       rows={3}
                                       value={internalDesc}
                                       onChange={(e) => setInternalDesc(e.target.value)}
                                       placeholder="Describe the problem..."
                                     />
                                 </div>
                                 <div className="flex items-center gap-4">
                                     <div className="flex-1">
                                        <label className="block text-xs font-semibold text-rose-700 mb-1">Priority</label>
                                        <select 
                                          value={internalPriority} 
                                          onChange={(e) => setInternalPriority(e.target.value as ComplaintPriority)}
                                          className="w-full border border-rose-200 rounded p-1.5 text-sm outline-none"
                                        >
                                            <option value={ComplaintPriority.LOW}>Low</option>
                                            <option value={ComplaintPriority.MEDIUM}>Medium</option>
                                            <option value={ComplaintPriority.HIGH}>High</option>
                                        </select>
                                     </div>
                                     <button type="submit" className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-sm mt-5">Submit</button>
                                 </div>
                             </form>
                        </div>
                    )}

                    <div className="space-y-4">
                        {visibleComplaints.length === 0 ? (
                            <p className="text-center py-8 text-slate-400">No active complaints.</p>
                        ) : (
                            visibleComplaints.map(complaint => (
                                <div key={complaint.id} className={`border rounded-lg p-4 transition-all ${
                                    complaint.status === ComplaintStatus.RESOLVED 
                                    ? 'bg-slate-50 border-slate-100 opacity-75' 
                                    : 'bg-white border-rose-100 shadow-sm'
                                }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {complaint.priority === ComplaintPriority.HIGH && <AlertTriangle size={16} className="text-red-500" />}
                                            <span className="font-semibold text-slate-800">{complaint.customerName}</span>
                                            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {new Date(complaint.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                            complaint.status === ComplaintStatus.RESOLVED ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                        }`}>
                                            {complaint.status}
                                        </span>
                                    </div>
                                    
                                    <p className="text-sm text-slate-600 mb-2">
                                        <span className="font-semibold text-xs text-slate-400 uppercase mr-1">Issue:</span>
                                        {complaint.description}
                                    </p>
                                    
                                    {complaint.customerMobile && complaint.customerMobile !== 'N/A' && (
                                        <p className="text-xs text-slate-500 mb-2">Contact: {complaint.customerMobile}</p>
                                    )}

                                    {/* Attachment View for Team Lead */}
                                    {complaint.attachmentUrl && (
                                        <div className="mb-3">
                                             <a 
                                                href={complaint.attachmentUrl} 
                                                download={`complaint_evidence_${complaint.id}`}
                                                className="inline-flex items-center text-xs text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                                             >
                                                 <Paperclip size={12} className="mr-1" /> View Attached File
                                             </a>
                                        </div>
                                    )}

                                    {complaint.status === ComplaintStatus.OPEN && (
                                        <div className="mt-3 pt-3 border-t border-slate-50">
                                            {complaintResolveId === complaint.id ? (
                                                <div className="space-y-2">
                                                    <textarea 
                                                        value={resolutionNote}
                                                        onChange={(e) => setResolutionNote(e.target.value)}
                                                        placeholder="Enter resolution notes..."
                                                        className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                        rows={2}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                          onClick={() => handleResolveComplaint(complaint.id)}
                                                          className="bg-emerald-600 text-white px-3 py-1 rounded text-xs"
                                                        >
                                                            Mark Resolved
                                                        </button>
                                                        <button 
                                                          onClick={() => setComplaintResolveId(null)}
                                                          className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-xs"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                  onClick={() => setComplaintResolveId(complaint.id)}
                                                  className="text-indigo-600 text-xs font-semibold hover:underline"
                                                >
                                                    Resolve Issue
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {complaint.status === ComplaintStatus.RESOLVED && complaint.resolutionNotes && (
                                        <div className="mt-2 text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-100">
                                            <strong>Resolution:</strong> {complaint.resolutionNotes}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Export & Stats Sidebar */}
            <div className="space-y-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Download size={18} className="mr-2 text-indigo-600" /> Export Complaints
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">From</label>
                            <input 
                                type="date" 
                                value={exportStart}
                                onChange={(e) => setExportStart(e.target.value)}
                                className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">To</label>
                            <input 
                                type="date" 
                                value={exportEnd}
                                onChange={(e) => setExportEnd(e.target.value)}
                                className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleDownloadComplaints}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                        >
                            <FileText size={16} className="mr-2" /> Download Log
                        </button>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <h3 className="font-bold text-slate-800 mb-4">Quick Stats</h3>
                     <div className="space-y-3">
                         <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                             <span className="text-sm text-slate-600">Open Issues</span>
                             <span className="font-bold text-rose-600">{visibleComplaints.filter(c => c.status === ComplaintStatus.OPEN).length}</span>
                         </div>
                         <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                             <span className="text-sm text-slate-600">Resolved Today</span>
                             <span className="font-bold text-emerald-600">
                                 {visibleComplaints.filter(c => c.status === ComplaintStatus.RESOLVED && new Date(c.timestamp).toDateString() === new Date().toDateString()).length}
                             </span>
                         </div>
                         <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                             <span className="text-sm text-slate-600">High Priority</span>
                             <span className="font-bold text-slate-800">{visibleComplaints.filter(c => c.priority === ComplaintPriority.HIGH).length}</span>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeadDashboard;
