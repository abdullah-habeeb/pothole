import React from 'react';
import AdminPanel from '../AdminPanel'; // Reuse existing panel logic

const AdminDashboard: React.FC = () => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">System Administrator</h1>
            <AdminPanel />
        </div>
    );
};

export default AdminDashboard;
