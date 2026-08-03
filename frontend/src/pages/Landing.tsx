import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Eye,
  Zap,
  Shield,
  Clock,
  ChevronRight,
  Activity,
  Brain,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

function StatPill({ value, label, valueClassName }: { value: string; label: string; valueClassName?: string }) {
  return (
    <motion.div
      variants={{ initial: { opacity: 0, scale: 0.9 }, whileInView: { opacity: 1, scale: 1 } }}
      className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-center"
    >
      <span className={`font-bold text-white tracking-tight break-words ${valueClassName || 'text-3xl lg:text-4xl'}`}>{value}</span>
      <span className="text-xs sm:text-sm text-blue-200 mt-1">{label}</span>
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <motion.div
      variants={{ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 } }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 flex flex-col gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

const pipelineSteps = [
  { step: '01', title: 'Image Quality Check', desc: 'MobileNetV3 validates image is gradable' },
  { step: '02', title: 'Vessel Segmentation', desc: 'U-Net++ maps all retinal blood vessels' },
  { step: '03', title: 'A/V Classification', desc: 'Separates arteries from veins' },
  { step: '04', title: 'Biomarker Extraction', desc: 'AVR, density, tortuosity, branching angle' },
  { step: '05', title: 'Disease Screening', desc: 'EfficientNet-B3 grades DR severity 0–4' },
  { step: '06', title: 'Risk Assessment', desc: 'Scores combine biomarkers + clinical data' },
  { step: '07', title: 'PDF Report', desc: 'Full clinical report ready in minutes' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">CardioRetina AI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 pt-16">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute -bottom-60 -left-40 w-[700px] h-[700px] rounded-full bg-cyan-500/20 blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-sm font-medium mb-8"
          >
            <Zap className="w-4 h-4" />
            AI-Powered Cardiovascular Risk Assessment
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight"
          >
            See Your Heart's
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Future in Your Eye
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed"
          >
            The retina is the only place in the human body where blood vessels can be viewed
            non-invasively. Our 4-model deep learning pipeline assesses cardiovascular risk
            from a single retinal image — no blood draws, in under 5 minutes.
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
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-blue-500/30 border-0"
            >
              <Link to="/login">
                Start Analysis <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <a
              href="#features"
              className="text-blue-300 hover:text-white transition-colors font-medium flex items-center gap-2"
            >
              Learn How It Works
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            {...stagger}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto"
          >
            <StatPill value="~5 min" label="Full Analysis Time" />
            <StatPill value="4" label="AI Models in Pipeline" />
            <StatPill value="LOW/MOD/HIGH" label="Risk Score Output" valueClassName="text-xl sm:text-2xl lg:text-3xl" />
            <StatPill value="Grade 0–4" label="DR Severity Detection" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40"
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <motion.div {...fadeUp} className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800">
            Why CardioRetina AI?
          </h2>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
            Clinical-grade cardiovascular assessment in a fraction of the time and cost.
          </p>
        </motion.div>

        <motion.div
          {...stagger}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <FeatureCard
            icon={Eye}
            title="Non-Invasive Analysis"
            description="No blood draws or invasive procedures. Just a high-quality retinal fundus photograph is all you need."
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <FeatureCard
            icon={Brain}
            title="4-Model Deep Learning"
            description="Quality check, vessel segmentation, A/V classification, and EfficientNet-B3 disease screening work in sequence."
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <FeatureCard
            icon={Clock}
            title="Results in 5 Minutes"
            description="Traditional cardiovascular assessment takes days and costs thousands. Our AI delivers results in minutes."
            color="bg-gradient-to-br from-cyan-500 to-cyan-600"
          />
          <FeatureCard
            icon={Activity}
            title="Retinal Biomarkers"
            description="Measures A/V ratio, vessel density, tortuosity, and branching angle — all proven cardiovascular risk indicators."
            color="bg-gradient-to-br from-rose-500 to-rose-600"
          />
          <FeatureCard
            icon={Shield}
            title="Secure & Private"
            description="All patient data is stored in your private database. No data leaves your infrastructure."
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <FeatureCard
            icon={FileText}
            title="Clinical PDF Reports"
            description="Every analysis produces a detailed PDF report with all biomarkers, risk reasoning, and actionable recommendations."
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </motion.div>
      </section>

      {/* AI Pipeline Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-blue-950">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white">The 7-Step AI Pipeline</h2>
            <p className="text-blue-300 mt-4 text-lg max-w-2xl mx-auto">
              Every retinal image passes through a sequential pipeline of specialized deep learning models.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineSteps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col gap-2"
              >
                <span className="text-3xl font-black text-blue-400/50">{s.step}</span>
                <h3 className="text-white font-semibold">{s.title}</h3>
                <p className="text-blue-300 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Biomarkers Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeUp}>
            <h2 className="text-4xl font-bold text-slate-800 mb-6">
              Clinically Validated Biomarkers
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              The retinal microvasculature shares the same embryonic origin as coronary and
              cerebral vessels. Changes visible here mirror what is happening throughout the
              entire cardiovascular system — often years before symptoms appear.
            </p>
            <div className="space-y-4">
              {[
                { label: 'A/V Ratio', range: '0.65–0.80', meaning: 'Low → narrowed arteries → hypertension' },
                { label: 'Vessel Tortuosity', range: '1.0–1.2', meaning: 'High → diabetic or hypertensive retinopathy' },
                { label: 'Vessel Density', range: '10%–15%', meaning: 'Low → ischemia; High → neovascularization' },
                { label: 'Branching Angle', range: '85°–95°', meaning: 'Abnormal → vascular remodeling' },
              ].map((b) => (
                <div key={b.label} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">{b.label}</span>
                    <span className="text-slate-400 text-sm ml-2">Normal: {b.range}</span>
                    <p className="text-slate-500 text-sm mt-0.5">{b.meaning}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="relative">
            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl">
              <h3 className="text-2xl font-bold mb-6">Cost Comparison</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-blue-200">Traditional (blood tests + ECG)</span>
                    <span className="font-bold">Days–Weeks / $500–$5,000+</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full">
                    <div className="h-full w-full bg-red-400/70 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-blue-200">CardioRetina AI</span>
                    <span className="font-bold">~5 Minutes / $50–$200</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full">
                    <div className="h-full w-[15%] bg-green-400 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black">95%</div>
                  <div className="text-blue-200 text-sm">Cost Reduction</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black">100×</div>
                  <div className="text-blue-200 text-sm">Faster Results</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-cyan-600">
        <motion.div {...fadeUp} className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Cardiovascular Care?
          </h2>
          <p className="text-blue-100 text-lg mb-10">
            Join clinicians using CardioRetina AI to detect risk before it becomes a crisis.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-10 py-6 text-lg rounded-xl shadow-2xl"
          >
            <Link to="/login">
              Sign In to Your Clinic <ChevronRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">CardioRetina AI</span>
          </div>
          <p className="text-sm text-center">
            Developed by <strong>Sahil Powar</strong>. For research and educational use.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <a href="mailto:support@cardioretina.ai" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
