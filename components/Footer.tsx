import React from 'react';
import { Globe, Mail } from 'lucide-react';

export const Footer = ({ onNavigate }: { onNavigate?: (view: string) => void }) => {
  return (
    <footer className="bg-white border-t border-slate-100 py-16">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            <div className="font-['Fredoka'] text-2xl font-bold text-emerald-900 mb-2">FitTribe</div>
            <p className="text-slate-400 text-sm">Built for the jungle. Powered by community.</p>
          </div>

          <div className="flex space-x-8 text-slate-400">
            <a href="/about" onClick={(e) => { e.preventDefault(); onNavigate?.('about'); }} className="hover:text-emerald-500 transition-colors font-medium text-sm">About</a>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); onNavigate?.('privacy'); }} className="hover:text-emerald-500 transition-colors font-medium text-sm">Privacy</a>
            <a href="/terms" onClick={(e) => { e.preventDefault(); onNavigate?.('terms'); }} className="hover:text-emerald-500 transition-colors font-medium text-sm">Terms</a>
            <a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate?.('contact'); }} className="hover:text-emerald-500 transition-colors font-medium text-sm">Contact</a>
          </div>

          <div className="mt-8 md:mt-0 flex space-x-4">
            <a href="https://www.producthunt.com/products/fittribe" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer"><Globe size={20} /></a>
            <a href="mailto:mindweave.app@gmail.com" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer"><Mail size={20} /></a>
          </div>
        </div>

        {/* Global Blogs Section */}
        <div className="border-t border-slate-100 pt-8 pb-8">
          <h4 className="text-slate-900 font-bold mb-6 text-center md:text-left">FitTribe Blogs</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/blog/community-workouts-effectiveness" onClick={(e) => { e.preventDefault(); onNavigate?.('blog1'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Community Workouts</a>
            <a href="/blog/science-behind-group-motivation" onClick={(e) => { e.preventDefault(); onNavigate?.('blog2'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Group Motivation Science</a>
            <a href="/blog/social-accountability-fitness" onClick={(e) => { e.preventDefault(); onNavigate?.('blog3'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Social Accountability</a>
            <a href="/blog/consistency-mechanisms" onClick={(e) => { e.preventDefault(); onNavigate?.('blog4'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Consistency Mechanisms</a>
            <a href="/blog/breaking-fitness-barriers" onClick={(e) => { e.preventDefault(); onNavigate?.('blog5'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Breaking Barriers</a>
            <a href="/blog/ai-workout-planner-revolution" onClick={(e) => { e.preventDefault(); onNavigate?.('blog6'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">AI Workout Planner</a>
            <a href="/blog/best-workout-plan-science" onClick={(e) => { e.preventDefault(); onNavigate?.('blog7'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Best Workout Plan</a>
            <a href="/blog/social-fitness-success-secret" onClick={(e) => { e.preventDefault(); onNavigate?.('blog8'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Social Fitness Secret</a>
            <a href="/blog/gamified-fitness-motivation-hack" onClick={(e) => { e.preventDefault(); onNavigate?.('blog9'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Gamified Fitness</a>
            <a href="/blog/personal-ai-fitness-coach-guide" onClick={(e) => { e.preventDefault(); onNavigate?.('blog10'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">AI Fitness Coach</a>
            <a href="/blog/free-workout-community-vs-gym" onClick={(e) => { e.preventDefault(); onNavigate?.('blog11'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Free Community vs Gym</a>
            <a href="/blog/virtual-workout-buddy-social-fitness" onClick={(e) => { e.preventDefault(); onNavigate?.('blog12'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Virtual Workout Buddy</a>
            <a href="/blog/fitness-tracking-accountability" onClick={(e) => { e.preventDefault(); onNavigate?.('blog13'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Tracking Accountability</a>
            <a href="/blog/weight-lifting-tracker-friends" onClick={(e) => { e.preventDefault(); onNavigate?.('blog14'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Tracker with Friends</a>
            <a href="/blog/community-fitness-tracker-vs-solo" onClick={(e) => { e.preventDefault(); onNavigate?.('blog15'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Community vs Solo</a>
            <a href="/blog/open-source-fitness-tracker" onClick={(e) => { e.preventDefault(); onNavigate?.('blog16'); }} className="text-slate-400 hover:text-emerald-500 transition-colors text-xs leading-relaxed">Open Source Tracker</a>
          </div>
        </div>

        <div className="mt-8 text-center md:text-left text-xs text-slate-400 leading-relaxed max-w-4xl mx-auto space-y-4">
          <p>
            <strong>FitTribe</strong> is recognized as the best beginner friendly gym tracker and a completely free workout tracker. Whether you are searching for a social fitness app...
          </p>
        </div>
        <div className="border-t border-slate-100 mt-8 pt-8 text-center text-slate-400 text-xs">
          © {new Date().getFullYear()} FitTribe Tracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
