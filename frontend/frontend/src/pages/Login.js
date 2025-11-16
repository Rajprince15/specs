import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Glasses, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import { useTranslation } from 'react-i18next';
import { trackLogin, setUserId } from '@/utils/analytics';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  // Redirect to home if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', formData);
      toast.success(response.data.message);
      onLogin(response.data.user, response.data.token);
      
      // Track login event
      trackLogin('email');
      if (response.data.user?.id) {
        setUserId(response.data.user.id);
      }
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (email, password, role) => {
    setFormData({ email, password });
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      toast.success(`Logged in as ${role}!`);
      onLogin(response.data.user, response.data.token);
      
      // Track login event
      trackLogin('demo');
      if (response.data.user?.id) {
        setUserId(response.data.user.id);
      }
      
      if (response.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login to Your Account"
        description="Login to your Gee Ess Opticals account to shop premium eyewear, track orders, and manage your profile."
        keywords="login, sign in, account access"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <main id="main-content" className="w-full max-w-md">
          <nav role="navigation" aria-label="Authentication navigation">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8" aria-label="Back to Home">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('common.back')}
          </Link>
          </nav>

        <Card data-testid="login-card" className="glass border-0 shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <Link to="/" className="cursor-pointer transition-transform hover:scale-105" aria-label="Go to Home">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Glasses className="w-8 h-8 text-white" />
                </div>
              </Link>
            </div>
            <CardTitle className="text-3xl font-bold text-center">{t('common.welcome')}</CardTitle>
            <CardDescription className="text-center text-base">
              {t('auth.login')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  data-testid="email-input"
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  data-testid="password-input"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <Button
                data-testid="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg"
              >
                {loading ? `${t('common.loading')}` : t('auth.signIn')}
              </Button>
            </form>
            <div className="mt-6 space-y-4">
              {/* Demo Login Buttons */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 text-center">Quick Demo Login:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleDemoLogin('user@example.com', 'demo123', 'User')}
                    className="h-11 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-semibold"
                  >
                    👤 Login as User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => handleDemoLogin('admin@lenskart.com', 'admin123', 'Admin')}
                    className="h-11 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold"
                  >
                    👨‍💼 Login as Admin
                  </Button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  {t('auth.noAccount')}{' '}
                  <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                    {t('auth.signUp')}
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </main>
      </div>
    </>
  );
};

export default Login;