import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Star, ExternalLink } from 'lucide-react';

interface ListingCardProps {
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

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  gameName,
  description,
  images,
  tags,
  sellerId,
  sellerName,
  sellerFacebook,
  sellerRating,
}) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors group flex flex-col h-full">
      <Link to={`/listing/${id}`} className="block relative aspect-video overflow-hidden bg-zinc-800">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Gamepad2 className="h-12 w-12 opacity-50" />
          </div>
        )}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-medium text-zinc-200 border border-white/10">
          {gameName}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/listing/${id}`} className="block mb-2">
          <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-zinc-400 text-sm line-clamp-2 mb-4 flex-grow">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md border border-zinc-700">
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md border border-zinc-700">
              +{tags.length - 3}
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between mt-auto">
          <Link to={`/profile/${sellerId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-200">{sellerName}</span>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="h-3 w-3 fill-current" />
                <span>{sellerRating > 0 ? sellerRating.toFixed(1) : 'New'}</span>
              </div>
            </div>
          </Link>
          
          <a
            href={sellerFacebook || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              if (!sellerFacebook) {
                e.preventDefault();
                alert('Seller has not provided a Facebook link.');
              }
            }}
            className="flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Contact</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
