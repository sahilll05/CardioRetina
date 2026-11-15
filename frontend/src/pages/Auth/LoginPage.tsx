import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Eye, EyeOff, Loader2, Lock, Mail, AlertCircle, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/auth/authStore';
import {
  verifyCredentials,
  registerUser,
  SESSION_TTL,
  REMEMBER_ME_TTL,
} from '@/auth/credentials';

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().optional(),
  rememberMe: z.boolean().optional(),
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
      await new Promise((r) => setTimeout(r, 400));

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
        try {
          const authResult = await verifyCredentials(email, password);
          user = authResult.user;
          const token = authResult.token;

          const ttl = rememberMe ? REMEMBER_ME_TTL : SESSION_TTL;
          const expiresAt = Date.now() + ttl;

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
            !!rememberMe
          );

          navigate(from, { replace: true });
        } catch (e: any) {
          setAuthError(e.message || 'Invalid email or password.');
          setIsLoading(false);
          return;
        }
      }
    } catch {
      setAuthError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="panel border-border-strong overflow-hidden shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-border bg-surface-deep text-center">
            <div className="w-10 h-10 rounded border border-border-strong bg-surface flex items-center justify-center mx-auto mb-3 text-primary">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h1 className="text-base font-semibold text-foreground">CardioRetina</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Clinical Diagnostics Portal</p>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                {isRegistering ? 'Register clinician account' : 'Sign in to workstation'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRegistering
                  ? 'Enter credentials to create your local clinical profile.'
                  : 'Enter your clinical credentials to continue.'}
              </p>
            </div>

            {authError && (
              <div className="flex items-start gap-2.5 p-3 rounded border border-destructive/30 bg-destructive/10 text-xs text-foreground">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p>{authError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
              <AnimatePresence>
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <Label htmlFor="name" className="text-xs text-muted-foreground">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Dr. Sarah Johnson"
                        className="pl-9 h-9 text-xs bg-surface-deep border-border"
                        {...register('name')}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.org"
                    className="pl-9 h-9 text-xs bg-surface-deep border-border"
                    {...register('email')}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-destructive text-[11px] mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9 h-9 text-xs bg-surface-deep border-border font-mono"
                    {...register('password')}
                    autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-[11px] mt-1">{errors.password.message}</p>
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
                    <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-9 h-9 text-xs bg-surface-deep border-border font-mono"
                        {...register('confirmPassword')}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-[11px] mt-1">{errors.confirmPassword.message}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remember Me */}
              {!isRegistering && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    className="w-3.5 h-3.5 bg-surface-deep border-border text-primary rounded cursor-pointer"
                    {...register('rememberMe')}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-xs text-muted-foreground font-normal cursor-pointer hover:text-foreground"
                  >
                    Remember session on this workstation
                  </Label>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 text-xs font-medium mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    {isRegistering ? 'Creating account...' : 'Authenticating...'}
                  </>
                ) : isRegistering ? (
                  'Create Clinician Account'
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {isRegistering
                  ? 'Already registered? Sign in instead.'
                  : 'Need a local testing account? Register here.'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-surface-deep/50 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to overview
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          CardioRetina v1.4.0 · Local Secure Clinical Diagnostics
        </p>
      </div>
    </div>
  );
}
