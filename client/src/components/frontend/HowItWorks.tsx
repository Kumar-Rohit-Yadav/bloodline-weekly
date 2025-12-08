"use client";

export const HowItWorks = () => {
    const steps = [
        {
            number: "1",
            title: "Register",
            desc: "Create your account and complete verification",
        },
        {
            number: "2",
            title: "Set Profile",
            desc: "Add blood type, location, and availability",
        },
        {
            number: "3",
            title: "Get Matched",
            desc: "Our system matches you with compatible requests",
        },
        {
            number: "4",
            title: "Save Lives",
            desc: "Connect, communicate, and donate",
        },
    ];

    return (
        <section id="how-it-works" className="py-32">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-24 space-y-4">
                    <h2 className="text-5xl font-black text-[#1A1A1A] tracking-tighter">How BloodLine Works</h2>
                    <p className="text-lg text-gray-500 font-medium">
                        Simple steps to connect donors with those who need blood.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-16 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden lg:block absolute top-[60px] left-32 right-32 h-0.5 bg-gray-100 -z-10" />

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center space-y-8 group">
                            <div className="w-20 h-20 rounded-full bg-[#FF1744] text-white text-3xl font-black flex items-center justify-center shadow-2xl shadow-red-200 group-hover:scale-110 transition-transform cursor-default">
                                {step.number}
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{step.title}</h3>
                                <p className="text-gray-500 font-medium leading-relaxed max-w-[200px] mx-auto text-sm">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
