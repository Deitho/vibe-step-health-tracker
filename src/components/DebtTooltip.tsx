"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DebtTooltipProps {
    debt: number;
}

export function DebtTooltip({ debt }: DebtTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative ml-2 inline-flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            <div className="cursor-pointer text-warning bg-warning/10 p-1 rounded-full animate-pulse transition-colors hover:bg-warning/20">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>

            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl"
                    >
                        <div className="font-semibold mb-1 text-warning">Eksik Adım Borcu</div>
                        <p>Bu günü tamamlamak için <strong className="text-white">{debt.toLocaleString('tr-TR')}</strong> adım daha atmanız gerekiyor.</p>

                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
