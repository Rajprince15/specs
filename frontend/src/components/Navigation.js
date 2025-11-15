import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Glasses, Heart, Bookmark, Menu, X, Download } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';
import { useInstallPWA } from '@/hooks/useInstallPWA';
import { toast } from 'sonner';

const Navigation = ({ 
  user, 
  onLogout, 
  cartCount = 0, 
  wishlistCount = 0,
  savedItemsCount = 0,
  showWishlist = true,
  showSavedItems = true
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, installApp } = useInstallPWA();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!', {
        description: 'You can now access the app from your home screen.'
      });
    }
  };

  return (
    <nav className="glass sticky top-0 z-50 border-b dark:border-gray-800" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="Gee Ess Opticals Home">
            <Glasses className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hidden xs:inline">
              Gee Ess Opticals
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent xs:hidden">
              GEO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {/* Install App Button - Only show if installable and not installed */}
            {isInstallable && !isInstalled && (
              <Button 
                onClick={handleInstall}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Selector */}
            <LanguageSelector />
            
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">Admin Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    {showWishlist && (
                      <Link to="/wishlist">
                        <Button variant="outline" size="sm" className="relative" aria-label="Wishlist">
                          <Heart className="w-4 h-4" />
                          {wishlistCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {wishlistCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    )}
                    {showSavedItems && (
                      <Link to="/saved-items">
                        <Button variant="outline" size="sm" className="relative" aria-label="Saved Items">
                          <Bookmark className="w-4 h-4" />
                          {savedItemsCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {savedItemsCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    )}
                    <Link to="/cart">
                      <Button variant="outline" size="sm" className="relative" aria-label="Shopping Cart">
                        <ShoppingBag className="w-4 h-4" />
                        {cartCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {cartCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Link to="/orders">
                      <Button variant="outline" size="sm">Orders</Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="outline" size="sm">Profile</Button>
                    </Link>
                  </>
                )}
                <Button onClick={onLogout} variant="destructive" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: Essential buttons + Menu */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            {user && (
              <Link to="/cart">
                <Button variant="outline" size="sm" className="relative" aria-label="Shopping Cart">
                  <ShoppingBag className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t dark:border-gray-700 pt-4 space-y-2">
            {/* Install App Button in Mobile Menu */}
            {isInstallable && !isInstalled && (
              <Button 
                onClick={handleInstall}
                variant="outline"
                className="w-full justify-start border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
            <LanguageSelector />
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full justify-start">Admin Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    {showWishlist && (
                      <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button variant="outline" className="w-full justify-start relative">
                          <Heart className="w-4 h-4 mr-2" />
                          Wishlist
                          {wishlistCount > 0 && (
                            <span className="ml-auto bg-pink-500 text-white text-xs rounded-full px-2 py-0.5">
                              {wishlistCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    )}
                    {showSavedItems && (
                      <Link to="/saved-items" onClick={() => setMobileMenuOpen(false)} className="block">
                        <Button variant="outline" className="w-full justify-start relative">
                          <Bookmark className="w-4 h-4 mr-2" />
                          Saved Items
                          {savedItemsCount > 0 && (
                            <span className="ml-auto bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                              {savedItemsCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    )}
                    <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full justify-start relative">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Cart
                        {cartCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {cartCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                    <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full justify-start">Orders</Button>
                    </Link>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block">
                      <Button variant="outline" className="w-full justify-start">Profile</Button>
                    </Link>
                  </>
                )}
                <Button onClick={() => { onLogout(); setMobileMenuOpen(false); }} variant="destructive" className="w-full">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block">
                  <Button className="w-full">Register</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
