import React from 'react';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export interface AuthFormProps {
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
  dark?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  email, setEmail, password, setPassword, isSignUp, setIsSignUp,
  authLoading, authError, setAuthError, handleAuth, isSupabaseConfigured, dark
}) => (
  <>
    <h2 className={`text-2xl font-bold mb-6 font-['Fredoka'] text-center ${dark ? 'text-white' : 'text-slate-900'}`}>
      {isSignUp ? 'Join the Tribe' : 'Welcome Back'}
    </h2>

    {!isSupabaseConfigured && (
      <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-3 mb-4 rounded text-xs font-bold">
        ⚠️ Supabase Keys missing.
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
        className={`text-sm font-bold hover:underline ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}
      >
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </button>
    </div>
  </>
);
