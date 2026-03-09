import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { motion } from 'framer-motion';

const ThemeToggle = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm ${className}`}
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? (
                <Moon size={18} className="transition-transform duration-300" />
            ) : (
                <Sun size={18} className="transition-transform duration-300 text-amber-400" />
            )}
        </motion.button>
    );
};

export default ThemeToggle;
