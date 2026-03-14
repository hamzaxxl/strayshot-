import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, ExternalLink, User, Star, AlertTriangle, Trash2, MessageSquare, Shield } from 'lucide-react';

interface Listing {
  id: string;
  sellerId: string;
  gameName: string;
  title: string;
  description: string;
  images: string[];
  tags: string[];
  status: string;
  createdAt: string;
}

interface Seller {
  uid: string;
  displayName: string;
  photoURL: string;
  facebookUrl: string;
  averageRating: number;
  ratingCount: number;
  isBanned: boolean;
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  createdAt: string;
}

export const ListingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    const fetchListingAndSeller = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as Listing;
          setListing(data);
          
          const sellerRef = doc(db, 'users', data.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            setSeller(sellerSnap.data() as Seller);
          }
          
          fetchComments();
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListingAndSeller();
  }, [id]);

  const fetchComments = async () => {
    if (!id) return;
    try {
      const q = query(collection(db, 'comments'), where('listingId', '==', id), where('status', '==', 'active'));
      const snapshot = await getDocs(q);
      
      const commentsData: Comment[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const authorRef = doc(db, 'users', data.authorId);
        const authorSnap = await getDoc(authorRef);
        const authorData = authorSnap.data();
        
        commentsData.push({
          id: docSnap.id,
          authorId: data.authorId,
          authorName: authorData?.displayName || 'Unknown',
          authorPhoto: authorData?.photoURL || '',
          text: data.text,
          createdAt: data.createdAt,
        });
      }
      
      setComments(commentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !id || !listing) return;
    
    setCommenting(true);
    try {
      const commentRef = collection(db, 'comments');
      const newCommentDoc = await addDoc(commentRef, {
        id: '', // will be updated
        listingId: id,
        authorId: user.uid,
        text: newComment.trim(),
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      
      // Update ID
      await setDoc(doc(db, 'comments', newCommentDoc.id), { id: newCommentDoc.id }, { merge: true });
      
      // Add notification for seller
      if (listing.sellerId !== user.uid) {
        const notifRef = collection(db, 'notifications');
        const newNotifDoc = await addDoc(notifRef, {
          id: '',
          userId: listing.sellerId,
          type: 'comment',
          sourceId: id,
          message: `${profile?.displayName || 'Someone'} commented on your listing: ${listing.title}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
        await setDoc(doc(db, 'notifications', newNotifDoc.id), { id: newNotifDoc.id }, { merge: true });
      }
      
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!id || !listing) return;
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await deleteDoc(doc(db, 'listings', id));
      navigate('/');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!listing || listing.status !== 'active') {
    return (
      <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl mx-auto">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-xl font-bold text-white">Listing not found</h3>
        <p className="text-zinc-400 mt-2 mb-6">This listing may have been removed or does not exist.</p>
        <Link to="/" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === listing.sellerId;
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Images */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <div className="aspect-video relative bg-black">
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="aspect-video bg-zinc-800 flex items-center justify-center">
              <Gamepad2 className="h-20 w-20 text-zinc-600" />
            </div>
          )}
          {listing.images && listing.images.length > 1 && (
            <div className="flex overflow-x-auto p-4 gap-4 bg-zinc-950 border-t border-zinc-800">
              {listing.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Thumbnail ${idx}`} className="h-20 w-32 object-cover rounded-md border border-zinc-700 flex-shrink-0" referrerPolicy="no-referrer" />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <span className="inline-block bg-zinc-800 text-zinc-300 text-xs font-medium px-2.5 py-1 rounded-md border border-zinc-700 mb-3">
                {listing.gameName}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{listing.title}</h1>
            </div>
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDeleteListing}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline text-sm font-medium">Delete</span>
              </button>
            )}
          </div>
          
          <div className="prose prose-invert max-w-none mb-8">
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          </div>

          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-zinc-800">
              {listing.tags.map((tag, idx) => (
                <span key={idx} className="bg-zinc-800 text-zinc-400 text-sm px-3 py-1.5 rounded-lg border border-zinc-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            Comments ({comments.length})
          </h2>

          {user ? (
            <form onSubmit={handleAddComment} className="mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="You" className="h-10 w-10 rounded-full border border-zinc-700" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or leave a comment..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    required
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={commenting || !newComment.trim()}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {commenting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-8 text-center text-zinc-400">
              Please sign in to leave a comment.
            </div>
          )}

          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <Link to={`/profile/${comment.authorId}`} className="flex-shrink-0">
                  {comment.authorPhoto ? (
                    <img src={comment.authorPhoto} alt={comment.authorName} className="h-10 w-10 rounded-full border border-zinc-700" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                      <User className="h-5 w-5 text-zinc-400" />
                    </div>
                  )}
                </Link>
                <div className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/profile/${comment.authorId}`} className="font-medium text-zinc-200 hover:text-emerald-400 transition-colors">
                      {comment.authorName}
                    </Link>
                    <span className="text-xs text-zinc-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 whitespace-pre-wrap text-sm">{comment.text}</p>
                </div>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-zinc-500 text-center italic">No comments yet. Be the first to ask a question!</p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24">
          <h3 className="text-lg font-bold text-white mb-6">Seller Information</h3>
          
          {seller ? (
            <div className="flex flex-col items-center text-center">
              <Link to={`/profile/${seller.uid}`} className="mb-4 relative group">
                {seller.photoURL ? (
                  <img src={seller.photoURL} alt={seller.displayName} className="h-24 w-24 rounded-full border-4 border-zinc-800 group-hover:border-emerald-500/50 transition-colors object-cover" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-700 group-hover:border-emerald-500/50 transition-colors">
                    <User className="h-10 w-10 text-zinc-400" />
                  </div>
                )}
                {seller.averageRating >= 4.5 && seller.ratingCount >= 5 && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-zinc-900" title="Trusted Seller">
                    <Shield className="h-4 w-4" />
                  </div>
                )}
              </Link>
              
              <Link to={`/profile/${seller.uid}`} className="text-xl font-bold text-white hover:text-emerald-400 transition-colors mb-2">
                {seller.displayName}
              </Link>
              
              <div className="flex items-center gap-2 text-amber-400 mb-6 bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-bold">{seller.averageRating > 0 ? seller.averageRating.toFixed(1) : 'New'}</span>
                <span className="text-zinc-400 text-sm font-normal">({seller.ratingCount} reviews)</span>
              </div>

              {seller.isBanned ? (
                <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">User is banned</span>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <a
                    href={seller.facebookUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!seller.facebookUrl) {
                        e.preventDefault();
                        alert('Seller has not provided a Facebook link.');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-[#1877F2]/20"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Contact on Facebook
                  </a>
                  <p className="text-xs text-zinc-500 text-center px-4">
                    All trades happen externally. GameTrade does not process payments. Protect yourself from scams.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">
              Seller information unavailable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// I need to import Shield from lucide-react above.
