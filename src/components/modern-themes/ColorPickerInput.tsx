import React, { useState, useRef, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface ColorPickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showContrastChecker?: boolean;
  contrastBackground?: string;
  error?: string;
}

export const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  label,
  value,
  onChange,
  showContrastChecker = false,
  contrastBackground,
  error,
}) => {
  const [isValid, setIsValid] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  const validateHexColor = (color: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsValid(validateHexColor(newValue));
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsValid(true);
  };

  const getContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;

      const [rs, gs, bs] = [r, g, b].map(c => {
        const val = c / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    if (!validateHexColor(color1) || !validateHexColor(color2)) return 0;

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  };

  const contrastRatio = showContrastChecker && contrastBackground
    ? getContrastRatio(value, contrastBackground)
    : 0;

  const meetsAA = contrastRatio >= 4.5;
  const meetsAAA = contrastRatio >= 7;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2 items-start">
        <div className="relative flex-1">
          <div className="flex gap-2">
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="w-10 h-10 rounded border-2 border-gray-300 shadow-sm hover:border-gray-400 transition-colors"
                style={{ backgroundColor: isValid ? value : '#ccc' }}
                title="Click to open color picker"
              />
              {showPicker && (
                <div className="absolute z-50 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200">
                  <input
                    type="color"
                    value={isValid ? value : '#000000'}
                    onChange={handleColorPickerChange}
                    className="w-48 h-32 cursor-pointer border border-gray-300 rounded"
                  />
                </div>
              )}
            </div>
            <input
              type="text"
              value={value}
              onChange={handleInputChange}
              placeholder="#000000"
              className={`flex-1 px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !isValid || error
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
            />
          </div>
          {!isValid && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              Invalid hex color format
            </div>
          )}
          {error && isValid && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
        {showContrastChecker && contrastBackground && isValid && (
          <div className="flex flex-col gap-1 min-w-[80px]">
            <div className="text-xs text-gray-600">
              Contrast: {contrastRatio.toFixed(2)}:1
            </div>
            <div className="flex gap-1">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  meetsAA ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}
              >
                {meetsAA && <Check className="w-3 h-3" />}
                AA
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
                  meetsAAA ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {meetsAAA && <Check className="w-3 h-3" />}
                AAA
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
