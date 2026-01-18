import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MOCK_REPORT } from '../services/mockData';
import { Report as ReportType } from '../types';

export const Report: React.FC = () => {
  const { conversationId } = useParams();
  const [report, setReport] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setReport(MOCK_REPORT);
      setLoading(false);
    }, 800);
  }, [conversationId]);

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <span className="text-[10px] uppercase tracking-widest animate-pulse">Generating Report</span>
      </div>
    );
  }

  return (
    <div className="bg-white pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Header */}
        <div className="mb-32 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">Olfactory Profile</h1>
          <p className="text-xl md:text-2xl text-gray-500 font-light leading-relaxed">
            {report.summary}
          </p>
        </div>

        {/* Primary Recommendations */}
        <div className="mb-32">
          <div className="border-t border-black mb-12 pt-4 flex justify-between items-start">
             <h2 className="text-[10px] uppercase tracking-widest font-bold">Primary Selection</h2>
             <span className="text-[10px] uppercase tracking-widest text-gray-400">01 — 0{report.topRecommendations.length}</span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-24">
            {report.topRecommendations.map((perfume) => (
              <div key={perfume.id} className="group">
                <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-8">
                  <img 
                    src={perfume.imageUrl} 
                    alt={perfume.name} 
                    className="w-full h-full object-cover grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
                  />
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                    {perfume.matchScore}% Match
                  </div>
                </div>
                
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{perfume.brand}</span>
                  <h3 className="text-3xl font-medium mb-6">{perfume.name}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-md">{perfume.whatItSmellsLike}</p>
                  
                  <div className="flex gap-4">
                    <Link to={`/perfume/${perfume.id}`}>
                      <Button variant="outline" size="sm">Explore</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary */}
        <div className="border-t border-gray-200 pt-20">
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-12">Alternatives</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {report.alternatives.map((perfume) => (
              <Link to={`/perfume/${perfume.id}`} key={perfume.id} className="group block bg-gray-50 p-8 hover:bg-black hover:text-white transition-colors duration-300">
                 <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-2">{perfume.brand}</div>
                 <div className="text-xl font-medium mb-4">{perfume.name}</div>
                 <p className="text-xs opacity-70 leading-relaxed line-clamp-2">{perfume.whatItSmellsLike}</p>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="mt-32 flex justify-center">
          <Button variant="ghost" onClick={() => window.location.href='/consultation'}>
              Reset Analysis
          </Button>
        </div>
      </div>
    </div>
  );
};