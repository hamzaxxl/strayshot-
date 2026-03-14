import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ListingCard } from '../components/ListingCard';
import { Search, Filter, Gamepad2 } from 'lucide-react';

interface ListingWithSeller {
  id: string;
  title: string;
  gameName: string;
  description: string;
  images: string[];
  tags: string[];
  sellerId: string;
  sellerName: string;
  sellerFacebook: string;
  sellerRating: number;
}

export const Home: React.FC = () => {
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGame, setFilterGame] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        
        const listingsData: ListingWithSeller[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          
          // Fetch seller info
          const sellerDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', data.sellerId)));
          const sellerData = sellerDoc.docs[0]?.data() || {};
          
          listingsData.push({
            id: docSnap.id,
            title: data.title,
            gameName: data.gameName,
            description: data.description,
            images: data.images || [],
            tags: data.tags || [],
            sellerId: data.sellerId,
            sellerName: sellerData.displayName || 'Unknown',
            sellerFacebook: sellerData.facebookUrl || '',
            sellerRating: sellerData.averageRating || 0,
          });
        }
        setListings(listingsData);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.gameName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGame = filterGame ? l.gameName.toLowerCase() === filterGame.toLowerCase() : true;
    return matchesSearch && matchesGame;
  });

  const uniqueGames = Array.from(new Set(listings.map(l => l.gameName)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Marketplace</h1>
          <p className="text-zinc-400 mt-1">Discover and showcase gaming accounts.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-grow md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-zinc-700 rounded-lg leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterGame}
              onChange={(e) => setFilterGame(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-zinc-700 rounded-lg leading-5 bg-zinc-900 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm appearance-none transition-colors"
            >
              <option value="">All Games</option>
              {uniqueGames.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <Filter className="h-4 w-4 text-zinc-500" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map(listing => (
            <ListingCard key={listing.id} {...listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <Gamepad2 className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-zinc-300">No listings found</h3>
          <p className="text-zinc-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};
