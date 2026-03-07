"use client";

import { motion } from "framer-motion";

interface SportProgressBarProps {
    current: number;
    total: number;
}

export function SportProgressBar({ current, total }: SportProgressBarProps) {
    const percentage = Math.min((current / total) * 100, 100);
    const isPassed = current >= total;

    return (
        <div className="w-full flex-col flex items-center mb-8">
            <div className="flex justify-between w-full max-w-md mb-2 items-end">
                <span className="text-gray-600 font-medium text-sm tracking-wide uppercase">
                    This Week's Activities
                </span>
                <span
                    className={`font-bold text-lg ${isPassed ? "text-success" : "text-primary"
                        }`}
                >
                    {current} / {total}
                </span>
            </div>

            <div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full absolute left-0 top-0 flex items-center justify-end pr-2 overflow-hidden ${isPassed ? "bg-success" : "bg-primary"
                        }`}
                />
            </div>

            {isPassed && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-success font-bold flex items-center gap-1"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Weekly Goal Passed!
                </motion.p>
            )}
        </div>
    );
}
