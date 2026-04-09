import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { AuthForm } from './AuthForm';
import { Footer } from './Footer';
import { BlogSection } from './BlogSection';

interface BlogLayoutProps {
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

export const BlogLayout: React.FC<BlogLayoutProps> = ({ onNavigate, children }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Account created! Please check your email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleJoinNow = () => {
    const el = document.getElementById('blog-signup-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-2 text-slate-900 group"
          >
            <img
              src="/assets/panda_male.webp"
              alt="FitTribe Logo"
              className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-md group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-xl font-bold font-['Fredoka']">FitTribe</span>
          </button>

          <button
            onClick={handleJoinNow}
            className="bg-emerald-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
          >
            Join Now
          </button>
        </div>
      </nav>

      <main>
        {children}

        <div className="border-t border-slate-200">
          <BlogSection onNavigate={onNavigate} />
        </div>

        <section id="blog-signup-form" className="relative py-24 flex items-center overflow-hidden border-t border-slate-200">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/professional_jungle_hero.webp"
            alt="Professional Jungle Gym"
            className="w-full h-full object-cover animate-scale-up-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-emerald-900/40"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold font-['Fredoka'] leading-tight">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-lime-300">Level Up?</span>
            </h2>
            <p className="text-xl text-emerald-50/90 leading-relaxed font-light">
              Join thousands of others in the FitTribe community. Track your progress, share your journey, and achieve your goals together.
            </p>
            <ul className="space-y-4 mt-8">
              <li className="flex items-center text-emerald-100 font-medium whitespace-nowrap"><CheckCircle2 className="text-emerald-400 mr-3 flex-shrink-0" size={24} /> 100% Free Forever</li>
              <li className="flex items-center text-emerald-100 font-medium whitespace-nowrap"><CheckCircle2 className="text-emerald-400 mr-3 flex-shrink-0" size={24} /> Supportive Community</li>
              <li className="flex items-center text-emerald-100 font-medium whitespace-nowrap"><CheckCircle2 className="text-emerald-400 mr-3 flex-shrink-0" size={24} /> Gamified Experience</li>
            </ul>
          </div>
          
          <div className="flex justify-center lg:justify-end mt-10 lg:mt-0">
            <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-white/20 max-w-sm mx-auto lg:mx-0 w-full animate-slide-up transform hover:scale-[1.01] transition-transform duration-500 relative overflow-hidden group">
              <AuthForm
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                isSignUp={isSignUp} setIsSignUp={setIsSignUp}
                authLoading={authLoading} authError={authError}
                setAuthError={setAuthError} handleAuth={handleAuth}
                isSupabaseConfigured={true}
                dark={true}
              />
            </div>
          </div>
        </div>
      </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
