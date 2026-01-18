export default function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-32 min-h-screen">
      <h1 className="text-3xl font-medium mb-16">Disclaimer</h1>
      <div className="space-y-12">
        <section>
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4">
            Perception
          </h2>
          <p className="text-gray-600 font-light leading-relaxed">
            Olfactory perception is subjective. Data-driven recommendations
            provided by ScentAI are based on chemical analysis and generalized
            user consensus. Individual experiences may vary.
          </p>
        </section>
        <section>
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4">
            Variables
          </h2>
          <p className="text-gray-600 font-light leading-relaxed">
            Skin chemistry, temperature, and environmental humidity
            significantly alter fragrance performance.
          </p>
        </section>
        <section>
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4">
            Advisory
          </h2>
          <p className="text-gray-600 font-light leading-relaxed">
            We recommend sampling via decants prior to full acquisition.
          </p>
        </section>
      </div>
    </div>
  );
}
