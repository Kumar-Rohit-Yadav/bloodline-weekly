import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/frontend/Navbar";
import { Hero } from "@/components/frontend/Hero";
import { Features } from "@/components/frontend/Features";
import { HowItWorks } from "@/components/frontend/HowItWorks";
import { CTA } from "@/components/frontend/CTA";
import { Footer } from "@/components/frontend/Footer";

export default function HomePage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="p-8 rounded-full border-4 border-[#FF1744] border-t-transparent animate-spin" />
            </div>
        );
    }

    // Only show landing page if NOT logged in
    if (user) return null;

    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <Hero />
            <Features />
            <HowItWorks />
            <CTA />
            <Footer />
        </main>
    );
}
