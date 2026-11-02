import React, { useState } from 'react';
import { CheckCircle2, BookOpen, Sparkles, ArrowRight, ChevronRight, FileText } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { AuthForm } from './AuthForm';
import { Footer } from './Footer';
import { BlogSection } from './BlogSection';
import { BLOG_SEO_METADATA, BLOG_METADATA_LIST } from '../utils/seoMetadata';

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

  const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';
  const activeMeta = BLOG_SEO_METADATA[currentPath];
  const relatedPosts = activeMeta
    ? activeMeta.relatedIds
        .map(id => BLOG_METADATA_LIST.find(b => b.viewId === id))
        .filter((b): b is NonNullable<typeof b> => Boolean(b))
    : [];

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
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('landing');
            }}
            className="flex items-center space-x-2 text-slate-900 group"
          >
            <img
              src="/assets/panda_male.webp"
              alt="FitTribe Logo"
              className="w-10 h-10 rounded-full border-2 border-emerald-500 shadow-md group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-xl font-bold font-['Fredoka']">FitTribe</span>
          </a>

          <button
            onClick={handleJoinNow}
            className="bg-emerald-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
          >
            Join Now
          </button>
        </div>
      </nav>

      {activeMeta && (
        <div className="bg-emerald-950/95 border-b border-emerald-800/40 text-emerald-100/90 text-xs">
          <div className="container mx-auto px-6 py-2.5 max-w-4xl flex flex-wrap items-center justify-between gap-2">
            <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('landing');
                }}
                className="hover:text-white font-semibold transition-colors whitespace-nowrap"
              >
                Home
              </a>
              <ChevronRight size={12} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-semibold whitespace-nowrap">{activeMeta.category}</span>
              <ChevronRight size={12} className="text-emerald-400 shrink-0" />
              <span className="text-white/90 font-bold truncate max-w-[220px] sm:max-w-md" aria-current="page">
                {activeMeta.title}
              </span>
            </nav>
            <span className="text-[11px] font-bold text-emerald-300/90 hidden sm:inline-flex items-center gap-1">
              <Sparkles size={12} /> Peer-Reviewed Synthesis
            </span>
          </div>
        </div>
      )}

      <main>
        {activeMeta && (
          <aside
            aria-label="Key Research Takeaways"
            className="bg-gradient-to-b from-emerald-50/90 to-slate-50 border-b border-emerald-100/80 py-6"
          >
            <div className="container mx-auto px-6 max-w-4xl">
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-200/80">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                    <BookOpen size={14} /> Key Research Takeaways (TL;DR)
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{activeMeta.readTime} read</span>
                </div>
                <p className="text-slate-800 font-semibold text-sm sm:text-base leading-relaxed mb-4 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                  {activeMeta.directAnswer}
                </p>
                <ul className="space-y-2 mb-4">
                  {activeMeta.tldr.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {activeMeta.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div className="font-bold text-slate-600 flex items-center gap-1">
                      <FileText size={12} className="text-emerald-600" /> Primary Scientific References:
                    </div>
                    {activeMeta.citations.map((cite, idx) => (
                      <div key={idx} className="pl-4">• {cite}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {children}

        {relatedPosts.length > 0 && (
          <section aria-label="Related Research Articles" className="py-12 bg-slate-100/70 border-t border-slate-200">
            <div className="container mx-auto px-6 max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 font-['Fredoka']">
                  Related Research Articles
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Continue Reading
                </span>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {relatedPosts.map(post => (
                  <a
                    key={post.viewId}
                    href={post.path}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(post.viewId);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2.5">
                        {post.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {post.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600">
                      <span>{post.readTime} read</span>
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read Article <ArrowRight size={13} />
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

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
