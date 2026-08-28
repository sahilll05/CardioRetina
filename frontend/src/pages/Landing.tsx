import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Landing() {
  return (
    <div className="min-h-screen bg-black font-sans text-slate-300">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-green-900/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-green-900 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-green-500">CardioRetina</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-400 hover:text-green-400 transition-colors"
            >
              Sign In
            </Link>
            <Button asChild className="bg-green-600 hover:bg-green-700 text-black shadow-md border-0">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-16">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-green-900/30 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full bg-green-800/20 blur-3xl"
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight"
          >
            Future of <br />
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Cardiovascular Screening
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Instant, non-invasive AI cardiovascular risk assessment directly from a single retinal image.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-black font-semibold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-green-900/30 border-0"
            >
              <Link to="/login">
                Start Analysis <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-slate-600 py-8 border-t border-green-900/20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 opacity-80">
            <HeartPulse className="w-4 h-4 text-green-700" />
            <span className="text-slate-500 font-semibold text-sm">CardioRetina</span>
          </div>
          <p className="text-sm text-center">
            Developed by Sahil Powar.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/login" className="hover:text-green-500 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
