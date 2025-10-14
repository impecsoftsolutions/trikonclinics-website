import React, { useState } from 'react';
import { User, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { useModernTheme } from '../hooks/useModernTheme';

interface DoctorCardProps {
  name: string;
  qualification: string | null;
  specialisation: string | null;
  yearsOfExperience: number;
  expertiseDetails: string | null;
  photo: string | null;
  index: number;
}

const EXPERTISE_PREVIEW_LENGTH = 150;

export const DoctorCard: React.FC<DoctorCardProps> = ({
  name,
  qualification,
  specialisation,
  yearsOfExperience,
  expertiseDetails,
  photo,
  index,
}) => {
  const { getGradient } = useModernTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = expertiseDetails && expertiseDetails.length > EXPERTISE_PREVIEW_LENGTH;
  const displayText = shouldTruncate && !isExpanded
    ? expertiseDetails.slice(0, EXPERTISE_PREVIEW_LENGTH) + '...'
    : expertiseDetails;

  return (
    <div
      className="max-w-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
      style={{
        backgroundColor: `hsl(var(--color-bg-surface))`,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: `hsl(var(--color-border-default))`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex flex-col">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: '1/1',
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: `hsla(var(--color-primary), 0.1)`,
              }}
            >
              <User
                className="w-24 h-24"
                style={{ color: `hsl(var(--color-primary))` }}
              />
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col items-center text-center">
          <h3
            className="text-2xl font-bold mb-2"
            style={{ color: `hsl(var(--color-text-primary))` }}
          >
            {name}
          </h3>

          {qualification && (
            <p
              className="text-base mb-4 font-medium"
              style={{ color: `hsl(var(--color-text-secondary))` }}
            >
              {qualification}
            </p>
          )}

          {specialisation && (
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-4 transition-colors duration-300"
              style={{
                background: getGradient('secondary'),
                color: `hsl(var(--color-text-inverse))`,
              }}
            >
              <span className="text-base font-medium">{specialisation}</span>
            </div>
          )}

          <div
            className="flex items-center gap-2 mb-5"
            style={{ color: `hsl(var(--color-text-secondary))` }}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-base font-medium">
              {yearsOfExperience} {yearsOfExperience === 1 ? 'year' : 'years'} experience
            </span>
          </div>

          {expertiseDetails && (
            <div
              className="w-full pt-5 border-t text-left"
              style={{
                borderColor: `hsl(var(--color-border-default))`,
              }}
            >
              <h4
                className="text-base font-semibold mb-3"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                Areas of Expertise
              </h4>
              <div className="space-y-2">
                <p
                  className="text-base leading-relaxed transition-all duration-300"
                  style={{ color: `hsl(var(--color-text-secondary))` }}
                >
                  {displayText}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-base font-medium transition-colors duration-200 hover:opacity-80"
                    style={{ color: `hsl(var(--color-primary))` }}
                  >
                    {isExpanded ? (
                      <>
                        <span>Read Less</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Read More</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
