import React from 'react';

const GovDashboard: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Government Agency Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-700">Open Reports</h2>
                    <p className="text-3xl font-bold text-blue-600 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-700">Assignments Pending</h2>
                    <p className="text-3xl font-bold text-orange-600 mt-2">--</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-700">Repairs Completed</h2>
                    <p className="text-3xl font-bold text-green-600 mt-2">--</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <div className="bg-white rounded-lg shadow h-64 flex items-center justify-center text-gray-400">
                    Activity feed placeholder
                </div>
            </div>
        </div>
    );
};

export default GovDashboard;
