import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { User, Key, Building2, Briefcase, Mail, Lock, UserCheck } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type UserRole = 'citizen' | 'contractor' | 'government' | 'admin';

const AuthHub: React.FC = () => {
    const navigate = useNavigate();
    const { login, signup } = useAuth();

    // UI State
    const [mode, setMode] = useState<AuthMode>('login');
    const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
    const [isLoading, setIsLoading] = useState(false);

    // Form Hooks
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const roles = [
        { id: 'citizen', label: 'User', icon: User },
        { id: 'contractor', label: 'Contractor', icon: Briefcase },
        { id: 'government', label: 'Government', icon: Building2 },
        { id: 'admin', label: 'Admin', icon: Key },
    ];

    const handleNavigation = (role: string, isAuthorized: boolean = false) => {
        if (role === 'government') {
            if (isAuthorized) {
                navigate('/dashboard/gov');
            } else {
                navigate('/waiting');
            }
        } else if (role === 'contractor') {
            navigate('/dashboard/contractor');
        } else if (role === 'admin') {
            navigate('/dashboard/admin');
        } else {
            navigate('/dashboard');
        }
    };

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            if (mode === 'login') {
                const response = await login(data.email, data.password);
                // We need the user object to know where to redirect. 
                // However, logic implies we should get the user from context after update?
                // Or maybe login should return the user?
                // AuthContext's login returns Promise<void>.
                // But it updates the state.
                // We can fetch the user from the updated context? No, closure staleness.
                // We need login to return the user OR we use a useEffect to redirect when user changes.
                // Using a useEffect for redirect is cleaner.

                // Let's rely on a useEffect to redirect if user is present?
                // Or change login to return user.
                // Changing login to return user is safer for explicit flow.
                // But as a quick fix, I will use window.location.reload() or just fetch user? 
                // Ah, AuthContext login throws if simple error.

                // Better approach: modifying AuthContext to return the user object is best, but touching Context might break other things?
                // No, context function return types are usually flexible.

                // Alternative: Use a side effect.
                // Actually, let's just modify AuthHub to use a useEffect that watches 'isAuthenticated' and 'user'.
            } else {
                // Signup
                const signupData = {
                    ...data,
                    role: selectedRole,
                };

                await signup(signupData);

                // For signup, we know the role locally (selectedRole).
                // But for Government, we know they are not authorized yet.
                if (selectedRole === 'government') {
                    navigate('/waiting');
                    toast.info('Request submitted for approval');
                } else if (selectedRole === 'contractor') {
                    navigate('/dashboard/contractor');
                    toast.success('Account created successfully');
                } else if (selectedRole === 'admin') {
                    navigate('/dashboard/admin');
                    toast.success('Account created successfully');
                } else {
                    navigate('/dashboard');
                    toast.success('Account created successfully');
                }
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Redirect if authenticated
    const { user, isAuthenticated } = useAuth();

    // Using useEffect to handle redirect after login state update
    React.useEffect(() => {
        if (isAuthenticated && user) {
            const isGov = user.role === 'government';
            const isAuthorized = user.isGovernmentAuthorized;

            if (isGov && !isAuthorized) {
                navigate('/waiting');
            } else if (user.role === 'government') {
                navigate('/dashboard/gov');
            } else if (user.role === 'contractor') {
                navigate('/dashboard/contractor');
            } else if (user.role === 'admin') {
                navigate('/dashboard/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [isAuthenticated, user, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-500">
            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                    {/* Left Side: Login - 40% */}
                    <div className={`md:w-5/12 p-8 flex flex-col justify-center transition-all duration-300 ${mode === 'login' ? 'bg-white' : 'bg-gray-50 border-r py-12'}`}>
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                            <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
                        </div>

                        {mode !== 'login' ? (
                            <div className="text-center">
                                <p className="text-gray-600 mb-6">Already have an account?</p>
                                <button
                                    onClick={() => { setMode('login'); reset(); }}
                                    className="w-full py-3 px-4 border border-indigo-600 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 transition-colors"
                                >
                                    Sign In
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email address</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('email', { required: 'Email is required' })}
                                            type="email"
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            {...register('password', { required: 'Password is required' })}
                                            type="password"
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                                >
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </button>

                                <div className="mt-6 text-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">New here?</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('signup'); reset(); }}
                                        className="mt-4 text-indigo-600 hover:text-indigo-500 font-medium"
                                    >
                                        Create an account
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Right Side: Signup Tabs - 60% */}
                    <div className={`md:w-7/12 bg-gray-50 p-8 flex flex-col transition-all duration-300 ${mode === 'signup' ? 'opacity-100' : 'opacity-50 pointer-events-none md:opacity-100 md:pointer-events-none grayscale'}`}>

                        {mode === 'signup' ? (
                            <>
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                                    <p className="text-sm text-gray-500">Select your role to get started</p>
                                </div>

                                {/* Tabs */}
                                <div className="grid grid-cols-4 gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                                    {roles.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => { setSelectedRole(r.id as UserRole); reset(); }}
                                            className={`flex flex-col items-center justify-center py-3 px-1 rounded-lg text-xs font-medium transition-all ${selectedRole === r.id
                                                ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <r.icon className={`h-5 w-5 mb-1 ${selectedRole === r.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            {r.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Signup Form */}
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-grow">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserCheck className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    {...register('name', { required: 'Name is required' })}
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                                                    placeholder="Full Name"
                                                />
                                            </div>
                                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <div className="mt-1 relative rounded-md shadow-sm">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    {...register('email', { required: 'Email is required' })}
                                                    type="email"
                                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                                                    placeholder="you@email.com"
                                                />
                                            </div>
                                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
                                                type="password"
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
                                    </div>

                                    {/* Role Specific Fields */}
                                    {selectedRole === 'contractor' && (
                                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                            <label className="block text-sm font-medium text-orange-800 mb-1">Contractor ID</label>
                                            <input
                                                {...register('contractorId', { required: 'Contractor ID is required' })}
                                                className="focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                                placeholder="e.g. CON-2026-X"
                                            />
                                        </div>
                                    )}

                                    {selectedRole === 'government' && (
                                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                            <label className="block text-sm font-medium text-blue-800 mb-1">Government ID</label>
                                            <input
                                                {...register('governmentId', { required: 'Government ID is required' })}
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                                placeholder="e.g. GOV-DEPT-01"
                                            />
                                            <p className="mt-2 text-xs text-blue-600">
                                                Note: Government access requires manual approval by an administrator.
                                            </p>
                                        </div>
                                    )}

                                    {selectedRole === 'admin' && (
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                            <label className="block text-sm font-medium text-red-800 mb-1">Admin Passkey</label>
                                            <input
                                                {...register('passkey', { required: 'Passkey is required' })}
                                                type="password"
                                                className="focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 border px-3"
                                                placeholder="Admin Secret Key"
                                            />
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${selectedRole === 'admin' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                                                selectedRole === 'government' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' :
                                                    selectedRole === 'contractor' ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' :
                                                        'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                                                }`}
                                        >
                                            {isLoading ? 'Creating Account...' : `Register as ${roles.find(r => r.id === selectedRole)?.label}`}
                                        </button>
                                    </div>

                                </form>
                            </>
                        ) : (
                            // Visual placeholder when not in signup mode
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <Building2 className="w-24 h-24 mb-4 opacity-20" />
                                <p className="text-lg">Select 'Create an account' to sign up</p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthHub;
