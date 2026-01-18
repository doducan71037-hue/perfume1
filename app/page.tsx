import Link from "next/link";
import { ScentButton } from "@/components/ui/scent-button";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-black">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/background.jpg')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 z-0"></div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 text-white">
          <div className="md:col-span-8 md:col-start-1 fade-in-up">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-6 text-white/80">
              Modern Olfactory Intelligence
            </h2>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tight leading-none mb-10">
              Scent <br /> Architecture
            </h1>
            <p className="text-sm md:text-base font-light tracking-wide max-w-md text-white/80 leading-relaxed mb-12">
              We decode the chemistry of your memories to architect your perfect
              fragrance profile. A data-driven approach to luxury perfumery.
            </p>
            <div className="flex gap-4">
              <Link href="/consultation">
                <ScentButton
                  size="lg"
                  className="bg-white text-black border-white hover:bg-transparent hover:text-white min-w-[180px]"
                >
                  Start Analysis
                </ScentButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100 border border-gray-100">
            {[
              {
                num: "01",
                title: "Profiling",
                desc: "Deep learning algorithms analyze your stylistic and emotional inputs.",
              },
              {
                num: "02",
                title: "Composition",
                desc: "Mapping accords to chemical preferences and molecular volatility.",
              },
              {
                num: "03",
                title: "Selection",
                desc: "Curating from a database of contemporary and heritage masterpieces.",
              },
            ].map((item) => (
              <div
                key={item.num}
                className="bg-white p-12 md:p-16 flex flex-col h-full hover:bg-gray-50 transition-colors duration-500"
              >
                <span className="text-xs font-bold text-gray-300 mb-12">
                  {item.num}
                </span>
                <h3 className="text-2xl font-medium mb-6 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-black text-white border-t border-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-2xl md:text-4xl font-light leading-tight mb-10">
            &quot;Scent is the most intense form of memory.&quot;
          </p>
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            Jean-Paul Guerlain
          </p>
        </div>
      </section>
    </div>
  );
}
