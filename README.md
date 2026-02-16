
# FitTribe 🐼 | Open-Source AI Fitness & Holistic Wellbeing App
![FitTribe Banner](public/assets/fittribe_banner.webp)

**[Live Demo](https://tribeworkout.netlify.app/)** | **[Product Hunt Launch](https://www.producthunt.com/products/fittribe-2/launches/fittribe-2)**

**FitTribe** is an open-source, AI-powered holistic wellbeing and fitness tracking platform built with React 19, Supabase, and Google Gemini AI. Designed as a "digital campfire" for close-knit communities, FitTribe goes beyond traditional workout trackers by gamifying both physical fitness (strength training, cardio) and mental wellness (creativity, meditation, cooking) in a cozy, panda-themed interface.

Whether you are looking for an open-source alternative to standard fitness apps, a gamified habit tracker, or a reference architecture for building offline-first PWAs with React and Supabase, FitTribe has you covered.

---

## 🌟 What Makes FitTribe Different? (Features)

Most health apps separate physical fitness from mental wellness. FitTribe brings them together into a single, supportive ecosystem with the following core features:

* **Holistic Activity Tracking:** Log everything from heavy strength training and running to "Wellbeing Actions" like painting, reading, or meditating.
* **AI-Powered Fitness & Diet Planning:** Integrated with **Google Gemini AI**, the "Sage Panda" assistant generates highly personalized weekly workout routines and diet plans based on your unique goals and real-time feedback.
* **Gamification & Virtual Economy:** Earn growth points for consistency. Unlock custom badges, send virtual gifts to your tribe members, and purchase cozy new UI themes.
* **Social Community Dynamics:** Build a "Tribe" to contribute to global Team Streaks and Tribe Goals. Every member's effort counts in this non-competitive, supportive environment.
* **Adaptive AI Guidance:** Log your post-workout reflections and let the AI gently adjust the intensity of your future routines based on your fatigue or soreness levels.
* **Offline-First PWA:** Built as a Progressive Web App (PWA) with optimistic UI updates. Your workout logs save instantly and sync automatically when your internet connection is restored.

---

## 🛠️ Technology Stack & Architecture

FitTribe is built using a modern, scalable JavaScript/TypeScript ecosystem:

* **Frontend Framework:** [React 19](https://react.dev/)
* **Styling & Animation:** Tailwind CSS, Lucide React, Framer Motion
* **Backend as a Service (BaaS):** [Supabase](https://supabase.com/) (PostgreSQL Database, Authentication, Realtime subscriptions, Row Level Security)
* **Artificial Intelligence (AI):** Google Gemini API (`gemini-flash-lite` for fast, cost-effective generative text)
* **Build Tool & PWA:** Vite, `vite-plugin-pwa` for robust service worker and offline caching
* **Hosting/Deployment:** Netlify (Optimized for edge delivery)

---

## 📋 Getting Started (Local Development)

Want to run FitTribe locally, contribute to the open-source codebase, or fork it for your own community? Follow these steps:

### 1. Prerequisites

* Node.js installed on your machine
* A free [Supabase](https://supabase.com) project
* A [Google Gemini API Key](https://ai.google.dev/)

### 2. Database Setup

Run the `supabase_db.sql` script located in the repository root within your Supabase SQL Editor. This will automatically provision:

* Core Tables: `profiles`, `workout_logs`, `tribes`, `gamification_state`
* Security: Row Level Security (RLS) policies to ensure user data privacy.

### 3. Environment Variables

Create a `.env` file in the root directory. **(Do not commit this file to version control).**

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_KEY=your_supabase_anon_key
VITE_API_KEY=your_gemini_api_key

```

### 4. Installation & Running

```bash
npm install
npm run dev

```

---

## 🚀 Deployment (Netlify)

Deploying FitTribe to production is straightforward using Netlify:

1. Connect your GitHub repository to Netlify.
2. Set the **Build Command** to `npm run build`.
3. Set the **Publish Directory** to `dist`.
4. Add your `.env` variables in **Site Settings > Build & Deploy > Environment**.
5. Trigger the deploy!

---

## 🤝 Contributing to FitTribe

We welcome contributions from the open-source community! Whether you want to fix a bug, add a new AI feature, or improve our React components, we'd love your help.

1. **Fork** the repository.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a **Pull Request**.

---

## 💬 Support & Feedback

If you have questions about the codebase, encounter bugs, or have feature requests, please [open an Issue](https://www.google.com/search?q=https://github.com/akshay090592-cmd/FitTribe/issues) in this repository.

## 🛡️ License

FitTribe is distributed under the **MIT License**. See `LICENSE` for more information.
