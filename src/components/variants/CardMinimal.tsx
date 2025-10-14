import React from 'react';
import { LucideIcon, User } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';

interface CardMinimalProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string | null;
  rating?: number | null;
  author?: string;
}

export const CardMinimal: React.FC<CardMinimalProps> = ({
  icon: Icon,
  title,
  description,
  image,
  rating,
  author,
}) => {
  const { colors, layoutSpacing, theme } = useModernTheme();

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
          padding: '28px 20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `hsl(var(--color-primary))`;
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `hsl(var(--color-border-default))`;
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
        }}
      >
        <div className="flex flex-col items-center text-center">
          {image ? (
            <img
              src={image}
              alt={author || 'Patient'}
              className="w-12 h-12 rounded-full object-cover mb-4"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
              style={{
                backgroundColor: `hsl(var(--color-primary))`,
              }}
            >
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          {author && (
            <h4
              className="font-semibold text-sm mb-2"
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
                  className={`w-3.5 h-3.5 text-xs ${
                    i < rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </div>
              ))}
            </div>
          )}
          <p
            className="text-xs leading-relaxed opacity-70"
            style={{ color: `hsl(var(--color-text-secondary))` }}
          >
            {description}
          </p>
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
        padding: '32px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `hsl(var(--color-primary))`;
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `hsl(var(--color-border-default))`;
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
      }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-6 flex items-center justify-center"
          style={{
            width: '32px',
            height: '32px',
          }}
        >
          <Icon
            className="w-full h-full"
            style={{ color: `hsl(var(--color-primary))` }}
            strokeWidth={1.5}
          />
        </div>
        <h3
          className="text-base font-semibold mb-3 leading-snug"
          style={{ color: `hsl(var(--color-text-primary))` }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed opacity-70"
          style={{ color: `hsl(var(--color-text-secondary))` }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};
