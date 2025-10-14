import React from 'react';
import { LucideIcon, User } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';

interface CardPlayfulProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string | null;
  rating?: number | null;
  author?: string;
}

export const CardPlayful: React.FC<CardPlayfulProps> = ({
  icon: Icon,
  title,
  description,
  image,
  rating,
  author,
}) => {
  const { colors, getGradient, layoutSpacing, theme } = useModernTheme();

  const isTestimonial = rating !== undefined || author !== undefined;

  if (isTestimonial) {
    return (
      <div
        className="group relative overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: `hsl(var(--color-bg-surface))`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `hsl(var(--color-border-default))`,
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="flex items-start gap-4">
          {image ? (
            <img
              src={image}
              alt={author || 'Patient'}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `hsla(var(--color-primary), 0.08)`,
                color: `hsl(var(--color-primary))`,
              }}
            >
              <User className="w-8 h-8" />
            </div>
          )}
          <div className="flex-1">
            {author && (
              <h4
                className="font-semibold text-lg mb-2 leading-tight"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                {author}
              </h4>
            )}
            {rating !== undefined && rating !== null && (
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 text-lg ${
                      i < rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </div>
                ))}
              </div>
            )}
            <p
              className="leading-relaxed text-base"
              style={{ color: `hsl(var(--color-text-secondary))` }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: `hsl(var(--color-bg-surface))`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `hsl(var(--color-border-default))`,
        padding: '28px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: `hsla(var(--color-primary), 0.08)`,
            borderRadius: '10px',
          }}
        >
          <Icon className="w-7 h-7" style={{ color: `hsl(var(--color-primary))` }} strokeWidth={2} />
        </div>
        <h3
          className="text-xl font-semibold leading-tight flex-1 pt-2"
          style={{ color: `hsl(var(--color-text-primary))` }}
        >
          {title}
        </h3>
      </div>
      <p
        className="text-base leading-relaxed"
        style={{ color: `hsl(var(--color-text-secondary))` }}
      >
        {description}
      </p>
    </div>
  );
};
