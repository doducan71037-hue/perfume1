import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Clean, abstract, high-end water/glass texture */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=2574&auto=format&fit=crop')` 
          }}
        ></div>
        <div className="absolute inset-0 bg-black/20 z-0"></div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 text-white">
          <div className="md:col-span-8 md:col-start-1 fade-in-up">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-6 text-white/80">
              Modern Olfactory Intelligence
            </h2>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tight leading-none mb-10">
              Scent <br/> Architecture
            </h1>
            <p className="text-sm md:text-base font-light tracking-wide max-w-md text-white/80 leading-relaxed mb-12">
              We decode the chemistry of your memories to architect your perfect fragrance profile. A data-driven approach to luxury perfumery.
            </p>
            <div className="flex gap-4">
              <Link to="/consultation">
                <Button size="lg" className="bg-white text-black border-white hover:bg-transparent hover:text-white min-w-[180px]">
                  Start Analysis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
            {[
              {
                num: '01',
                title: 'Profiling',
                desc: 'Deep learning algorithms analyze your stylistic and emotional inputs.'
              },
              {
                num: '02',
                title: 'Composition',
                desc: 'Mapping accords to chemical preferences and molecular volatility.'
              },
              {
                num: '03',
                title: 'Selection',
                desc: 'Curating from a database of contemporary and heritage masterpieces.'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-12 md:p-16 flex flex-col h-full hover:bg-gray-50 transition-colors duration-500">
                <span className="text-xs font-bold text-gray-300 mb-12">{item.num}</span>
                <h3 className="text-2xl font-medium mb-6 tracking-tight">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-32 bg-black text-white border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-2xl md:text-4xl font-light leading-tight mb-10">
            "Scent is the most intense form of memory."
          </p>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">Jean-Paul Guerlain</p>
        </div>
      </section>
    </div>
  );
};