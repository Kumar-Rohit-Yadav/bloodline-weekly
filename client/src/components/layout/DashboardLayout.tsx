import { Outlet } from 'react-router-dom';
import { DashboardNavbar } from './DashboardNavbar';

export const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <DashboardNavbar />
            <div className="animate-in fade-in duration-500">
                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
