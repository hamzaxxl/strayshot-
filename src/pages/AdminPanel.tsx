import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Trash2, Ban, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminPanel: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'listings' | 'reviews'>('users');

  useEffect(() => {
    if (!authLoading && profile?.role !== 'admin') {
      navigate('/');
    }
  }, [profile, authLoading, navigate]);

  useEffect(() => {
    if (profile?.role !== 'admin') return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Users
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Listings
        const listingsSnap = await getDocs(collection(db, 'listings'));
        setListings(listingsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // Fetch Reviews
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return;
    try {
      await setDoc(doc(db, 'users', userId), { isBanned: !currentStatus }, { merge: true });
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to update user status.');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      setListings(listings.filter(l => l.id !== listingId));
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-emerald-500" />
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      <div className="flex gap-4 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'listings' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'reviews' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs text-zinc-300 uppercase bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-zinc-800" />
                      )}
                      {u.displayName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBanned ? (
                        <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-4 w-4" /> Banned</span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="h-4 w-4" /> Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleBanUser(u.id, u.isBanned)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${u.isBanned ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`}
                        >
                          <Ban className="h-4 w-4" />
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs text-zinc-300 uppercase bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Game</th>
                  <th className="px-6 py-4">Seller ID</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white line-clamp-1">{l.title}</td>
                    <td className="px-6 py-4">{l.gameName}</td>
                    <td className="px-6 py-4 font-mono text-xs">{l.sellerId}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteListing(l.id)}
                        className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="text-xs text-zinc-300 uppercase bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Comment</th>
                  <th className="px-6 py-4">Reviewer ID</th>
                  <th className="px-6 py-4">Target ID</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-amber-400">{r.rating} Stars</td>
                    <td className="px-6 py-4 line-clamp-1">{r.comment}</td>
                    <td className="px-6 py-4 font-mono text-xs">{r.reviewerId}</td>
                    <td className="px-6 py-4 font-mono text-xs">{r.targetUserId}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteReview(r.id)}
                        className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
