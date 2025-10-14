import React from 'react';
import { LucideIcon, User } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';

interface CardModernProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string | null;
  rating?: number | null;
  author?: string;
}

export const CardModern: React.FC<CardModernProps> = ({
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
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
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
        <div className="flex flex-col items-center text-center mb-4">
          <div className="flex-shrink-0 mb-4">
            {image ? (
              <img
                src={image}
                alt={author || 'Patient'}
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: `2px solid hsl(var(--color-primary))` }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `hsla(var(--color-primary), 0.08)`,
                  color: `hsl(var(--color-primary))`,
                }}
              >
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          {author && (
            <h4
              className="font-semibold text-lg mb-2"
              style={{ color: `hsl(var(--color-text-primary))` }}
            >
              {author}
            </h4>
          )}
          {rating !== undefined && rating !== null && (
            <div className="flex gap-0.5 mb-4">
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
        </div>
        <p
          className="text-base leading-relaxed text-center"
          style={{ color: `hsl(var(--color-text-secondary))` }}
        >
          {description}
        </p>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: `hsl(var(--color-bg-surface))`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `hsl(var(--color-border-default))`,
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        className="flex items-center justify-center mb-5"
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
        className="text-xl font-semibold mb-3 leading-tight"
        style={{ color: `hsl(var(--color-text-primary))` }}
      >
        {title}
      </h3>
      <p
        className="text-base leading-relaxed"
        style={{ color: `hsl(var(--color-text-secondary))` }}
      >
        {description}
      </p>
    </div>
  );
};
