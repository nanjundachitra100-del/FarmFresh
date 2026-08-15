import React from 'react';
import { Star, StarHalf } from 'lucide-react';

export const RatingStars = ({ rating, count }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  const starsArray = [];

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsArray.push(<Star key={i} size={16} fill="var(--warning)" color="var(--warning)" />);
    } else if (i === fullStars + 1 && hasHalf) {
      starsArray.push(<StarHalf key={i} size={16} fill="var(--warning)" color="var(--warning)" />);
    } else {
      starsArray.push(<Star key={i} size={16} color="var(--border-light)" />);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '2px' }}>{starsArray}</div>
      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-medium)', marginLeft: '4px' }}>
        {rating}
      </span>
      {count !== undefined && (
        <span style={{ fontSize: '12px', color: 'var(--text-light)', marginLeft: '2px' }}>
          ({count} reviews)
        </span>
      )}
    </div>
  );
};
