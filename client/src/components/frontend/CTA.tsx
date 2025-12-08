import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const CTA = () => {
    return (
        <section className="py-24 px-4">
            <div className="max-w-7xl mx-auto bg-[#FF1744] rounded-[48px] p-16 sm:p-24 relative overflow-hidden shadow-2xl shadow-red-300">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />

                <div className="relative z-10 text-center space-y-10">
                    <h2 className="text-5xl sm:text-6xl font-black text-white tracking-widest leading-tight">
                        Ready to Make a Difference?
                    </h2>
                    <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto border-t border-white/20 pt-8 mt-8">
                        Join thousands of donors and hospitals using BloodLine to save lives every day.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6 pt-6">
                        <Link to="/register">
                            <Button className="bg-white text-[#FF1744] hover:bg-gray-50 text-xl font-bold px-12 py-8 rounded-2xl flex items-center gap-2 shadow-2xl h-auto">
                                Get Started Today
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-xl font-bold px-12 py-8 rounded-2xl shadow-xl h-auto">
                                Register as Hospital
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};
