'use client'

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      
      {/* 1. Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#7469C4] rounded-full flex items-center justify-center text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg">WanderAI</span>
        </div>
        <Link href="/plan" className="bg-[#7469C4] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#5E54A8] transition-colors">
          Start Planning
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-20 pb-20">
        
        {/* 2. Hero Section */}
        <section className="pt-10 text-center flex flex-col items-center gap-5">
          <div className="bg-[#F2F0FD] text-[#5E54A8] text-[10px] font-bold px-3 py-1 rounded-full border border-[#C9C3F0] uppercase tracking-wider">
             ✨ Powered by Gemini AI
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Your Dream Trip, <br />
            <span className="text-[#7469C4]">Planned by AI</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base max-w-xl">
            Tell us your preferences, and our AI chatbot will craft a personalized itinerary with hotels, restaurants, activities, and transportation.
          </p>
          <div className="flex gap-4 mt-2">
            <Link href="/plan" className="bg-[#7469C4] text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[#5E54A8] transition-colors">
              Plan My Trip →
            </Link>
            <Link href="/travel" className="bg-[#ffffff] text-[#7469C4] border border-[#604cf5] font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[#e8e6fb] transition-colors">
              I am already at the destination
            </Link>
          </div>
        </section>
        {/* 3. Featured Image */}
        <section className="w-full max-w-4xl rounded-2xl overflow-hidden relative aspect-[16/8]">
          <img 
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=2000" 
            alt="Explore Paradise" 
            className="w-full h-full object-cover"
          />
          
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Featured Destination</p>
            <h2 className="text-2xl font-bold">Explore Paradise</h2>
          </div>

          
          <div className="absolute bottom-6 right-6 text-white flex items-center gap-3 bg-black/50 px-3 py-1.5 rounded-lg text-xs font-semibold">
            <span className="flex items-center gap-1 text-amber-400">⭐ 4.9 Rating</span>
            <span className="text-white/40">|</span>
            <span className="text-zinc-200">500+ Plans</span>
          </div>
        </section>

        {/* 4. Everything You Need */}
        <section className="w-full max-w-5xl text-center flex flex-col gap-10">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Everything You Need</h2>
            <p className="text-zinc-500 text-sm mt-2">Our AI considers every aspect of your trip to deliver a seamless experience</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "AI-Powered Planning", desc: "Gemini AI creates personalized itineraries tailored to your style", icon: "✨" },
              { title: "Smart Accommodation", desc: "Find the perfect stay matching your budget and preferences", icon: "🏨" },
              { title: "Curated Dining", desc: "Restaurant picks based on your dietary needs and taste", icon: "🍽️" },
              { title: "Full Transportation", desc: "Flights, trains, local transit - all planned for you", icon: "✈️" }
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 text-left flex flex-col gap-2">
                <div className="w-8 h-8 bg-[#EAE8F8] rounded-lg flex items-center justify-center text-[#7469C4] mb-2">{item.icon}</div>
                <h3 className="font-bold text-zinc-900 text-sm">{item.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Popular Destinations */}
        <section className="w-full max-w-5xl text-center flex flex-col gap-10">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Popular Destinations</h2>
            <p className="text-zinc-500 text-sm mt-2">Trending places our travelers love</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { city: "Paris", country: "France", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800" },
              { city: "Barcelona", country: "Spain", img: "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800" }, 
              { city: "Tokyo", country: "Japan", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800" }
            ].map((dest, idx) => (
              <Link key={idx} href={`/plan?destination=${dest.city}`} className="rounded-2xl overflow-hidden relative h-80 group cursor-pointer block">
                <img src={dest.img} alt={dest.city} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white text-left">
                  <p className="text-[10px] opacity-80">{dest.country}</p>
                  <p className="font-bold text-lg">{dest.city}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. Footer CTA */}
        <section className="w-full max-w-4xl bg-[#7469C4] rounded-2xl p-12 text-center text-white flex flex-col items-center gap-6">
          <h2 className="text-3xl font-bold">Ready for Your Next Adventure?</h2>
          <p className="text-white/80 text-sm max-w-md">
            Let our AI chatbot plan every detail. Just tell us what you love, and we will handle the rest.
          </p>
          <Link href="/plan" className="bg-white text-[#7469C4] font-bold px-8 py-3 rounded-xl hover:bg-zinc-100 transition-colors">
            Start Chatting Now
          </Link>
        </section>

      </main>

      {/* 7. Bottom Footer Bar */}
      <footer className="border-t border-zinc-100 py-6 px-10 flex justify-between items-center text-[10px] text-zinc-400">
        <div>© WanderAI</div>
        <div>Powered by Gemini AI</div>
      </footer>
    </div>
  );
}
