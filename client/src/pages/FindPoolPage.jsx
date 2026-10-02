import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  SlidersHorizontal, 
  ArrowUpDown, 
  CheckCircle2, 
  Car, 
  Leaf, 
  Filter
} from 'lucide-react';

export default function FindPoolPage() {
  const [source, setSource] = useState('West Campus Residence Hall');
  const [destination, setDestination] = useState('Engineering & Science Complex');
  const [date, setDate] = useState('2026-10-03');
  const [time, setTime] = useState('08:30');
  const [seats, setSeats] = useState(1);
  const [sortBy, setSortBy] = useState('ai_match');
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [ladiesOnly, setLadiesOnly] = useState(false);

  const availableRides = [
    {
      id: 'rd-1',
      driver: {
        name: 'Sarah Jenkins',
        department: 'Computer Science • Faculty',
        rating: 4.95,
        reviewCount: 42,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        verified: true
      },
      car: {
        model: 'White Honda Civic',
        type: 'Sedan',
        plate: '7XYZ89'
      },
      origin: 'West Campus Residence Gate 2',
      destination: 'Engineering & Science Complex Hub',
      departureTime: '08:45 AM',
      availableSeats: 2,
      totalSeats: 4,
      pricePerSeat: '$3.50',
      matchScore: 98,
      isAiRecommended: true,
      amenities: ['AC', 'Music On', 'Verified Driver', 'Luggage Space']
    },
    {
      id: 'rd-2',
      driver: {
        name: 'Marcus Chen',
        department: 'Bioengineering • Graduate Student',
        rating: 4.88,
        reviewCount: 29,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        verified: true
      },
      car: {
        model: 'Blue Tesla Model 3',
        type: 'EV',
        plate: 'EV9942'
      },
      origin: 'North Campus Apartments',
      destination: 'Engineering & Science Complex Hub',
      departureTime: '08:50 AM',
      availableSeats: 3,
      totalSeats: 4,
      pricePerSeat: '$4.00',
      matchScore: 94,
      isAiRecommended: true,
      amenities: ['Zero Emissions (EV)', 'Quiet Ride', 'AC']
    },
    {
      id: 'rd-3',
      driver: {
        name: 'Priya Patel',
        department: 'Business School • MBA Candidate',
        rating: 5.0,
        reviewCount: 18,
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        verified: true
      },
      car: {
        model: 'Silver Toyota RAV4',
        type: 'SUV',
        plate: 'RAV820'
      },
      origin: 'Graduate Student Village',
      destination: 'Main Campus Quadrangle',
      departureTime: '09:00 AM',
      availableSeats: 2,
      totalSeats: 4,
      pricePerSeat: '$3.00',
      matchScore: 89,
      isAiRecommended: false,
      amenities: ['AC', 'Spacious Trunk', 'Same-Gender Optional']
    },
    {
      id: 'rd-4',
      driver: {
        name: 'David Miller',
        department: 'Medical Center • Staff',
        rating: 4.82,
        reviewCount: 35,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        verified: true
      },
      car: {
        model: 'Charcoal Hyundai Elantra',
        type: 'Sedan',
        plate: 'HY7124'
      },
      origin: 'South Campus Transit Center',
      destination: 'Health Sciences Building',
      departureTime: '09:15 AM',
      availableSeats: 1,
      totalSeats: 3,
      pricePerSeat: '$2.50',
      matchScore: 85,
      isAiRecommended: false,
      amenities: ['AC', 'Prompt Departure']
    }
  ];

  return (
    <div className="space-y-8">
      {/* ================= HERO INTRO BANNER ================= */}
      <div className="bg-gradient-to-r from-coride-dark via-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-elevated relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI-Powered Commute Optimization</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Find Compatible Campus Carpools
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl">
            Match with verified students, faculty, and campus staff who share your daily route and schedule.
          </p>
        </div>
      </div>

      {/* ================= LARGE DESKTOP SEARCH SECTION ================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-subtle space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          
          {/* 1. Pickup Location */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-coride-primary"></span>
              <span>Pickup Location</span>
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3 focus-within:border-coride-primary focus-within:ring-2 focus-within:ring-coride-primary/10 transition-all">
              <MapPin className="w-4 h-4 text-coride-primary flex-shrink-0" />
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Enter pickup hub or address"
                className="bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* 2. Destination */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Campus Destination</span>
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3 focus-within:border-coride-primary focus-within:ring-2 focus-within:ring-coride-primary/10 transition-all">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter campus building or lab"
                className="bg-transparent text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* 3. Date */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Date</span>
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-3 text-sm font-semibold text-slate-800 focus-within:border-coride-primary transition-all">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Time */}
          <div className="lg:col-span-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Time</span>
            </label>
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-800 focus-within:border-coride-primary transition-all">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
              />
            </div>
          </div>

          {/* 5. Seats */}
          <div className="lg:col-span-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Seats</span>
            </label>
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-3 py-3 text-sm font-semibold text-slate-800 focus-within:border-coride-primary transition-all">
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none w-full cursor-pointer"
              >
                <option value={1}>1 Seat</option>
                <option value={2}>2 Seats</option>
                <option value={3}>3 Seats</option>
                <option value={4}>4 Seats</option>
              </select>
            </div>
          </div>

          {/* 6. Search CTA Button */}
          <div className="lg:col-span-2">
            <button className="w-full bg-coride-dark hover:bg-emerald-900 active:scale-[0.99] text-white py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all h-[46px]">
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Search Rides</span>
            </button>
          </div>

        </div>
      </div>

      {/* ================= MAIN CONTENT: 2-COLUMN RESPONSIVE LAYOUT ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ================= LEFT SIDEBAR: FILTERS & SORTING (3 Cols) ================= */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-coride-primary" />
                <h3 className="font-extrabold text-sm text-slate-900">Filter & Refine</h3>
              </div>
              <button className="text-[11px] font-bold text-coride-primary hover:underline">
                Reset All
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Sort Rides By</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-coride-primary cursor-pointer"
              >
                <option value="ai_match">Best AI Compatibility (98% → 80%)</option>
                <option value="earliest">Earliest Departure</option>
                <option value="lowest_fare">Lowest Cost Contribution</option>
                <option value="rating">Highest Driver Rating</option>
              </select>
            </div>

            {/* Trust & Safety Filters */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Campus Trust</h4>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Drivers Only</span>
                </div>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-coride-dark focus:ring-coride-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Same Department / Faculty</span>
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="w-4 h-4 rounded text-coride-dark focus:ring-coride-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-slate-700">Same-Gender Commute</span>
                <input
                  type="checkbox"
                  checked={ladiesOnly}
                  onChange={(e) => setLadiesOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-coride-dark focus:ring-coride-primary cursor-pointer"
                />
              </label>
            </div>

            {/* Vehicle & Ride Preferences */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Comfort & Amenities</h4>
              
              {['Air Conditioning (AC)', 'Zero Emissions (EV Only)', 'Music Allowed', 'Luggage Space'].map((pref, i) => (
                <label key={i} className="flex items-center justify-between cursor-pointer text-xs font-semibold text-slate-700">
                  <span>{pref}</span>
                  <input
                    type="checkbox"
                    defaultChecked={i === 0}
                    className="w-4 h-4 rounded text-coride-dark focus:ring-coride-primary cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ================= RIGHT MAIN AREA: RECOMMENDATIONS & RIDE GRID (9 Cols) ================= */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* AI Commute Match Highlight Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl p-5 border border-emerald-200/90 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-coride-dark text-white flex items-center justify-center shadow-xs flex-shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-coride-dark bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    98% Route Overlap
                  </span>
                  <span className="text-xs font-semibold text-slate-500">Departure +/- 5 mins</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-1">
                  AI Commute Match: Sarah Jenkins shares your exact routine
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Departs at 08:45 AM from West Campus Gate 2 with 2 open seats available.
                </p>
              </div>
            </div>

            <button className="bg-coride-dark hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 flex-shrink-0 self-end sm:self-auto">
              <span>Quick Reserve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section Heading & Result Count */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Available Campus Pools</h2>
              <p className="text-xs text-slate-500">Showing 4 verified drivers traveling towards Engineering Complex</p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              Oct 3, 2026
            </span>
          </div>

          {/* Desktop Ride Cards Grid (2-column grid on desktop, 1 on mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {availableRides.map((ride) => (
              <div 
                key={ride.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Driver Profile Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden ring-2 ring-emerald-500/20 flex items-center justify-center font-bold text-slate-700 text-sm flex-shrink-0">
                      <img
                        src={ride.driver.avatar}
                        alt={ride.driver.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-coride-dark transition-colors">
                          {ride.driver.name}
                        </span>
                        {ride.driver.verified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600" title="Verified Campus Member" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{ride.driver.department}</p>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-extrabold text-slate-800">{ride.driver.rating}</span>
                        <span className="text-[11px] text-slate-400">({ride.driver.reviewCount} rides)</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Match Badge or Contribution */}
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-slate-900">{ride.pricePerSeat}</span>
                    <p className="text-[10px] text-slate-400 font-medium">per seat</p>
                  </div>
                </div>

                {/* Route Flow */}
                <div className="bg-slate-50/80 rounded-2xl p-3.5 space-y-2 border border-slate-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-coride-primary" />
                      {ride.departureTime} Departure
                    </span>
                    <span className="text-emerald-700 font-extrabold bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-[11px]">
                      {ride.availableSeats} of {ride.totalSeats} Seats Left
                    </span>
                  </div>

                  <div className="space-y-1 text-xs pt-1">
                    <div className="flex items-center space-x-2 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-coride-primary"></div>
                      <span className="truncate">{ride.origin}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="truncate font-semibold">{ride.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Car info & Amenities */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Car className="w-3 h-3 text-slate-500" />
                    {ride.car.model}
                  </span>
                  {ride.amenities.slice(0, 2).map((amenity, i) => (
                    <span key={i} className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {amenity}
                    </span>
                  ))}
                  {ride.matchScore >= 90 && (
                    <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> {ride.matchScore}% Match
                    </span>
                  )}
                </div>

                {/* Action CTA */}
                <div className="pt-1">
                  <button 
                    onClick={() => alert(`Ride requested with ${ride.driver.name}!`)}
                    className="w-full bg-coride-light hover:bg-emerald-100 text-coride-dark font-extrabold text-xs py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all group-hover:bg-coride-dark group-hover:text-white shadow-xs"
                  >
                    <span>Request to Join Pool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </section>

      </div>
    </div>
  );
}
