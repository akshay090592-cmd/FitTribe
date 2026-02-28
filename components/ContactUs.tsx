import React from 'react';
import { Mail, Globe, MessageSquare } from 'lucide-react';
import { FooterPageLayout } from './FooterPageLayout';
import { SEO } from './SEO';

interface ContactUsProps {
    onBack: () => void;
}

export const ContactUs: React.FC<ContactUsProps> = ({ onBack }) => {
    return (
        <FooterPageLayout title="Contact Us" onBack={onBack}>
            <SEO
                title="Contact FitTribe - We're Here to Help"
                description="Have questions or feedback? Reach out to the FitTribe team. We're dedicated to helping our community thrive."
                url="https://fittribe.app/contact"
                type="website"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "ContactPage",
                    "url": "https://fittribe.app/contact",
                    "name": "Contact FitTribe",
                    "description": "Have questions or feedback? Reach out to the FitTribe team. We're dedicated to helping our community thrive.",
                    "contactPoint": {
                        "@type": "ContactPoint",
                        "email": "mindweave.app@gmail.com",
                        "contactType": "customer support"
                    }
                }}
            />
            <section className="space-y-8">
                <p className="text-xl text-slate-700 text-center">
                    Have questions, feedback, or need help with the jungle? We're here to help the tribe thrive.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
                            <Mail size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Email Us</h3>
                        <p className="text-slate-500 text-sm mb-4">The fastest way to reach us for support or inquiries.</p>
                        <a
                            href="mailto:mindweave.app@gmail.com"
                            className="text-emerald-600 font-bold hover:underline text-lg"
                        >
                            mindweave.app@gmail.com
                        </a>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Feedback</h3>
                        <p className="text-slate-500 text-sm mb-4">Want to suggest a feature or report a bug?</p>
                        <a
                            href="mailto:mindweave.app@gmail.com?subject=FitTribe Feedback"
                            className="text-blue-600 font-bold hover:underline text-lg"
                        >
                            Send Feedback
                        </a>
                    </div>
                </div>

                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center mt-12">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Global Community</h3>
                    <p className="text-slate-500 max-w-lg mx-auto">
                        FitTribe is a global community of fitness enthusiasts. While we don't have physical offices for visitors, our digital doors are always open.
                    </p>
                    <div className="flex justify-center space-x-4 mt-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Globe size={24} />
                        </div>
                    </div>
                </div>
            </section>
        </FooterPageLayout>
    );
};
