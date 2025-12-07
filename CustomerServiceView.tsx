import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Clock, CheckCircle, MessageSquare, Paperclip, X, FileText } from 'lucide-react';
import { ComplaintRecord, ComplaintPriority, ComplaintStatus } from '../types';
import { addComplaint, getComplaints, generateId } from '../services/storageService';

const CustomerServiceView: React.FC = () => {
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.MEDIUM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [myComplaints, setMyComplaints] = useState<ComplaintRecord[]>([]);

  useEffect(() => {
    loadComplaints();
    const interval = setInterval(loadComplaints, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadComplaints = async () => {
    const all = await getComplaints();
    all.sort((a, b) => b.timestamp - a.timestamp);
    setMyComplaints(all);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit for local storage
            alert("File too large. Please select a file under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachment(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => {
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !customerName.trim()) return;

    setIsSubmitting(true);

    const newComplaint: ComplaintRecord = {
      id: generateId(),
      timestamp: Date.now(),
      customerName,
      customerMobile,
      description,
      priority,
      status: ComplaintStatus.OPEN,
      submittedBy: 'Customer Service',
      attachmentUrl: attachment || undefined
    };

    await addComplaint(newComplaint);
    
    setTimeout(() => {
      setSuccessMsg('Complaint forwarded to Team Lead successfully.');
      setDescription('');
      setCustomerName('');
      setCustomerMobile('');
      setPriority(ComplaintPriority.MEDIUM);
      clearAttachment();
      setIsSubmitting(false);
      loadComplaints();
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 500);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
          <MessageSquare className="mr-3 text-indigo-600" /> Customer Service Portal
        </h2>
        <p className="text-slate-500">Log customer issues and forward them to the Team Lead.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Complaint Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <AlertCircle size={20} className="mr-2 text-rose-500" /> Log New Complaint
            </h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center animate-fade-in">
                <CheckCircle size={16} className="mr-2" /> {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Customer Name</label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Mufti Mahmud"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Mobile (Optional)</label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="+88"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Priority</label>
                <div className="flex gap-2">
                  {Object.values(ComplaintPriority).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 text-sm rounded-md border transition-colors ${
                        priority === p 
                          ? p === ComplaintPriority.HIGH ? 'bg-red-100 border-red-300 text-red-700' 
                          : p === ComplaintPriority.MEDIUM ? 'bg-amber-100 border-amber-300 text-amber-700' 
                          : 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Issue Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  placeholder="Describe the issue..."
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Attachment (Proof/Image)</label>
                <div className="flex items-center gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors w-full justify-center"
                    >
                        <Paperclip size={16} /> {attachment ? 'Change File' : 'Upload File'}
                    </button>
                </div>
                {attachment && (
                    <div className="mt-2 flex items-center justify-between p-2 bg-indigo-50 rounded border border-indigo-100 text-sm">
                        <span className="text-indigo-700 flex items-center truncate max-w-[200px]">
                            <FileText size={14} className="mr-2" /> File Attached
                        </span>
                        <button type="button" onClick={clearAttachment} className="text-slate-400 hover:text-red-500">
                            <X size={16} />
                        </button>
                    </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isSubmitting ? 'Sending...' : <><Send size={16} className="mr-2" /> Send to Lead</>}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Complaints List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Clock size={20} className="mr-2 text-slate-500" /> Recent Activity
            </h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[500px]">
              {myComplaints.length === 0 ? (
                <div className="text-center py-10 text-slate-400">No complaints logged yet.</div>
              ) : (
                myComplaints.map(complaint => (
                  <div key={complaint.id} className="p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          complaint.priority === ComplaintPriority.HIGH ? 'bg-red-500' : 
                          complaint.priority === ComplaintPriority.MEDIUM ? 'bg-amber-500' : 'bg-green-500'
                        }`}></span>
                        <h4 className="font-semibold text-slate-800">{complaint.customerName}</h4>
                        <span className="text-xs text-slate-500">({new Date(complaint.timestamp).toLocaleString()})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        complaint.status === ComplaintStatus.RESOLVED ? 'bg-green-100 text-green-700' :
                        complaint.status === ComplaintStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{complaint.description}</p>
                    
                    {complaint.attachmentUrl && (
                        <div className="mb-3">
                             <a 
                                href={complaint.attachmentUrl} 
                                download={`complaint_evidence_${complaint.id}`}
                                className="inline-flex items-center text-xs text-indigo-600 hover:underline bg-indigo-50 px-2 py-1 rounded"
                             >
                                 <Paperclip size={12} className="mr-1" /> View/Download Attachment
                             </a>
                        </div>
                    )}

                    {complaint.resolutionNotes && (
                       <div className="text-xs bg-green-50 border border-green-100 p-2 rounded text-green-800">
                         <strong>Resolution:</strong> {complaint.resolutionNotes}
                       </div>
                    )}
                    
                    <div className="mt-2 text-xs text-slate-400 flex justify-end">
                      Submitted by: {complaint.submittedBy}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerServiceView;