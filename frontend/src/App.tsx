import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { GovernmentProvider } from './context/GovernmentContext';
import AppRouter from './router/AppRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GovernmentProvider>
            <AppRouter />
            <Toaster position="top-right" richColors />
          </GovernmentProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

