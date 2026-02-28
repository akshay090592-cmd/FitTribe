import React from 'react';
import { FooterPageLayout } from './FooterPageLayout';
import { SEO } from './SEO';

interface PrivacyPolicyProps {
    onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
    return (
        <FooterPageLayout title="Privacy Policy" onBack={onBack}>
            <SEO
                title="Privacy Policy - FitTribe Tracker"
                description="Read our Privacy Policy to understand how FitTribe collects, uses, and protects your personal and fitness data."
                url="https://fittribe.app/privacy"
                type="website"
                schema={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "url": "https://fittribe.app/privacy",
                    "name": "FitTribe Privacy Policy",
                    "description": "Read our Privacy Policy to understand how FitTribe collects, uses, and protects your personal and fitness data."
                }}
            />
            <section className="space-y-6">
                <p>Last updated: {new Date().toLocaleDateString()}</p>

                <p>At FitTribe, your privacy is a top priority. This Privacy Policy explains how we collect, use, and protect your information when you use our application.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">Information We Collect</h2>
                <p>To provide you with the best experience, we collect information you provide directly, such as:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Profile Information:</strong> Name, display name, and avatar choice.</li>
                    <li><strong>Fitness Data:</strong> Workout logs, activities, height, weight, and consistency rates.</li>
                    <li><strong>Tribe Information:</strong> The tribes you create or join and your interactions within them.</li>
                </ul>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">How We Use Your Information</h2>
                <p>We use your data to:</p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Personalize your fitness journey and track progress.</li>
                    <li>Facilitate social interactions and accountability within your tribe.</li>
                    <li>Calculate XP, levels, and achievements.</li>
                    <li>Improve app performance and user experience.</li>
                </ul>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">Data Security</h2>
                <p>We implement industry-standard security measures to protect your personal data from unauthorized access or disclosure. Your authentication is powered by secure providers (like Supabase or Firebase) to ensure your credentials remain protected.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">Social Sharing</h2>
                <p>By design, FitTribe is a social app. Your workout activity and consistency levels may be shared with members of your tribe to foster accountability and community support. You have control over what information you share in your profile settings.</p>

                <h2 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mt-8">Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:mindweave.app@gmail.com" className="text-emerald-600 hover:underline">mindweave.app@gmail.com</a>.</p>
            </section>
        </FooterPageLayout>
    );
};
