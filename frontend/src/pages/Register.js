import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Glasses, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { axiosInstance } from '@/App';
import SEO from '@/components/SEO';
import { trackSignUp, setUserId } from '@/utils/analytics';

const Register = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/register', formData);
      toast.success(response.data.message);
      onLogin(response.data.user, response.data.token);
      
      // Track sign up event
      trackSignUp('email');
      if (response.data.user?.id) {
        setUserId(response.data.user.id);
      }
      
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Create Your Account"
        description="Join Gee Ess Opticals today. Create an account to shop premium eyewear, save your favorites, and enjoy exclusive benefits."
        keywords="register, sign up, create account, join"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <main id="main-content" className="w-full max-w-md">
          <nav role="navigation" aria-label="Authentication navigation">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8" aria-label="Back to Home">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
          </nav>

        <Card data-testid="register-card" className="glass border-0 shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Glasses className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center text-base">
              Join Gee Ess Opticals today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  data-testid="name-input"
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
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
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  data-testid="phone-input"
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  data-testid="address-input"
                  id="address"
                  type="text"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-12"
                />
              </div>
              <Button
                data-testid="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        </main>
      </div>
    </>
  );
};

export default Register;