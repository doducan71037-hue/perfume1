import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_PERFUMES } from '../services/mockData';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(MOCK_PERFUMES);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (!val) {
        setResults(MOCK_PERFUMES);
        return;
    }
    const filtered = MOCK_PERFUMES.filter(p => 
        p.name.toLowerCase().includes(val.toLowerCase()) || 
        p.brand.toLowerCase().includes(val.toLowerCase()) ||
        p.notes.some(n => n.nameCn.toLowerCase().includes(val.toLowerCase()))
    );
    setResults(filtered);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-32 min-h-screen">
        <div className="border-b border-black mb-16 pb-4">
            <input 
                type="text" 
                value={query}
                onChange={handleSearch}
                placeholder="Search collection..."
                className="w-full text-4xl md:text-6xl font-light bg-transparent focus:outline-none placeholder:text-gray-200"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {results.map(perfume => (
                <Link to={`/perfume/${perfume.id}`} key={perfume.id} className="group block cursor-pointer">
                    <div className="aspect-[3/4] bg-gray-50 mb-6 overflow-hidden relative">
                         <img 
                            src={perfume.imageUrl} 
                            alt={perfume.name} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                         />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">{perfume.brand}</span>
                        <h3 className="text-lg font-medium text-black">{perfume.name}</h3>
                    </div>
                </Link>
            ))}
            {results.length === 0 && (
                <div className="col-span-full py-20 text-gray-300 text-xl font-light">
                    No matching profiles found.
                </div>
            )}
        </div>
    </div>
  );
};