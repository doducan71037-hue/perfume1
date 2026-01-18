import React from 'react';
import { MOCK_GLOSSARY } from '../services/mockData';

export const Glossary: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-32 min-h-screen">
        <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Lexicon</h1>
            <p className="text-gray-400 text-xl font-light mb-24">Technical terminology of the olfactory arts.</p>
        </div>

        <div className="border-t border-black">
            {MOCK_GLOSSARY.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12 border-b border-gray-100 hover:bg-gray-50 transition-colors px-4 -mx-4">
                    <div className="md:col-span-3">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">{item.category}</span>
                        <h3 className="text-xl font-medium">{item.term}</h3>
                    </div>
                    <div className="md:col-span-9">
                        <p className="text-gray-600 font-light leading-relaxed max-w-2xl">
                            {item.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};