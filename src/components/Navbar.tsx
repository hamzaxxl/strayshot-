import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, User, LogOut, PlusCircle, Shield } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

export const Navbar: React.FC = () => {
  const { user, profile, login, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors">
              <Gamepad2 className="h-8 w-8" />
              <span className="font-bold text-xl tracking-tight text-white">GameTrade</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="hidden sm:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>List Account</span>
                </Link>
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-zinc-400 hover:text-white transition-colors"
                    title="Admin Panel"
                  >
                    <Shield className="h-5 w-5" />
                  </Link>
                )}
                <NotificationsDropdown />
                <div className="relative group">
                  <button className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="h-8 w-8 rounded-full border border-zinc-700" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 w-48 mt-2 origin-top-right bg-zinc-800 border border-zinc-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <Link to={`/profile/${user.uid}`} className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white">
                        My Profile
                      </Link>
                      <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={login}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
