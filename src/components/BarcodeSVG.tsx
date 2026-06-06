import React from 'react';

const CODE39_MAP: Record<string, string> = {
  '0': 'NNNWWNWNN',
  '1': 'WNNWNNNNW',
  '2': 'NNWWNNNNW',
  '3': 'WNWWNNNNN',
  '4': 'NNNWWNNNW',
  '5': 'WNNWWNNNN',
  '6': 'NNWWWNNNN',
  '7': 'NNNWNNWNW',
  '8': 'WNNWNNWNN',
  '9': 'NNWWNNWNN',
  'A': 'WNNNNWNNW',
  'B': 'NNWNNWNNW',
  'C': 'WNWNNWNNN',
  'D': 'NNNNWWNNW',
  'E': 'WNNNWWNNN',
  'F': 'NNWNWWNNN',
  'G': 'NNNNNWNWW',
  'H': 'WNNNNWNWN',
  'I': 'NNWNNWNWN',
  'J': 'NNNNWWNWN',
  'K': 'WNNNNNNWW',
  'L': 'NNWNNNNWW',
  'M': 'WNWNNNNWN',
  'N': 'NNNNWNNWW',
  'O': 'WNNNWNNWN',
  'P': 'NNWNWNNWN',
  'Q': 'NNNNNNWWW',
  'R': 'WNNNNNWWN',
  'S': 'NNWNNNWWN',
  'T': 'NNNNWNWWN',
  'U': 'WWNNNNNNW',
  'V': 'NWWNNNNNW',
  'W': 'WWWNNNNNN',
  'X': 'NWNNWNNNW',
  'Y': 'WWNNWNNNN',
  'Z': 'NWWNWNNNN',
  '-': 'NWNNNNWNW',
  '.': 'WWNNNNWNN',
  ' ': 'NWWNNNWNN',
  '*': 'NWNNWNWNN',
  '$': 'NWNWNWNNN',
  '/': 'NWNWNNNWN',
  '+': 'NWNNNWNWN',
  '%': 'NNNWNWNWN'
};

interface BarcodeSVGProps {
  value: string;
  height?: number;
  narrowWidth?: number;
  wideWidthMultiplier?: number;
  showText?: boolean;
  className?: string;
  id?: string;
}

export default function BarcodeSVG({
  value,
  height = 50,
  narrowWidth = 1.5,
  wideWidthMultiplier = 2.5,
  showText = true,
  className = '',
  id
}: BarcodeSVGProps) {
  // Normalize value to uppercase and keep only Code39 valid characters
  const rawText = value.toUpperCase();
  const filteredText = rawText
    .split('')
    .filter(char => char in CODE39_MAP)
    .join('');

  if (!filteredText) {
    return (
      <div className="text-xs text-rose-500 font-mono" id={id}>
        Code-barre indisponible
      </div>
    );
  }

  // Code 39 always starts and ends with external asterisks
  const fullText = `*${filteredText}*`;
  
  // Calculate width parameters
  const wideWidth = narrowWidth * wideWidthMultiplier;
  const interGap = narrowWidth; // Gap between characters

  // Path building state
  let currentX = 0;
  const paths: React.ReactNode[] = [];

  for (let c = 0; c < fullText.length; c++) {
    const char = fullText[c];
    const pattern = CODE39_MAP[char];
    if (!pattern) continue;

    // Draw the 9 elements of the pattern
    for (let i = 0; i < 9; i++) {
      const isBar = i % 2 === 0; // Odd indices are bars, even are spaces
      const isWide = pattern[i] === 'W';
      const elementWidth = isWide ? wideWidth : narrowWidth;

      if (isBar) {
        // Draw black rectangle
        paths.push(
          <rect
            key={`bar-${c}-${i}`}
            x={currentX}
            y={0}
            width={elementWidth}
            height={height}
            fill="black"
          />
        );
      }
      currentX += elementWidth;
    }

    // Add inter-character gap after each character except the last one
    if (c < fullText.length - 1) {
      currentX += interGap;
    }
  }

  const totalWidth = currentX;

  return (
    <div className={`flex flex-col items-center bg-white p-2 rounded border border-stone-200/50 ${className}`} id={id}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="xMidYMid Meet"
        className="max-w-full"
      >
        <g>{paths}</g>
      </svg>
      {showText && (
        <span className="font-mono text-[9px] tracking-[0.2em] font-semibold text-stone-700 mt-1 uppercase">
          {filteredText}
        </span>
      )}
    </div>
  );
}
