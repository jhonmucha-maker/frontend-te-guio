import { useState } from 'react';
import { HiStar } from 'react-icons/hi';

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
}) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <HiStar
            className={`${sizes[size]} ${
              star <= (hover || value)
                ? 'text-amber-400'
                : 'text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
