import React from 'react';
import { FooterPageLayout } from './FooterPageLayout';
import { SEO } from './SEO';

interface TermsOfServiceProps {
    onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
    return (
        <FooterPageLayout title="Terms of Service" onBack={onBack}>
            <SEO
                title="Terms of Service - FitTribe Tracker"
                description="Our Terms of Service outline the agreement between you and FitTribe regarding the use of our fitness tracking platform."
                url="https://fittribe.app/terms"
                type="website"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "url": "https://fittribe.app/terms",
                    "name": "FitTribe Terms of Service",
                    "description": "Our Terms of Service outline the agreement between you and FitTribe regarding the use of our fitness tracking platform."
                }}
            />
            <section className="space-y-6">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">1. Agreement to Terms</h2>
                <p>By accessing or using FitTribe, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the application.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">2. Use of the Service</h2>
                <p>You agree to use FitTribe for its intended purpose: tracking personal fitness and participating in community activities. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">3. Health and Safety Disclaimer</h2>
                <p><strong>IMPORTANT:</strong> FitTribe is for informational and community purposes only. We are not medical professionals. Consult with a healthcare provider before starting any new exercise program. Use of the app is at your own risk. FitTribe and its creators are not responsible for any injuries or health issues that may result from your use of the app.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">4. User Conduct</h2>
                <p>You agree not to use FitTribe to:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Harass, abuse, or harm other tribe members.</li>
                    <li>Upload or share inappropriate, offensive, or illegal content.</li>
                    <li>Interfere with the operation of the service.</li>
                </ul>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">5. Modifications to Service</h2>
                <p>We reserve the right to modify or discontinue FitTribe at any time without notice. We also reserve the right to update these Terms of Service as needed.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">6. Contact</h2>
                <p>For questions regarding these terms, please reach out to <a href="mailto:mindweave.app@gmail.com" className="text-emerald-600 hover:underline">mindweave.app@gmail.com</a>.</p>
            </section>
        </FooterPageLayout>
    );
};
