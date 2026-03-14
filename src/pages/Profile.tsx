import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Star, ExternalLink, Edit2, Check, Shield, AlertTriangle } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';

interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  facebookUrl: string;
  bio: string;
  role: string;
  ratingSum: number;
  ratingCount: number;
  averageRating: number;
  isBanned: boolean;
  createdAt: string;
}

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerPhoto: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: currentUserProfile, updateProfile } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    facebookUrl: '',
    bio: '',
  });

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch Profile
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setEditForm({
            displayName: data.displayName || '',
            facebookUrl: data.facebookUrl || '',
            bio: data.bio || '',
          });
        }

        // Fetch Listings
        const listingsQ = query(collection(db, 'listings'), where('sellerId', '==', id), where('status', '==', 'active'));
        const listingsSnap = await getDocs(listingsQ);
        const listingsData = listingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setListings(listingsData);

        // Fetch Reviews
        const reviewsQ = query(collection(db, 'reviews'), where('targetUserId', '==', id), where('status', '==', 'active'));
        const reviewsSnap = await getDocs(reviewsQ);
        const reviewsData: Review[] = [];
        for (const rDoc of reviewsSnap.docs) {
          const rData = rDoc.data();
          const reviewerRef = doc(db, 'users', rData.reviewerId);
          const reviewerSnap = await getDoc(reviewerRef);
          const reviewerData = reviewerSnap.data();
          reviewsData.push({
            id: rDoc.id,
            reviewerId: rData.reviewerId,
            reviewerName: reviewerData?.displayName || 'Unknown',
            reviewerPhoto: reviewerData?.photoURL || '',
            rating: rData.rating,
            comment: rData.comment,
            createdAt: rData.createdAt,
          });
        }
        setReviews(reviewsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  const handleSaveProfile = async () => {
    if (!isOwner) return;
    try {
      await updateProfile(editForm);
      setProfile(prev => prev ? { ...prev, ...editForm } : null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !id) return;
    
    setSubmittingReview(true);
    try {
      // Create review
      const reviewRef = collection(db, 'reviews');
      const newReviewDoc = await addDoc(reviewRef, {
        id: '',
        reviewerId: user.uid,
        targetUserId: id,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'reviews', newReviewDoc.id), { id: newReviewDoc.id }, { merge: true });

      // Update user rating
      const newRatingSum = profile.ratingSum + newReview.rating;
      const newRatingCount = profile.ratingCount + 1;
      const newAverageRating = newRatingSum / newRatingCount;
      
      await setDoc(doc(db, 'users', id), {
        ratingSum: newRatingSum,
        ratingCount: newRatingCount,
        averageRating: newAverageRating
      }, { merge: true });

      // Add notification
      const notifRef = collection(db, 'notifications');
      const newNotifDoc = await addDoc(notifRef, {
        id: '',
        userId: id,
        type: 'review',
        sourceId: newReviewDoc.id,
        message: `${currentUserProfile?.displayName || 'Someone'} left you a ${newReview.rating}-star review.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'notifications', newNotifDoc.id), { id: newNotifDoc.id }, { merge: true });

      // Refresh
      setProfile(prev => prev ? { ...prev, ratingSum: newRatingSum, ratingCount: newRatingCount, averageRating: newAverageRating } : null);
      setNewReview({ rating: 5, comment: '' });
      
      // Add to local state
      setReviews([{
        id: newReviewDoc.id,
        reviewerId: user.uid,
        reviewerName: currentUserProfile?.displayName || 'You',
        reviewerPhoto: currentUserProfile?.photoURL || '',
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        createdAt: new Date().toISOString(),
      }, ...reviews]);

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl mx-auto">
        <User className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
        <h3 className="text-xl font-bold text-white">Profile not found</h3>
        <p className="text-zinc-400 mt-2">This user may not exist or has been removed.</p>
      </div>
    );
  }

  const isOwner = user?.uid === id;
  const hasReviewed = reviews.some(r => r.reviewerId === user?.uid);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-emerald-900/40 to-zinc-900"></div>
        
        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-end mt-12">
          <div className="relative group">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="h-32 w-32 rounded-full border-4 border-zinc-900 object-cover bg-zinc-800" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-32 w-32 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-900">
                <User className="h-12 w-12 text-zinc-500" />
              </div>
            )}
            {profile.averageRating >= 4.5 && profile.ratingCount >= 5 && (
              <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full border-4 border-zinc-900" title="Trusted Seller">
                <Shield className="h-6 w-6" />
              </div>
            )}
          </div>
          
          <div className="flex-grow space-y-4 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="text-2xl font-bold bg-zinc-950 border border-zinc-700 rounded px-3 py-1 text-white focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
                    placeholder="Display Name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    {profile.displayName}
                    {profile.role === 'admin' && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-md border border-emerald-500/30 uppercase tracking-wider font-semibold">Admin</span>
                    )}
                  </h1>
                )}
                
                <div className="flex items-center gap-2 mt-2 text-amber-400">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-bold text-lg">{profile.averageRating > 0 ? profile.averageRating.toFixed(1) : 'New'}</span>
                  <span className="text-zinc-400 text-sm">({profile.ratingCount} reviews)</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                {isOwner ? (
                  isEditing ? (
                    <button onClick={handleSaveProfile} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                      <Check className="h-4 w-4" /> Save
                    </button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700">
                      <Edit2 className="h-4 w-4" /> Edit Profile
                    </button>
                  )
                ) : (
                  !profile.isBanned && (
                    <a
                      href={profile.facebookUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!profile.facebookUrl) {
                          e.preventDefault();
                          alert('User has not provided a Facebook link.');
                        }
                      }}
                      className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-5 py-2 rounded-lg font-medium transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" /> Contact
                    </a>
                  )
                )}
              </div>
            </div>
            
            {profile.isBanned && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">This user has been banned from the platform.</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-800">
          <div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">About</h3>
            {isEditing ? (
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                rows={4}
                placeholder="Tell buyers about yourself..."
              />
            ) : (
              <p className="text-zinc-300 whitespace-pre-wrap">{profile.bio || 'No bio provided.'}</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Contact Info</h3>
            {isEditing ? (
              <div className="space-y-2">
                <label className="block text-xs text-zinc-400">Facebook Profile URL</label>
                <input
                  type="url"
                  value={editForm.facebookUrl}
                  onChange={(e) => setEditForm({ ...editForm, facebookUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="https://facebook.com/yourprofile"
                />
              </div>
            ) : (
              <div>
                {profile.facebookUrl ? (
                  <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-2 break-all">
                    {profile.facebookUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-zinc-500 italic">Not provided</span>
                )}
              </div>
            )}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">Member Since</h3>
              <p className="text-zinc-300">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Active Listings ({listings.length})</h2>
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                {...listing}
                sellerName={profile.displayName}
                sellerFacebook={profile.facebookUrl}
                sellerRating={profile.averageRating}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-zinc-500">No active listings.</p>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Reviews ({reviews.length})</h2>
        
        {!isOwner && user && !hasReviewed && !profile.isBanned && (
          <form onSubmit={handleSubmitReview} className="mb-10 bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Leave a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star className={`h-8 w-8 ${star <= newReview.rating ? 'text-amber-400 fill-current' : 'text-zinc-700'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Comment</label>
              <textarea
                required
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 resize-none"
                rows={3}
                placeholder="How was your experience trading with this user?"
              />
            </div>
            <button
              type="submit"
              disabled={submittingReview}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <Link to={`/profile/${review.reviewerId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {review.reviewerPhoto ? (
                    <img src={review.reviewerPhoto} alt={review.reviewerName} className="h-10 w-10 rounded-full border border-zinc-700" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-zinc-200">{review.reviewerName}</div>
                    <div className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-1 rounded border border-amber-400/20">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-sm font-bold">{review.rating}</span>
                </div>
              </div>
              <p className="text-zinc-300 mt-3 pl-13">{review.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-zinc-500 text-center italic py-4">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
