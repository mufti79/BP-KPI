import React, { useRef, useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { getLogo, saveLogo } from '../services/storageService';

const LogoUploader: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const saved = await getLogo();
      if (saved) setLogoUrl(saved);
    };
    fetchLogo();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setLogoUrl(result);
        await saveLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogoUrl(null);
    await saveLogo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      
      {logoUrl ? (
        <div className="relative w-40 h-20 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border border-white/20">
          <img src={logoUrl} alt="Brand Logo" className="max-w-full max-h-full object-contain" />
          <button 
            onClick={clearLogo}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="w-40 h-16 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-white hover:text-white transition-colors">
          <Upload size={20} />
          <span className="text-xs mt-1">Upload Logo</span>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;