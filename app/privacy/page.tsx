export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-32 min-h-screen">
      <h1 className="text-3xl font-medium mb-16">Data Privacy</h1>
      <div className="space-y-12">
        <section>
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4">
            Collection
          </h2>
          <p className="text-gray-600 font-light leading-relaxed">
            Preference data is processed ephemerally to generate recommendation
            vectors. No personally identifiable information is stored
            post-session.
          </p>
        </section>
        <section>
          <h2 className="text-[10px] uppercase tracking-widest font-bold mb-4">
            Third Parties
          </h2>
          <p className="text-gray-600 font-light leading-relaxed">
            Outgoing links to retailers are independent. We do not track
            conversion data on external domains.
          </p>
        </section>
      </div>
    </div>
  );
}
