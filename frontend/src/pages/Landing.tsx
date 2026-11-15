import { Link } from 'react-router-dom';
import { HeartPulse, ArrowRight, ShieldCheck, Activity, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-surface-deep sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-border-strong bg-surface flex items-center justify-center text-primary">
              <HeartPulse className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">CardioRetina</span>
            <span className="hidden sm:inline-block text-xs text-muted-foreground border-l border-border pl-3">
              Clinical Retinal Diagnostics
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Sign In
            </Link>
            <Button asChild size="sm" className="text-xs">
              <Link to="/login">
                Access Portal
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="border-b border-border bg-surface-deep/40 py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-border bg-surface text-xs text-muted-foreground mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-ok" />
              <span>Ophthalmic Microvascular Biomarker Pipeline</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-foreground text-balance max-w-3xl mx-auto">
              Cardiovascular risk from retinal fundus imaging.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
              Non-invasive biomarker extraction, vessel segmentation, and diabetic retinopathy grading in seconds.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-6 text-sm font-medium">
                <Link to="/login">
                  Enter Clinical Portal
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6 text-sm">
                <a href="#pipeline">Diagnostic Pipeline</a>
              </Button>
            </div>
          </div>
        </section>

        {/* 4-Stage Diagnostic Pipeline Architecture */}
        <section id="pipeline" className="py-16 px-6 max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-xl sm:text-2xl font-medium text-foreground">
              Sequential Neural Architecture
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              Four specialized neural networks operate in sequential isolation to minimize memory footprint while maximizing diagnostic specificity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-cool">Stage 01</span>
                <span>Gatekeeper</span>
              </div>
              <h3 className="text-sm font-medium text-foreground">Quality Assessment</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                MobileNetV3 filters out artifacts, uneven illumination, and motion blur before computing downstream vascular metrics.
              </p>
              <div className="pt-2 border-t border-border font-mono text-[11px] text-muted-foreground flex justify-between">
                <span>Threshold</span>
                <span className="text-foreground">SNR &gt; 0.60</span>
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-cool">Stage 02</span>
                <span>Morphometry</span>
              </div>
              <h3 className="text-sm font-medium text-foreground">Vessel Segmentation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                U-Net++ delineates full retinal vasculature down to tertiary arterioles and venules with dense skip connections.
              </p>
              <div className="pt-2 border-t border-border font-mono text-[11px] text-muted-foreground flex justify-between">
                <span>Resolution</span>
                <span className="text-foreground">512 × 512 px</span>
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-cool">Stage 03</span>
                <span>Classification</span>
              </div>
              <h3 className="text-sm font-medium text-foreground">Artery / Vein Delineation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-class segmentation distinguishes arterial narrowing from venous dilation to compute the arteriolar-to-venular ratio.
              </p>
              <div className="pt-2 border-t border-border font-mono text-[11px] text-muted-foreground flex justify-between">
                <span>Biomarker</span>
                <span className="text-foreground">A/V Ratio (0.65–0.80)</span>
              </div>
            </div>

            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-cool">Stage 04</span>
                <span>Screening</span>
              </div>
              <h3 className="text-sm font-medium text-foreground">Diabetic Retinopathy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                EfficientNet-B3 grades diabetic microaneurysms and exudates across 5 international clinical severity levels.
              </p>
              <div className="pt-2 border-t border-border font-mono text-[11px] text-muted-foreground flex justify-between">
                <span>Classification</span>
                <span className="text-foreground">Grades 0 to 4</span>
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Interface Showcase */}
        <section className="border-t border-border bg-surface-deep/30 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="panel overflow-hidden border-border-strong">
              <div className="panel-header flex items-center justify-between bg-surface">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Activity className="w-4 h-4 text-primary" />
                  <span>Clinical Telemetry &amp; Analysis Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-ok" />
                  <span className="text-xs font-mono text-muted-foreground">Ready</span>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-foreground">Instant Retinal Telemetry</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Designed for cardiologists and ophthalmologists to rapidly review segmented retinal vasculature and systemic cardiovascular risk profiles.
                  </p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" />
                      <span>Quantitative tortuosity index &amp; branching angle</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" />
                      <span>Interactive vessel overlay comparison slider</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" />
                      <span>Single-click clinical PDF report generation</span>
                    </li>
                  </ul>
                  <div className="pt-4">
                    <Button asChild size="sm" variant="secondary">
                      <Link to="/login">Open Clinical Console</Link>
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-2 panel-deep p-4 flex flex-col justify-center items-center">
                  <img
                    src="images/analysis.png"
                    alt="CardioRetina Clinical Interface"
                    className="rounded border border-border w-full object-cover max-h-[380px]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    Interactive vessel segmentation viewer and automated biomarker telemetry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-deep py-6 px-6 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">CardioRetina</span>
            <span>&copy; {new Date().getFullYear()} Sahil Powar.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors duration-150">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
