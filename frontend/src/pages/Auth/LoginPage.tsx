import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { HeartPulse, Eye, EyeOff, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/auth/authStore';
import {
  verifyCredentials,
  generateSessionToken,
  SESSION_TTL,
  REMEMBER_ME_TTL,
} from '@/auth/credentials';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

type LoginFormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any,
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  const onSubmit = async (data: Record<string, any>) => {
    const { email, password, rememberMe } = data as LoginFormData;
    setIsLoading(true);
    setAuthError(null);

    try {
      // Simulate a short network delay for UX
      await new Promise((r) => setTimeout(r, 600));

      const user = await verifyCredentials(email, password);

      if (!user) {
        setAuthError('Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      const ttl = rememberMe ? REMEMBER_ME_TTL : SESSION_TTL;
      const expiresAt = Date.now() + ttl;
      const token = generateSessionToken(user.id, expiresAt);

      login(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          specialization: user.specialization,
        },
        token,
        expiresAt,
        rememberMe
      );

      navigate(from, { replace: true });
    } catch {
      setAuthError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">CardioRetina AI</h1>
            <p className="text-blue-100 text-sm mt-1">Clinical Access Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1">
                Sign in to your clinical account to continue.
              </p>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{authError}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="dr.name@clinic.com"
                    className="pl-10 h-11 border-slate-200 focus-visible:ring-blue-500"
                    {...register('email')}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 border-slate-200 focus-visible:ring-blue-500"
                    {...register('password')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-3">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded cursor-pointer"
                  {...register('rememberMe')}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-slate-600 text-sm font-normal cursor-pointer"
                >
                  Keep me signed in for 7 days
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 border-0 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo credentials notice */}
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs text-slate-600 font-mono">
                <p>dr.sarah@cardioretina.ai</p>
                <p>CardioRetina@2025</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <Link
              to="/"
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </motion.div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          Access is restricted to authorized clinical staff only.
          <br />
          For support, contact your system administrator.
        </p>
      </div>
    </div>
  );
}
