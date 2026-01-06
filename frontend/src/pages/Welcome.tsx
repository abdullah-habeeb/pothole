import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white">
            {/* Left Side: 75% - Illustration area */}
            <div className="hidden lg:flex lg:w-3/4 flex-col justify-center items-center bg-gray-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50 z-0"></div>

                {/* Abstract "Smart City" visual representation since image gen failed */}
                <div className="relative z-10 max-w-4xl p-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Pothole Detection Platform
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        An AI-powered system for intelligent road monitoring and repair management.
                        Streamlining maintenance from detection to repair.
                    </p>

                    {/* Visual placeholder for the illustration */}
                    <div className="mt-12 mx-auto w-full max-w-3xl aspect-[16/9] bg-gradient-to-tr from-white to-blue-50 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center p-8">
                        <div className="space-y-4 text-gray-400">
                            <div className="flex items-center justify-center space-x-4">
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 w-48 bg-blue-100 rounded animate-pulse"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="flex items-center justify-center space-x-4">
                                <div className="h-4 w-24 bg-blue-100 rounded animate-pulse"></div>
                                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            {/* Road schematic look */}
                            <div className="mt-8 border-b-2 border-dashed border-gray-300 w-full relative">
                                <div className="absolute -top-3 left-1/3 w-6 h-6 border-2 border-red-400 rounded-full bg-red-50 flex items-center justify-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                </div>
                                <div className="absolute -top-3 right-1/4 w-6 h-6 border-2 border-yellow-400 rounded-full bg-yellow-50 flex items-center justify-center">
                                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"></div>
            </div>

            {/* Right Side: 25% - Action area */}
            <div className="w-full lg:w-1/4 flex flex-col justify-center items-center bg-white p-8 lg:p-12 shadow-2xl z-20">
                <div className="w-full max-w-sm space-y-8">
                    <div className="lg:hidden mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pothole Detection</h1>
                        <p className="text-gray-500">Intelligent road maintenance.</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-gray-600 text-sm font-medium uppercase tracking-wider">Get Started Now</p>
                        <button
                            onClick={() => navigate('/auth')}
                            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30"
                        >
                            <span className="flex items-center">
                                Get Started
                                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>

                    <div className="pt-8 text-center text-xs text-gray-400">
                        © 2026 Pothole Detection System
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;
