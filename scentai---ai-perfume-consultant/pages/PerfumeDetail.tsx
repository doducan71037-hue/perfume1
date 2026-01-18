import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_PERFUMES } from '../services/mockData';
import { Perfume } from '../types';
import { Button } from '../components/ui/Button';

export const PerfumeDetail: React.FC = () => {
  const { id } = useParams();
  const [perfume, setPerfume] = useState<Perfume | null>(null);

  useEffect(() => {
    // Mock fetch
    const found = MOCK_PERFUMES.find(p => p.id === id) || MOCK_PERFUMES[0];
    setPerfume(found);
    window.scrollTo(0, 0);
  }, [id]);

  if (!perfume) return <div className="p-32 text-center text-[10px] uppercase tracking-widest">Loading Data...</div>;

  return (
    <div className="bg-white min-h-screen pt-20">
      
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-80px)]">
          
          {/* Image Side */}
          <div className="bg-gray-50 relative lg:h-[calc(100vh-80px)] lg:sticky lg:top-20">
              <img src={perfume.imageUrl} alt={perfume.name} className="w-full h-full object-cover object-center" />
          </div>

          {/* Info Side */}
          <div className="px-6 py-20 lg:px-24 flex flex-col justify-center">
            <div className="mb-12">
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{perfume.brand}</span>
               <h1 className="text-5xl lg:text-6xl font-medium text-black mt-4 mb-8 tracking-tight">{perfume.name}</h1>
               <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-gray-500 border-t border-b border-gray-100 py-4">
                  <span>{perfume.year}</span>
                  <span>—</span>
                  <span>{perfume.concentration}</span>
                  <span>—</span>
                  <span>{perfume.gender}</span>
               </div>
            </div>

            <p className="text-lg text-gray-600 font-light leading-relaxed mb-16">
              {perfume.description}
            </p>

            <div className="grid grid-cols-2 gap-12 mb-16">
               <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">Structure</h3>
                  <ul className="space-y-2">
                    <li className="text-sm text-gray-600"><span className="text-gray-400">Top:</span> {perfume.notes.filter(n => n.position === 'top').map(n => n.name).join(', ')}</li>
                    <li className="text-sm text-gray-600"><span className="text-gray-400">Heart:</span> {perfume.notes.filter(n => n.position === 'middle').map(n => n.name).join(', ')}</li>
                    <li className="text-sm text-gray-600"><span className="text-gray-400">Base:</span> {perfume.notes.filter(n => n.position === 'base').map(n => n.name).join(', ')}</li>
                  </ul>
               </div>
               <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">Accords</h3>
                  <div className="flex flex-wrap gap-2">
                    {perfume.accords.map(accord => (
                      <span key={accord} className="text-sm text-gray-600 border border-gray-200 px-2 py-1">
                        {accord}
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            <div className="mt-auto">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-6">Marketplace</h3>
              <div className="space-y-4">
                {perfume.affiliateLinks?.map(link => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    className="flex items-center justify-between group border border-gray-200 p-4 hover:bg-black hover:text-white hover:border-black transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">{link.platform}</span>
                    <span className="text-sm">${link.price}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};