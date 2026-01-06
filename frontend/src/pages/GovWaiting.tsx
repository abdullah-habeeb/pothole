import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';

const GovWaiting: React.FC = () => {
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [factIndex, setFactIndex] = useState(0);

    const facts = [
        "Potholes cost US drivers approx $3 billion annually in vehicle damage.",
        "The word 'pothole' originates from pottery makers digging into roads for clay.",
        "One third of major US roads are in poor or mediocre condition.",
        "AI can detect potholes with 95% accuracy compared to manual inspection."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex((prev) => (prev + 1) % facts.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Polling for status update
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                if (refreshUser) {
                    await refreshUser();
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        }, 5000);

        return () => clearInterval(pollInterval);
    }, [refreshUser]);

    // Effect to redirect if approved
    useEffect(() => {
        if (user?.isGovernmentAuthorized) {
            navigate('/dashboard'); // Or specific gov dashboard
        }
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-yellow-50 p-4 rounded-full">
                        <ShieldAlert className="w-12 h-12 text-yellow-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization Pending</h1>
                <p className="text-gray-500 mb-6">
                    Your government access request is currently under review by an administrator.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium text-gray-900">{user?.email}</span>
                    </div>
                    <div className="flex justify-between py-2 mt-2">
                        <span className="text-gray-500">Status</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Review
                        </span>
                    </div>
                </div>

                <div className="h-24 flex items-center justify-center mb-8 bg-blue-50 rounded-lg p-4 transition-all duration-500">
                    <div className="text-blue-800 text-sm font-medium italic">
                        "{facts[factIndex]}"
                    </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm mb-8">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking status automatically...</span>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default GovWaiting;
