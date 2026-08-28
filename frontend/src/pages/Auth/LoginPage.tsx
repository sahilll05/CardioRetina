import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/auth/authStore';
import {
  verifyCredentials,
  registerUser,
  generateSessionToken,
  SESSION_TTL,
  REMEMBER_ME_TTL,
} from '@/auth/credentials';

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
  rememberMe: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.confirmPassword !== undefined && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });
  }
});

type AuthFormData = {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema) as any,
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', rememberMe: false },
  });

  const rememberMe = watch('rememberMe');

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setAuthError(null);
    reset({ name: '', email: '', password: '', confirmPassword: '', rememberMe: false });
  };

  const onSubmit = async (data: Record<string, any>) => {
    const { name, email, password, rememberMe } = data as AuthFormData;
    setIsLoading(true);
    setAuthError(null);

    try {
      // Simulate a short network delay for UX
      await new Promise((r) => setTimeout(r, 600));

      let user;

      if (isRegistering) {
        if (!name || name.trim() === '') {
          setAuthError('Name is required for registration.');
          setIsLoading(false);
          return;
        }
        try {
          user = await registerUser(name, email, password);
        } catch (e: any) {
          setAuthError(e.message || 'Registration failed.');
          setIsLoading(false);
          return;
        }
      } else {
        user = await verifyCredentials(email, password);
        if (!user) {
          setAuthError('Invalid email or password. Please try again.');
          setIsLoading(false);
          return;
        }
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
        rememberMe || false
      );

      navigate(from, { replace: true });
    } catch {
      setAuthError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-green-900/20 blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full bg-green-800/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black border border-green-900/30 rounded-2xl shadow-2xl shadow-green-900/20 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-900 px-8 py-8 text-center border-b border-green-900/50">
            <div className="w-14 h-14 rounded-2xl bg-black/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <HeartPulse className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">CardioRetina AI</h1>
            <p className="text-green-100 text-sm mt-1 opacity-80">Clinical Access Portal</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-200">
                {isRegistering ? 'Create Account' : 'Welcome back'}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {isRegistering
                  ? 'Register for a clinical account to continue.'
                  : 'Sign in to your clinical account to continue.'}
              </p>
            </div>

            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-xl mb-6"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{authError}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <AnimatePresence>
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <Label htmlFor="name" className="text-slate-300 font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Dr. Sarah Johnson"
                        className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-slate-600"
                        {...register('name')}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="dr.name@clinic.com"
                    className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-slate-600"
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
                <Label htmlFor="password" className="text-slate-300 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-slate-600"
                    {...register('password')}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-green-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <AnimatePresence>
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden pt-1"
                  >
                    <Label htmlFor="confirmPassword" className="text-slate-300 font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 h-11 bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-green-500 focus-visible:border-green-500 placeholder:text-slate-600"
                        {...register('confirmPassword')}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember Me (Only on login) */}
              {!isRegistering && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    className="w-4 h-4 bg-slate-950 border-slate-700 text-green-600 rounded cursor-pointer focus:ring-green-500 focus:ring-offset-black"
                    {...register('rememberMe')}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-slate-400 text-sm font-normal cursor-pointer hover:text-slate-300"
                  >
                    Keep me signed in for 7 days
                  </Label>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-black font-semibold rounded-xl shadow-lg shadow-green-900/30 border-0 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isRegistering ? 'Creating account...' : 'Signing in...'}
                  </>
                ) : isRegistering ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-sm text-green-500 hover:text-green-400 font-medium transition-colors"
              >
                {isRegistering
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Register"}
              </button>
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

        <p className="text-center text-green-500/50 text-xs mt-6">
          Access is restricted to authorized clinical staff only.
          <br />
          For support, contact your system administrator.
        </p>
      </div>
    </div>
  );
}
