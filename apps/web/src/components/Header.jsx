
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, LayoutDashboard, Upload, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { isAuthenticated, isAdmin, currentUser, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <Shield className="h-6 w-6 text-primary" />
            <span>CISA KEV Scanner</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/dashboard') ? 'text-primary' : 'text-foreground/80'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive('/upload') ? 'text-primary' : 'text-foreground/80'
                  }`}
                >
                  Upload
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      isActive('/admin') || location.pathname.startsWith('/admin') ? 'text-primary' : 'text-foreground/80'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/') ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                Home
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentUser?.name || currentUser?.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload SBOM
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
