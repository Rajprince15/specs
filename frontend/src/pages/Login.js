import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Glasses, ArrowLeft } from 'lucide-react';
import { axiosInstance } from '@/App';
import { toast } from 'sonner';
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
      onLogin(response.data.user, response.data.access_token);
      toast.success(t('auth.loginSuccess'));
      
      // Track login in Google Analytics
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

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoCredentials = {
        email: 'demo@example.com',
        password: 'demo123'
      };
      const response = await axiosInstance.post('/auth/login', demoCredentials);
      onLogin(response.data.user, response.data.access_token);
      toast.success('Logged in with demo account');
      
      // Track demo login in Google Analytics
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
        title={t('auth.login')}
        description="Login to your Gee Ess Opticals account to access your cart, wishlist, and order history. Shop premium eyewear with personalized recommendations."
        keywords="login, eyewear account, glasses shopping, optical store login"
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.backToHome')}</span>
          </Link>

          <Card className="glass border-0 shadow-xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform">
                <Glasses className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('auth.welcomeBack')}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('auth.loginToAccount')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    data-testid="login-email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    data-testid="login-password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-12"
                  />
                </div>
                <Button 
                  data-testid="login-submit"
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg"
                >
                  {loading ? t('common.loading') : t('auth.login')}
                </Button>
              </form>

              <div className="mt-4">
                <Button 
                  data-testid="demo-login-btn"
                  type="button" 
                  onClick={handleDemoLogin}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-12 border-2 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-900/20"
                >
                  {t('auth.tryDemo')}
                </Button>
              </div>

              <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                  {t('auth.register')}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Login;
