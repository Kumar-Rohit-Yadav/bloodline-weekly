import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import CreateRequestPage from './pages/CreateRequestPage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CommunicationsCenter from './pages/CommunicationsCenter';
import ManageInventoryPage from './pages/ManageInventoryPage';
import RequestDonationPage from './pages/RequestDonationPage';
import ActivityHistoryPage from './pages/ActivityHistoryPage';
import BloodBankExplorerPage from './pages/BloodBankExplorerPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import RequestManagementPage from './pages/admin/RequestManagementPage';
import ProfileReviewPage from './pages/admin/ProfileReviewPage';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Private Route Guard
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="p-8 rounded-full border-4 border-[#FF1744] border-t-transparent animate-spin" />
            </div>
        );
    }

    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Guard (redirect to dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) return null;

    return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function App() {
    return (
        <>
            <Toaster position="top-center" richColors closeButton />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
                    <Route index element={<DashboardPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="create-request" element={<CreateRequestPage />} />
                    <Route path="messages" element={<CommunicationsCenter />} />
                    <Route path="inventory" element={<ManageInventoryPage />} />
                    <Route path="request-blood" element={<RequestDonationPage />} />
                    <Route path="explorer" element={<BloodBankExplorerPage />} />
                    <Route path="history" element={<ActivityHistoryPage />} />
                    <Route path="book-appointment" element={<BookAppointmentPage />} />
                    {/* Admin Management Routes */}
                    <Route path="users" element={<UserManagementPage />} />
                    <Route path="requests" element={<RequestManagementPage />} />
                    <Route path="reviews" element={<ProfileReviewPage />} />
                </Route>
                <Route path="/complete-profile" element={<PrivateRoute><CompleteProfilePage /></PrivateRoute>} />

                {/* Catch all - Redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
