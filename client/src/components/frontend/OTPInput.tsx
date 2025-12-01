"use client";

import React, { useRef, useState, useEffect } from 'react';

interface OTPInputProps {
    value: string;
    onChange: (value: string) => void;
    length?: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({ value, onChange, length = 6 }) => {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Handle external value changes if needed
        if (value === "") {
            setOtp(new Array(length).fill(""));
        }
    }, [value, length]);

    const handleChange = (index: number, val: string) => {
        if (isNaN(Number(val)) && val !== "") return;

        const newOtp = [...otp];
        // Only take the last character if someone pastes
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        // Combine and send to parent
        const combinedOtp = newOtp.join("");
        onChange(combinedOtp);

        // Auto-focus next input
        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace - move to previous box
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text").trim();
        if (data.length !== length || isNaN(Number(data))) return;

        const pasteData = data.split("");
        setOtp(pasteData);
        onChange(data);
        inputRefs.current[length - 1]?.focus();
    };

    return (
        <div className="flex justify-between gap-2 sm:gap-4 max-w-sm mx-auto">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 border-gray-100 focus:border-[#FF1744] focus:ring-4 focus:ring-red-50 outline-none transition-all duration-300 bg-white shadow-sm hover:border-red-100"
                />
            ))}
        </div>
    );
};
