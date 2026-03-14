import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X, Gamepad2 } from 'lucide-react';

export const CreateListing: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    gameName: '',
    title: '',
    description: '',
    tags: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  if (!user || !profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-4">Sign in required</h2>
        <p className="text-zinc-400">You must be signed in to create a listing.</p>
      </div>
    );
  }

  if (!profile.facebookUrl) {
    return (
      <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        <div className="bg-amber-500/10 text-amber-500 p-4 rounded-lg mb-6 inline-block">
          <Gamepad2 className="h-8 w-8 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Facebook Link Required</h2>
        </div>
        <p className="text-zinc-300 mb-6">
          To ensure buyers can contact you, you must add your Facebook profile link to your account before creating a listing.
        </p>
        <button
          onClick={() => navigate(`/profile/${user.uid}`)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Go to Profile Settings
        </button>
      </div>
    );
  }

  const handleAddImage = () => {
    if (imageUrlInput.trim() && !images.includes(imageUrlInput.trim())) {
      setImages([...images, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.gameName || !formData.title || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const newListingRef = doc(collection(db, 'listings'));
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await setDoc(newListingRef, {
        id: newListingRef.id,
        sellerId: user.uid,
        gameName: formData.gameName,
        title: formData.title,
        description: formData.description,
        images,
        tags: tagsArray,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      navigate(`/listing/${newListingRef.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Listing</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Game Name *
              </label>
              <input
                type="text"
                required
                value={formData.gameName}
                onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="e.g. Valorant, Genshin Impact"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Listing Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="e.g. Level 500, All Agents Unlocked"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              placeholder="Describe the account details, ranks, skins, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g. smurf, rare skins, high rank"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Images (URLs)
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-grow bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Add
              </button>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                {images.map((url, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 group">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-800 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-lg font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              Publish Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
