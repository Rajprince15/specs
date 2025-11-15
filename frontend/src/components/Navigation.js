import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Glasses, Heart, Bookmark } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';

const Navigation = ({ 
  user, 
  onLogout, 
  cartCount = 0, 
  wishlistCount = 0,
  savedItemsCount = 0,
  showWishlist = false,
  showSavedItems = true
}) => {
  return (
    <nav className="glass sticky top-0 z-50 border-b dark:border-gray-800" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Gee Ess Opticals Home">
          <Glasses className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gee Ess Opticals
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Theme Toggle - Always visible */}
          <ThemeToggle />
          
          {/* Language Selector - Always visible */}
          <LanguageSelector />
          
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Link to="/admin">
                  <Button variant="outline">Admin Dashboard</Button>
                </Link>
              ) : (
                <>
                  {showWishlist && (
                    <Link to="/wishlist">
                      <Button variant="outline" className="relative" aria-label="Wishlist">
                        <Heart className="w-5 h-5" />
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
                      <Button variant="outline" className="relative" aria-label="Saved Items">
                        <Bookmark className="w-5 h-5" />
                        {savedItemsCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {savedItemsCount}
                          </span>
                        )}
                      </Button>
                    </Link>
                  )}
                  <Link to="/cart">
                    <Button variant="outline" className="relative" aria-label="Shopping Cart">
                      <ShoppingBag className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="outline">Orders</Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="outline">Profile</Button>
                  </Link>
                </>
              )}
              <Button onClick={onLogout} variant="destructive">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
