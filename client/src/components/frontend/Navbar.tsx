import { Link } from "react-router-dom";
import { Droplet } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const Navbar = () => {
    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-[#FF1744] p-2 rounded-xl group-hover:scale-110 transition-transform shadow-lg shadow-red-100">
                            <Droplet className="text-white w-6 h-6 fill-current" />
                        </div>
                        <span className="text-2xl font-black text-[#1A1A1A] tracking-tighter">BloodLine</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10">
                        <a href="#features" className="text-sm font-bold text-gray-500 hover:text-[#FF1744] transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-bold text-gray-500 hover:text-[#FF1744] transition-colors">How It Works</a>
                        <a href="#about" className="text-sm font-bold text-gray-500 hover:text-[#FF1744] transition-colors">About</a>
                    </div>

                    {/* Auth CTAs */}
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-bold text-[#1A1A1A] hover:text-[#FF1744] transition-colors">Log In</Link>
                        <Link to="/register">
                            <Button className="bg-[#FF1744] hover:bg-[#D50000] text-sm font-black px-6 py-2.5 shadow-lg shadow-red-100 transition-all active:scale-95">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};
