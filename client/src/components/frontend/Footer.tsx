import { Link } from "react-router-dom";
import { Droplet } from "lucide-react";

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
                    {/* Brand */}
                    <div className="space-y-6 lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-[#FF1744] p-2 rounded-xl">
                                <Droplet className="text-white w-6 h-6 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase transition-colors group-hover:text-[#FF1744]">BloodLine</span>
                        </Link>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-xs text-left">
                            Smart Blood Donation System connecting donors with those in need.
                        </p>
                    </div>

                    {/* Platform */}
                    <div className="space-y-6 text-left">
                        <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest underline decoration-[#FF1744] decoration-2 underline-offset-8">Platform</h4>
                        <ul className="space-y-4">
                            <li><Link to="/register" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Become a Donor</Link></li>
                            <li><Link to="/register" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Request Blood</Link></li>
                            <li><Link to="/register" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Hospital Registration</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-6 text-left">
                        <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest underline decoration-[#FF1744] decoration-2 underline-offset-8">Resources</h4>
                        <ul className="space-y-4">
                            <li><Link to="#" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Help Center</Link></li>
                            <li><Link to="#" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Blood Types Guide</Link></li>
                            <li><Link to="#" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Donation FAQs</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="space-y-6 text-left">
                        <h4 className="text-sm font-black text-[#1A1A1A] uppercase tracking-widest underline decoration-[#FF1744] decoration-2 underline-offset-8">Legal</h4>
                        <ul className="space-y-4">
                            <li><Link to="#" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="#" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Terms of Service</Link></li>
                            <li><Link to="#" className="text-sm text-gray-500 font-bold hover:text-[#FF1744] transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        © {currentYear} BloodLine. All rights reserved. Developed by <span className="text-[#1A1A1A]">Rohit Kumar Yadav</span>.
                    </p>
                </div>
            </div>
        </footer>
    );
};
