import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, ArrowRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface BlogSectionProps {
    onNavigate: (view: string) => void;
}

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    readTime: string;
    category: string;
    gradient: string;
    icon: string;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onNavigate }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const BLOG_PATHS: Record<string, string> = {
        blog1: '/blog/community-workouts-effectiveness',
        blog2: '/blog/science-behind-group-motivation',
        blog3: '/blog/social-accountability-fitness',
        blog4: '/blog/consistency-mechanisms',
        blog5: '/blog/breaking-fitness-barriers',
        blog6: '/blog/ai-workout-planner-revolution',
        blog7: '/blog/best-workout-plan-science',
        blog8: '/blog/social-fitness-success-secret',
        blog9: '/blog/gamified-fitness-motivation-hack',
        blog10: '/blog/personal-ai-fitness-coach-guide',
    };

    const blogPosts: BlogPost[] = [
        {
            id: 'blog1',
            title: 'Why Community Workouts Are More Effective Than Solo Training',
            excerpt: 'Discover the science behind the Köhler Effect and why working out with others leads to 58-200% longer persistence on physical tasks.',
            readTime: '8 min',
            category: 'Community Fitness',
            gradient: 'from-emerald-600 to-teal-600',
            icon: '🤝'
        },
        {
            id: 'blog2',
            title: 'The Science Behind Group Fitness Motivation',
            excerpt: 'Explore the neuroscience of endorphin synchronization, mirror neurons, and why your brain is literally wired for group exercise.',
            readTime: '10 min',
            category: 'Exercise Science',
            gradient: 'from-blue-600 to-indigo-600',
            icon: '🧠'
        },
        {
            id: 'blog3',
            title: 'How Social Accountability Transforms Your Fitness Journey',
            excerpt: 'Learn why people with accountability partners are 65% more likely to achieve their goals and how public commitment changes everything.',
            readTime: '7 min',
            category: 'Fitness Habits',
            gradient: 'from-purple-600 to-pink-600',
            icon: '🎯'
        },
        {
            id: 'blog4',
            title: '5 Ways Community Workouts Keep You Consistent',
            excerpt: 'From scheduled accountability to built-in support systems, discover the five mechanisms that make consistency effortless.',
            readTime: '6 min',
            category: 'Consistency Guide',
            gradient: 'from-teal-600 to-emerald-600',
            icon: '📅'
        },
        {
            id: 'blog5',
            title: 'Breaking Fitness Barriers: The Power of Working Out Together',
            excerpt: 'Tackle the biggest obstacles: lack of motivation, gym intimidation, boredom, confusion, and loneliness—and learn how community conquers them all.',
            readTime: '9 min',
            category: 'Inclusive Fitness',
            gradient: 'from-indigo-600 to-purple-600',
            icon: '⚡'
        },
        {
            id: 'blog6',
            title: 'AI Workout Planner: The Future of Personal Training',
            excerpt: 'Discover how artificial intelligence is revolutionizing fitness with hyper-personalized programming and real-time adjustments.',
            readTime: '7 min',
            category: 'AI Technology',
            gradient: 'from-indigo-600 to-emerald-600',
            icon: '🤖'
        },
        {
            id: 'blog7',
            title: 'The Best Workout Plan: Science Over Scams',
            excerpt: 'Stripping away the noise to show you what a truly effective plan looks like based on fundamental physiological principles.',
            readTime: '9 min',
            category: 'Training Science',
            gradient: 'from-emerald-950 to-teal-800',
            icon: '🏋️‍♂️'
        },
        {
            id: 'blog8',
            title: 'Social Fitness: More Than Just a Workout Buddy',
            excerpt: 'Why your tribe is the secret to long-term success and how connection transforms your workout habits.',
            readTime: '6 min',
            category: 'Social Fitness',
            gradient: 'from-pink-600 to-rose-700',
            icon: '❤️'
        },
        {
            id: 'blog9',
            title: 'Gamified Fitness: Playing Your Way to Health',
            excerpt: 'Level up your life with XP, badges, and streaks. Learn how game psychology makes fitness addictive.',
            readTime: '5 min',
            category: 'Gamification',
            gradient: 'from-purple-600 to-indigo-700',
            icon: '🏆'
        },
        {
            id: 'blog10',
            title: 'Your Personal AI Fitness Coach: 24/7 Support',
            excerpt: 'Experience the future of coaching. Democratizing access to expert guidance for everyone, anywhere.',
            readTime: '5 min',
            category: 'AI Coaching',
            gradient: 'from-slate-800 to-emerald-900',
            icon: '⚡'
        }
    ];

    const nextSlide = () => {
        if (currentIndex < blogPosts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setCurrentIndex(0); // Loop back
        }
    };

    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        } else {
            setCurrentIndex(blogPosts.length - 1); // Loop back to end
        }
    };

    useEffect(() => {
        if (scrollContainerRef.current) {
            const cardWidth = scrollContainerRef.current.offsetWidth;
            const scrollAmount = currentIndex * cardWidth;
            scrollContainerRef.current.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }, [currentIndex]);

    return (
        <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-800 font-bold px-4 py-2 rounded-full text-sm uppercase tracking-wide mb-4">
                        <BookOpen size={16} />
                        <span>FitTribe Blog</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 font-['Fredoka'] mb-6">
                        The Science of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Community Fitness</span>
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Discover evidence-based insights on why working out together isn't just more fun—it's scientifically proven to be more effective.
                    </p>
                </div>

                {/* Carousel Wrapper */}
                <div className="relative group max-w-6xl mx-auto">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl text-slate-800 hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center border border-slate-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={nextSlide}
                        className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-xl text-slate-800 hover:bg-emerald-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center border border-slate-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Carousel Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-8 pb-12 transition-all duration-500 no-scrollbar"
                    >
                        {blogPosts.map((post) => (
                            <div
                                key={post.id}
                                className="min-w-full md:min-w-[calc(50%-1rem)] lg:min-w-[calc(33.333%-1.33rem)] snap-center"
                            >
                                <a
                                    href={BLOG_PATHS[post.id]}
                                    className="group h-full bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 hover:-translate-y-2 cursor-pointer block"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate(post.id);
                                    }}
                                >
                                    {/* Card Header with Gradient */}
                                    <div className={`bg-gradient-to-r ${post.gradient} p-6 text-white relative overflow-hidden h-32`}>
                                        <div className="absolute top-0 right-0 text-8xl opacity-10">{post.icon}</div>
                                        <div className="relative z-10">
                                            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                                                {post.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-emerald-600 transition-colors h-14 line-clamp-2">
                                            {post.title}
                                        </h3>
                                        <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed text-sm">
                                            {post.excerpt}
                                        </p>

                                        {/* Meta Info */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                            <div className="flex items-center text-sm text-slate-500">
                                                <Clock size={16} className="mr-1" />
                                                <span>{post.readTime} read</span>
                                            </div>
                                            <div className="flex items-center text-emerald-600 font-bold text-sm group-hover:text-emerald-700 transition-colors">
                                                Read More
                                                <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Dots */}
                    <div className="flex justify-center space-x-2 mt-4">
                        {blogPosts.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index
                                        ? 'w-8 bg-emerald-600'
                                        : 'w-2 bg-slate-200 hover:bg-slate-300'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <p className="text-slate-600 mb-6">
                        Ready to experience the power of community fitness?
                    </p>
                    <button
                        onClick={() => {
                            const authSection = document.querySelector('[data-auth-section]');
                            if (authSection) {
                                authSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 px-10 rounded-full text-lg shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105"
                    >
                        Join FitTribe Today
                    </button>
                </div>
            </div>

            {/* Injected utility styles for hiding scrollbar */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    );
};
