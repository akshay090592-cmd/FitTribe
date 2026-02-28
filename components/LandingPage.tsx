import React, { useRef, useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, ArrowRight, Dumbbell, Users, Trophy, Sparkles, TrendingUp, Heart, Shield, Activity, Globe, Star, CheckCircle2, BarChart3, ChevronLeft, ChevronRight, Github } from 'lucide-react';
import { NotificationPopup } from './NotificationPopup';
import { BlogSection } from './BlogSection';
import { SEO } from './SEO';

interface LandingPageProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  authLoading: boolean;
  authError: string | null;
  setAuthError: (value: string | null) => void;
  handleAuth: (e: React.FormEvent) => void;
  isSupabaseConfigured: boolean;
  popupNotification: { title: string; body: string } | null;
  setPopupNotification: (value: { title: string; body: string } | null) => void;
  handleImgError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onNavigate?: (view: any) => void;
  isLoggedIn?: boolean;
}

type AuthFormProps = Pick<LandingPageProps,
  'email' | 'setEmail' | 'password' | 'setPassword' | 'isSignUp' | 'setIsSignUp' |
  'authLoading' | 'authError' | 'setAuthError' | 'handleAuth' | 'isSupabaseConfigured'
>;

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  authLoading,
  authError,
  setAuthError,
  handleAuth,
  isSupabaseConfigured,
  popupNotification,
  setPopupNotification,
  handleImgError,
  onNavigate,
  isLoggedIn = false
}) => {
  const authSectionRef = useRef<HTMLDivElement>(null);
  const desktopAuthRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToAuth = () => {
    if (window.innerWidth >= 1024) {
      desktopAuthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      authSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-200 selection:text-emerald-900">
      <SEO
        title="FitTribe Tracker - Free Community Workout & Fitness Tracking App"
        description="Transform your fitness journey with FitTribe. Join a supportive free workout community, track workouts, compete with friends, and stay motivated with gamified challenges."
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareApplication",
              "name": "FitTribe Tracker",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Web, iOS, Android",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "2500"
              }
            },
            {
              "@type": "WebPage",
              "name": "FitTribe - Free Community Fitness & Workout Tracker",
              "description": "Transform your fitness journey with FitTribe. Join a supportive free workout community, track workouts, compete with friends, and stay motivated."
            },
            {
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is the best beginner friendly gym tracker?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "FitTribe is widely considered the best beginner-friendly gym tracker. Unlike intimidating data-heavy apps, FitTribe makes tracking your sets and reps simple, fun, and engaging through gamification and a supportive community."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is FitTribe completely free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, 100% free. We believe that health and fitness tracking tools should be accessible to everyone, without expensive paywalls or premium monthly subscriptions."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does the social accountability work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "By sharing your progress with friends or your 'tribe', you tap into the Köhler Effect—a psychological phenomenon where working out with a group makes you push harder and stay consistent."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I track home workouts as well as gym workouts?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely! FitTribe is a versatile workout tracker that includes exercises for both home workouts (bodyweight, bands, dumbbells) and full gym strength training. You can even create custom exercises."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What does the AI Coaching feature do?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our AI Coach analyzes your past performance and logs to suggest optimal weight and reps for your next session, ensuring you are progressively overloading without the guesswork."
                  }
                }
              ]
            },
            {
              "@type": "Organization",
              "name": "FitTribe",
              "url": "https://fittribe.app",
              "logo": "https://fittribe.app/assets/panda_male.webp"
            }
          ]
        }}
      />

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img
              src="/assets/panda_male.webp"
              alt="FitTribe Logo"
              className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-md transform hover:rotate-12 transition-transform duration-300"
              onError={handleImgError}
            />
            <span className={`text-xl font-bold font-['Fredoka'] ${scrolled ? 'text-slate-900' : 'text-white'}`}>FitTribe</span>
          </div>
          <button
            onClick={scrollToAuth}
            className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${scrolled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20'
              }`}
          >
            Join Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/professional_jungle_hero.webp"
            alt="Professional Jungle Gym"
            className="w-full h-full object-cover animate-scale-up-slow"
            onError={handleImgError}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-900/30"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-white space-y-8 animate-fade-in pt-20 lg:pt-0">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full px-4 py-1.5 text-emerald-100 text-sm font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>The Free Social Fitness Tracker</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold font-['Fredoka'] leading-[1.1] drop-shadow-xl tracking-tight">
              Wildly Fun. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">
                Seriously Effective.
              </span>
            </h1>

            <p className="text-xl text-emerald-50/90 max-w-lg leading-relaxed font-light">
              Transform your fitness tracking into a shared adventure. Connect with your free workout community, hold each other accountable, and unleash your inner beast (or panda).
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={scrollToAuth}
                className="group bg-emerald-500 hover:bg-emerald-400 text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-[0_20px_40px_-12px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center border-b-4 border-emerald-700 hover:border-emerald-600 active:border-b-0 active:translate-y-1"
              >
                Join the Tribe <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>


            </div>
          </div>

          {/* Auth Card (Floating on Desktop) */}
          <div className="hidden lg:block" ref={desktopAuthRef}>
            <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 max-w-sm mx-auto animate-slide-up transform hover:scale-[1.01] transition-transform duration-500 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              {/* Re-using Auth Form Logic */}
              {isLoggedIn ? (
                <div className="text-center py-8 space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-400/50">
                    <CheckCircle2 className="text-emerald-400" size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white font-['Fredoka']">You're in!</h3>
                    <p className="text-emerald-100/70 text-sm">You are already part of the tribe.</p>
                  </div>
                  <div className="flex justify-center space-x-6">
                    <a href="https://www.producthunt.com/posts/fittribe-tracker" target="_blank" rel="noopener noreferrer" className="text-emerald-200 hover:text-white transition-colors">
                      <Globe className="w-6 h-6" />
                    </a>
                    <a href="mailto:mindweave.app@gmail.com" className="text-emerald-200 hover:text-white transition-colors">
                      <Mail className="w-6 h-6" />
                    </a>
                  </div>
                  <button
                    onClick={() => onNavigate?.('dashboard')}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center"
                  >
                    Go to Dashboard <ArrowRight className="ml-2" />
                  </button>
                </div>
              ) : (
                <AuthForm
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  isSignUp={isSignUp} setIsSignUp={setIsSignUp}
                  authLoading={authLoading} authError={authError}
                  setAuthError={setAuthError} handleAuth={handleAuth}
                  isSupabaseConfigured={isSupabaseConfigured}
                  dark
                />
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Feature Carousel Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">Experience the Jungle</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-['Fredoka'] mb-6">
              Everything You Need to <span className="text-emerald-500">Thrive</span>
            </h2>
          </div>

          <FeatureCarousel onAction={scrollToAuth} />

        </div>
      </section>

      {/* Authoritative Science Section */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 relative z-10">
              <img src="/assets/panda_science_together.webp" alt="Panda Scientist Explaining Data" className="rounded-[24px] shadow-sm w-full transition-all duration-500 hover:scale-[1.02]" onError={handleImgError} />

              {/* Stat Floating Card */}
              <div className="absolute -bottom-6 -right-6 bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-900/20 max-w-[200px] animate-bounce-slow">
                <div className="text-3xl font-bold font-['Fredoka'] mb-1">45%</div>
                <div className="text-xs text-emerald-100 leading-tight">Increase in exercise adherence when working out in groups.</div>
              </div>
            </div>

            {/* abstract background blobs */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-200/40 rounded-full blur-3xl"></div>
          </div>

          <div className="order-1 md:order-2 space-y-8">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wide mb-4">
                <Activity size={14} />
                <span>Research Backed</span>
              </div>
              <h2 className="text-4xl font-bold text-slate-900 font-['Fredoka'] mb-6">
                The Science of <span className="text-emerald-600">Together</span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                It's not just about having fun. It's about biology. Decades of psychology research confirm that solitary training is the hard mode of fitness.
              </p>
            </div>

            <div className="space-y-6">
              <ResearchItem
                title="The Köhler Effect"
                stat="58-200% Gain"
                desc="Weaker group members persist significantly longer in collective tasks compared to individual efforts."
                citation="Samendinger et al., 2018; Psychology of Sport and Exercise"
              />
              <ResearchItem
                title="Social Appointment"
                stat="High Adherence"
                desc="The feeling of not wanting to 'let others down' creates a powerful psychological contract that prevents skipping."
                citation="Davis et al., 2015; PLOS ONE"
              />
              <ResearchItem
                title="Mental Resilience"
                stat="26% Less Stress"
                desc="Group exercise is proven to reduce perceived stress levels significantly more than individual workouts."
                citation="Yorks et al., 2017; JAOA"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/jungle_night_bg.webp')] opacity-20 mix-blend-overlay object-cover"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wide mb-6">
            <Github size={14} className="mr-1" />
            <span>100% Open Source</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-['Fredoka'] mb-6">
            Built by the Community, <span className="text-emerald-400">For the Community</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            FitTribe is proudly open-source. We believe fitness tracking should be free, transparent, and collaborative. Join our mission, suggest features, or contribute code on GitHub!
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="https://github.com/akshay090592-cmd/FitTribe/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-4 px-8 rounded-full flex items-center shadow-lg transition-transform hover:-translate-y-1 text-lg"
            >
              <Github className="mr-2" size={20} />
              Star on GitHub
            </a>
            <a
              href="https://github.com/akshay090592-cmd/FitTribe/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-transparent border-2 border-slate-600 hover:border-slate-500 text-white font-bold py-4 px-8 rounded-full flex items-center transition-colors text-lg"
            >
              Suggest a Feature
            </a>
          </div>
        </div>
      </section>

      {/* Blog Section - Only on Landing (Logged Out State) */}
      {!isLoggedIn && <BlogSection onNavigate={onNavigate || (() => { })} />}

      {/* Testimonials */}
      <section className="py-24 bg-emerald-900 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('/assets/jungle_bg_pattern.webp')] opacity-5 mix-blend-overlay"></div>
        <div className="container mx-auto px-6 relative z-10">
          <Star className="w-12 h-12 text-yellow-400 mx-auto mb-6 fill-yellow-400" />
          <h2 className="text-3xl md:text-5xl font-bold text-white font-['Fredoka'] mb-12">
            Loved by the Tribe
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="The gamification keeps me coming back. I finally hit my streak goal!"
              author="Alex R."
              role="Level 12 Panda"
              img="/assets/panda_male.webp"
            />
            <TestimonialCard
              quote="Working out alone was boring. Seeing my friends' progress pushes me harder."
              author="Sarah M."
              role="Tribe Leader"
              img="/assets/panda_female.webp"
            />
            <TestimonialCard
              quote="Simple, effective, and actually fun to use. The design is amazing."
              author="Jamie L."
              role="Weekend Warrior"
              img="/assets/panda_female_2.webp"
            />
          </div>
        </div>
      </section>

      {/* Mobile Auth Section / Scroll Target */}
      <FAQSection />

      <section ref={authSectionRef} data-auth-section className="py-20 bg-slate-50 relative lg:hidden border-t border-slate-200">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 font-['Fredoka']">Ready to Start?</h2>
            <p className="text-slate-500">Join the tribe today.</p>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
            {isLoggedIn ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="text-emerald-500 mx-auto" size={48} />
                <h3 className="text-xl font-bold text-slate-900 font-['Fredoka']">Already Logged In</h3>
                <button
                  onClick={() => onNavigate?.('dashboard')}
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center"
                >
                  Return to App <ArrowRight className="ml-2" size={18} />
                </button>
              </div>
            ) : (
              <AuthForm
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                isSignUp={isSignUp} setIsSignUp={setIsSignUp}
                authLoading={authLoading} authError={authError}
                setAuthError={setAuthError} handleAuth={handleAuth}
                isSupabaseConfigured={isSupabaseConfigured}
              />
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <div className="font-['Fredoka'] text-2xl font-bold text-emerald-900 mb-2">FitTribe</div>
              <p className="text-slate-400 text-sm">Built for the jungle. Powered by community.</p>
            </div>

            <div className="flex space-x-8 text-slate-400">
              <a
                href="/about"
                onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }}
                className="hover:text-emerald-500 transition-colors font-medium text-sm"
              >
                About
              </a>
              <a
                href="/privacy"
                onClick={(e) => { e.preventDefault(); onNavigate?.('privacy'); }}
                className="hover:text-emerald-500 transition-colors font-medium text-sm"
              >
                Privacy
              </a>
              <a
                href="/terms"
                onClick={(e) => { e.preventDefault(); onNavigate?.('terms'); }}
                className="hover:text-emerald-500 transition-colors font-medium text-sm"
              >
                Terms
              </a>
              <a
                href="/contact"
                onClick={(e) => { e.preventDefault(); onNavigate?.('contact'); }}
                className="hover:text-emerald-500 transition-colors font-medium text-sm"
              >
                Contact
              </a>
            </div>

            <div className="mt-8 md:mt-0 flex space-x-4">
              <a
                href="https://www.producthunt.com/products/fittribe"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <Globe size={20} />
              </a>
              <a
                href="mailto:mindweave.app@gmail.com"
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
          <div className="mt-16 mb-8 text-center md:text-left text-xs text-slate-400 leading-relaxed max-w-4xl mx-auto space-y-4">
            <p>
              <strong>FitTribe</strong> is recognized as the best beginner friendly gym tracker and a completely free workout tracker. Whether you are searching for a social fitness app, a gamified workout tracker, or a community gym tracker to stay consistent, FitTribe has you covered.
            </p>
            <p>
              Replace expensive fitness apps with our free fitness community. Track your strength training, home workouts, cardio, and weight lifting. Find workout buddies online, engage in social accountability fitness, and leverage AI fitness coaching for free. Start your gamified fitness journey today and discover why thousands choose FitTribe as their daily workout companion.
            </p>
          </div>
          <div className="border-t border-slate-100 mt-8 pt-8 text-center text-slate-400 text-xs">
            © {new Date().getFullYear()} FitTribe Tracker. All rights reserved.
          </div>
        </div>
      </footer>

      {popupNotification && (
        <NotificationPopup
          isOpen={!!popupNotification}
          onClose={() => setPopupNotification(null)}
          title={popupNotification.title}
          body={popupNotification.body}
        />
      )}
    </div>
  );
};

// Sub-components

const FeatureCarousel = ({ onAction }: { onAction?: () => void }) => {
  const features = [
    {
      title: "Accessible Fitness",
      desc: "Fitness shouldn't be scary. Start where you are, with what you have.",
      img: "/assets/panda_accessible_fitness.webp"
    },
    {
      title: "Tribe Accountability",
      desc: "When your friends are watching, you don't skip leg day.",
      img: "/assets/panda_tribe_accountability.webp"
    },
    {
      title: "Gamified Rewards",
      desc: "Earn XP, unlock trophies, and turn sweat into shiny digital gold.",
      img: "/assets/panda_gamified_rewards.webp"
    },
    {
      title: "AI Coaching",
      desc: "Your smart panda coach builds the perfect plan for you.",
      img: "/assets/panda_ai_coaching.webp"
    },
    {
      title: "Calculated Strength",
      desc: "Track every rep. Watch your numbers go up. Feel the power.",
      img: "/assets/panda_strength_training.webp"
    }
  ];

  const [active, setActive] = useState(0);

  // Auto-rotate
  useEffect(() => {
    const interval = setInterval(() => {
      setActive(prev => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setActive(prev => (prev + 1) % features.length);
  const prevSlide = () => setActive(prev => (prev - 1 + features.length) % features.length);

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center bg-emerald-900 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('/assets/jungle_bg_pattern.webp')] mix-blend-overlay"></div>

        {/* Text Content */}
        <div className="relative z-10 text-white space-y-6 animate-fade-in">
          <div className="flex space-x-2 mb-4">
            {features.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === active ? 'w-8 bg-emerald-400' : 'w-2 bg-emerald-800 hover:bg-emerald-600'}`}
              />
            ))}
          </div>

          <div className="h-[200px] flex flex-col justify-center">
            <h3 className="text-3xl font-bold font-['Fredoka'] mb-4 transition-all duration-500 transform translate-x-0">
              {features[active].title}
            </h3>
            <p className="text-emerald-100 text-lg leading-relaxed">
              {features[active].desc}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onAction}
              className="bg-white text-emerald-900 font-bold py-3 px-8 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Try It Out
            </button>
            <div className="flex space-x-2">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-emerald-800/50 hover:bg-emerald-700 text-emerald-100 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-emerald-800/50 hover:bg-emerald-700 text-emerald-100 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Image Display */}
        <div className="relative z-10 flex justify-center items-center">
          <div className="relative w-full max-w-sm aspect-square">
            {features.map((feat, idx) => (
              <img
                key={idx}
                src={feat.img}
                alt={feat.title}
                className={`absolute inset-0 w-full h-full object-cover rounded-[24px] shadow-lg drop-shadow-2xl transition-all duration-700 ease-in-out transform ${idx === active
                  ? 'opacity-100 scale-100 translate-x-0 rotate-0'
                  : 'opacity-0 scale-75 translate-x-12 rotate-6'
                  }`}
                onError={(e) => {
                  // Fallback if image fails (using placeholder logic from parent but simpler)
                  (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/10b981/ffffff?text=Panda';
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ResearchItem = ({ title, stat, desc, citation }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-slate-900">{title}</h4>
      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">{stat}</span>
    </div>
    <p className="text-slate-600 text-sm mb-3 leading-relaxed">{desc}</p>
    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium flex items-center">
      <span className="w-1 h-1 rounded-full bg-slate-300 mr-2"></span>
      {citation}
    </div>
  </div>
);

const CheckListItem = ({ title, desc }: { title: string, desc: string }) => (
  <div className="flex items-start">
    <div className="bg-emerald-100 p-1 rounded-full mr-4 mt-1">
      <CheckCircle2 size={16} className="text-emerald-600" />
    </div>
    <div>
      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      <p className="text-slate-500 text-sm">{desc}</p>
    </div>
  </div>
);

const CounterItem = ({ icon, value, label, iconColor, bgColor }: any) => (
  <div className="text-center p-4">
    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-110 ${bgColor} shadow-sm`}>
      {React.cloneElement(icon, { size: 24, className: iconColor })}
    </div>
    <div className={`text-xl font-bold text-slate-900 font-['Fredoka'] mb-1`}>{value}</div>
    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</div>
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, delay }) => (
  <div
    className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`w-16 h-16 ${color.replace('text-', 'bg-').split(' ')[0]}/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
      {React.cloneElement(icon as React.ReactElement, { size: 32, className: color })}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
  </div>
);

const TestimonialCard = ({ quote, author, role, img }: any) => (
  <div className="bg-emerald-800/50 backdrop-blur-sm p-8 rounded-3xl border border-emerald-700/50 text-left">
    <div className="flex space-x-1 text-yellow-400 mb-4">
      <Star size={16} fill="currentColor" />
      <Star size={16} fill="currentColor" />
      <Star size={16} fill="currentColor" />
      <Star size={16} fill="currentColor" />
      <Star size={16} fill="currentColor" />
    </div>
    <p className="text-emerald-100 mb-6 italic leading-relaxed">"{quote}"</p>
    <div className="flex items-center space-x-3">
      <img src={img} alt={author} className="w-10 h-10 rounded-full border border-emerald-400/30 object-cover" />
      <div>
        <div className="font-bold text-white text-sm">{author}</div>
        <div className="text-emerald-400 text-xs">{role}</div>
      </div>
    </div>
  </div>
);

const AuthForm: React.FC<AuthFormProps & { dark?: boolean }> = ({
  email, setEmail, password, setPassword, isSignUp, setIsSignUp,
  authLoading, authError, setAuthError, handleAuth, isSupabaseConfigured, dark
}) => (
  <>
    <h2 className={`text-2xl font-bold mb-6 font-['Fredoka'] text-center ${dark ? 'text-white' : 'text-slate-900'}`}>
      {isSignUp ? 'Join the Tribe' : 'Welcome Back'}
    </h2>

    {!isSupabaseConfigured && (
      <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 mb-4 rounded text-xs font-bold">
        ⚠️ Supabase Keys missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_KEY.
      </div>
    )}

    <form onSubmit={handleAuth} className="space-y-4">
      <div className="relative">
        <Mail className={`absolute left-4 top-4 ${dark ? 'text-emerald-300' : 'text-emerald-500'}`} size={20} />
        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium transition-all ${dark
            ? 'bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 focus:bg-white/20'
            : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
        />
      </div>
      <div className="relative">
        <Lock className={`absolute left-4 top-4 ${dark ? 'text-emerald-300' : 'text-emerald-500'}`} size={20} />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium transition-all ${dark
            ? 'bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 focus:bg-white/20'
            : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
        />
      </div>

      {authError && (
        <div className="flex items-start space-x-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={authLoading}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
      >
        {authLoading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        ) : (
          <>
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>

    <div className="mt-6 text-center">
      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setAuthError(null);
        }}
        className={`text-sm font-bold hover:underline transition-all ${dark ? 'text-emerald-200 hover:text-white' : 'text-emerald-600 hover:text-emerald-800'}`}
      >
        {isSignUp ? 'Already have a panda? Sign in' : 'New to the tribe? Join the pack'}
      </button>
    </div>
  </>
);

const FAQSection = () => {
  const faqs = [
    {
      q: "What is the best beginner friendly gym tracker?",
      a: "FitTribe is widely considered the best beginner-friendly gym tracker. Unlike intimidating data-heavy apps, FitTribe makes tracking your sets and reps simple, fun, and engaging through gamification and a supportive community. Whether you are logging your first bench press or your hundredth, FitTribe makes it easy."
    },
    {
      q: "Is FitTribe completely free to use?",
      a: "Yes, 100% free — no hidden paywalls, no premium tiers. We believe that health and fitness tracking tools should be accessible to everyone."
    },
    {
      q: "How does the social accountability work on FitTribe?",
      a: "By sharing your progress with friends or your 'tribe', you tap into the Köhler Effect — a psychological phenomenon where working out with a group makes you push harder and stay consistent. Studies show group fitness improves adherence by up to 45%."
    },
    {
      q: "Can I track home workouts as well as gym workouts?",
      a: "Absolutely! FitTribe is a versatile workout tracker that supports both home workouts (bodyweight, bands, dumbbells) and full gym strength training. You can also create fully custom exercises."
    },
    {
      q: "What does the AI Coaching feature do?",
      a: "Our AI Coach analyzes your past performance and logs to suggest optimal weights and reps for your next session, ensuring you progressively overload without the guesswork — like having a personal trainer in your pocket, for free."
    }
  ];

  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">Got Questions?</span>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 font-['Fredoka'] mb-4">Frequently Asked <span className="text-emerald-500">Questions</span></h2>
          <p className="text-slate-500 text-lg">Everything you need to know about FitTribe.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                className="w-full text-left px-6 py-5 bg-slate-50 hover:bg-emerald-50 font-bold text-slate-800 flex justify-between items-center transition-colors"
              >
                <span className="text-base md:text-lg pr-4">{faq.q}</span>
                <span className={`text-emerald-500 font-bold text-2xl leading-none transition-transform duration-300 ${open === idx ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === idx && (
                <div className="px-6 py-5 bg-white text-slate-600 text-base md:text-lg leading-relaxed border-t border-slate-100">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
