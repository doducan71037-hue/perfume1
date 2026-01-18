import React from 'react';
import { Button } from '../components/ui/Button';

export const Subscribe: React.FC = () => {
  const tiers = [
    {
      name: 'Visitor',
      price: 'Complimentary',
      features: ['Basic Consultation', 'Standard Report', 'Public Library Access'],
      cta: 'Current Plan',
      variant: 'ghost' as const
    },
    {
      name: 'Connoisseur',
      price: '$29 / month',
      features: ['Deep Analysis', 'Unlimited Reports', 'History Tracking', 'New Release Alerts'],
      cta: 'Subscribe',
      variant: 'primary' as const
    },
    {
      name: 'Bespoke',
      price: '$99 / month',
      features: ['Personal Human Curator', 'Sample Kit Delivery (Quarterly)', 'Priority Access', 'Concierge Ordering'],
      cta: 'Inquire',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="max-w-2xl mb-24">
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Membership</h1>
          <p className="text-xl text-gray-500 font-light">
            Elevate your olfactory journey with our curated tiers of service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-black">
          {tiers.map((tier, idx) => (
            <div 
              key={idx} 
              className={`p-8 md:p-12 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col h-full hover:bg-gray-50 transition-colors duration-500 ${idx === 2 ? 'md:border-r-0' : ''}`}
            >
              <div className="mb-12">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">{tier.name}</h3>
                <div className="text-3xl font-light">{tier.price}</div>
              </div>

              <ul className="space-y-6 mb-12 flex-grow">
                {tier.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start text-sm text-gray-600 font-light">
                    <span className="mr-3 text-xs">•</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant={tier.variant} className="w-full">
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-24 text-center">
             <p className="text-[10px] uppercase tracking-widest text-gray-400">
                Cancel anytime. secure payment processing.
             </p>
        </div>
      </div>
    </div>
  );
};