
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { potholeApi, Severity, Status } from '../services/potholeApi';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { FAKE_STATS } from '../utils/potholeUtils';
import GovernmentManagementPanel from '../components/GovernmentManagementPanel';

// Toggle for fake data - set to true to use test data
const USE_FAKE_DATA = true;

const COLORS = {
  low: '#22c55e',
  medium: '#f97316',
  high: '#ef4444',
  open: '#ef4444',
  in_progress: '#fbbf24',
  fixed: '#22c55e',
};

const Dashboard = () => {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data: apiStats, isLoading, error } = useQuery({
    queryKey: ['potholeStats', severityFilter, statusFilter, startDate, endDate],
    queryFn: () =>
      potholeApi.getPotholeStats({
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !USE_FAKE_DATA, // Only fetch if not using fake data
  });

  // Use fake stats if enabled, otherwise use API stats
  const stats = USE_FAKE_DATA ? FAKE_STATS : apiStats || FAKE_STATS;

  const severityData = stats?.severity_count
    ? [
        { name: 'Low', value: stats.severity_count.low, color: COLORS.low },
        {
          name: 'Medium',
          value: stats.severity_count.medium,
          color: COLORS.medium,
        },
        { name: 'High', value: stats.severity_count.high, color: COLORS.high },
      ]
    : [];

  const statusData = stats?.status_count
    ? [
        { name: 'Open', value: stats.status_count.open, color: COLORS.open },
        {
          name: 'In Progress',
          value: stats.status_count.in_progress,
          color: COLORS.in_progress,
        },
        { name: 'Fixed', value: stats.status_count.fixed, color: COLORS.fixed },
      ]
    : [];

  const barChartData = stats?.severity_count
    ? [
        { name: 'Low', count: stats.severity_count.low },
        { name: 'Medium', count: stats.severity_count.medium },
        { name: 'High', count: stats.severity_count.high },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {USE_FAKE_DATA && (
            <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
              🧪 Using Fake Test Data
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading && !USE_FAKE_DATA ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Potholes Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    📍 Total Potholes
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.total_count || 0}
                  </p>
                </div>
                <div className="text-4xl">🕳️</div>
              </div>
            </div>

            {/* High Severity Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    High Severity
                  </h3>
                  <p className="text-3xl font-bold text-red-600">
                    {stats?.severity_count?.high || 0}
                  </p>
                </div>
                <div className="text-4xl text-red-600">🔴</div>
              </div>
            </div>

            {/* Open Status Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Open Status
                  </h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats?.status_count?.open || 0}
                  </p>
                </div>
                <div className="text-4xl text-orange-600">⚠️</div>
              </div>
            </div>
          </div>

          {/* Severity Breakdown Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 Severity Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium mb-1">High</p>
                <p className="text-2xl font-bold text-red-700">
                  {stats?.severity_count?.high || 0}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium mb-1">Medium</p>
                <p className="text-2xl font-bold text-orange-700">
                  {stats?.severity_count?.medium || 0}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium mb-1">Low</p>
                <p className="text-2xl font-bold text-green-700">
                  {stats?.severity_count?.low || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Status Breakdown Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚙ Status Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium mb-1">Open</p>
                <p className="text-2xl font-bold text-red-700">
                  {stats?.status_count?.open || 0}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium mb-1">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-yellow-700">
                  {stats?.status_count?.in_progress || 0}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium mb-1">Fixed</p>
                <p className="text-2xl font-bold text-green-700">
                  {stats?.status_count?.fixed || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution - Pie Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Severity Distribution
              </h3>
              {severityData.length > 0 && severityData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">No data available</p>
              )}
            </div>

            {/* Status Distribution - Pie Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Status Distribution
              </h3>
              {statusData.length > 0 && statusData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-12">No data available</p>
              )}
            </div>
          </div>

          {/* Severity Bar Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Severity Count
            </h3>
            {barChartData.length > 0 && barChartData.some((d) => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0ea5e9">
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name.toLowerCase() as Severity]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No data available</p>
            )}
          </div>

          <GovernmentManagementPanel />
        </>
      )}
    </div>
  );
};

export default Dashboard;
