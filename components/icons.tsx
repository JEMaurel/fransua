import React from 'react';

export const PlayIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

export const PauseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);

export const StopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 9a1 1 0 00-1 1v1a1 1 0 001 1h3a1 1 0 001-1v-1a1 1 0 00-1-1H8z" clipRule="evenodd" />
  </svg>
);

export const VolumeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 2.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 2.5zM8.5 6a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H9.25A.75.75 0 018.5 6zM10 10a2.5 2.5 0 00-2.5 2.5v1.586l-.72.72a.75.75 0 001.06 1.06l.97-.97A2.484 2.484 0 0010 15a2.5 2.5 0 002.5-2.5v-2.5A2.5 2.5 0 0010 10z" />
  </svg>
);

export const MicrophoneIcon: React.FC<{ className?: string }> = ({ className = "h-10 w-10 text-white" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
  </svg>
);

export const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

export const SparklesIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.172a2 2 0 00.586 1.414l.707.707a2 2 0 010 2.828l-.707.707A2 2 0 004 11.828V13a1 1 0 102 0v-.172a2 2 0 00-.586-1.414l.707-.707a2 2 0 012.828 0l.707.707A2 2 0 0010 12.828V13a1 1 0 102 0v-.172a2 2 0 00-.586-1.414l.707-.707a2 2 0 012.828 0l.707.707A2 2 0 0016 11.828V13a1 1 0 102 0v-1.172a2 2 0 00-.586-1.414l-.707-.707a2 2 0 010-2.828l.707-.707A2 2 0 0018 5.172V4a1 1 0 10-2 0v.172a2 2 0 00.586 1.414l-.707.707a2 2 0 01-2.828 0l-.707-.707A2 2 0 0012 4.172V4a1 1 0 10-2 0v.172a2 2 0 00.586 1.414l-.707.707a2 2 0 01-2.828 0l-.707-.707A2 2 0 006 4.172V4a1 1 0 10-2 0v1.172a2 2 0 00.586 1.414l.707.707a2 2 0 010 2.828l-.707.707A2 2 0 004 9.828V11a1 1 0 102 0v-.172a2 2 0 00-.586-1.414l.707-.707a2 2 0 012.828 0l.707.707A2 2 0 0010 8.828V9a1 1 0 102 0V7.828a2 2 0 00-.586-1.414l-.707-.707a2 2 0 01-2.828 0l-.707.707A2 2 0 008 5.172V4a1 1 0 10-2 0V3a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

export const TranslateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13l4-4M19 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h12a2 2 0 002-2zM15 5l-2 11" />
    </svg>
);

export const LogoIcon: React.FC = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
        <path d="M4.5 6.5C8.366 6.5 11.5 9.63401 11.5 13.5C11.5 17.366 8.366 20.5 4.5 20.5C2.567 20.5 0.824021 19.634 0 18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M19.5 3.5C15.634 3.5 12.5 6.63401 12.5 10.5C12.5 14.366 15.634 17.5 19.5 17.5C21.433 17.5 23.176 16.634 24 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);