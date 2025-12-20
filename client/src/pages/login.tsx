import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Car, Lock, Mail, Zap, Users, TrendingUp } from 'lucide-react';

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: 'Please enter email and password', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.user);
      toast({ title: 'Login successful!' });
      setLocation('/');
    } catch (error: any) {
      toast({ 
        title: error.message || 'Login failed', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/garage-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-0" />

      {/* Login Dialog */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">AutoGarage</h1>
                <p className="text-white/80 text-xs">CRM System</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold font-display">Welcome Back</h2>
            <p className="text-white/90 text-sm mt-2">Sign in to your garage management account</p>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@autogarage.com"
                    className="pl-12 h-11 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:ring-offset-0 transition-all bg-white dark:bg-slate-800"
                    data-testid="input-email"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-11 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:ring-offset-0 transition-all bg-white dark:bg-slate-800"
                    data-testid="input-password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all hover:shadow-lg hover:shadow-red-600/40"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-xs text-muted-foreground">
                Demo Credentials:<br />
                <span className="font-semibold text-foreground">Autogarage@system.com</span><br />
                <span className="font-semibold text-foreground">Autogarage</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-muted-foreground">
            <p>© 2025 AutoGarage CRM. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
