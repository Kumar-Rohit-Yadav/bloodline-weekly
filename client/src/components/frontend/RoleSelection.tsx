"use client";

import { Droplet, Heart, Shield, Hospital, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/utils/utils";

interface RoleOption {
    id: string;
    title: string;
    desc: string;
    icon: React.ElementType;
}

interface RoleSelectionProps {
    selectedRole: string;
    onSelect: (roleId: string) => void;
}

const roles: RoleOption[] = [
    {
        id: "donor",
        title: "Donor",
        desc: "I want to save lives by donating blood",
        icon: Heart,
    },
    {
        id: "receiver",
        title: "Receiver",
        desc: "I'm looking for blood for myself or a patient",
        icon: Droplet,
    },
    {
        id: "hospital",
        title: "Hospital",
        desc: "An institution managing blood requests",
        icon: Hospital,
    },
];

export const RoleSelection = ({ selectedRole, onSelect }: RoleSelectionProps) => {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;

                return (
                    <Card
                        key={role.id}
                        onClick={() => onSelect(role.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-300 border-2 overflow-hidden group",
                            isSelected
                                ? "border-[#FF1744] bg-red-50/30 ring-4 ring-red-50"
                                : "border-gray-100 hover:border-[#FF1744]/30 hover:bg-gray-50/50"
                        )}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={cn(
                                    "p-3 rounded-2xl transition-colors shrink-0",
                                    isSelected ? "bg-[#FF1744] text-white" : "bg-gray-100 text-gray-500 group-hover:text-[#FF1744]"
                                )}>
                                    <Icon size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className={cn(
                                        "font-bold transition-colors",
                                        isSelected ? "text-[#FF1744]" : "text-gray-900"
                                    )}>
                                        {role.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {role.desc}
                                    </p>
                                </div>
                            </div>

                            {isSelected && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-[#FF1744] rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                                    <Check size={14} className="text-white" strokeWidth={3} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
