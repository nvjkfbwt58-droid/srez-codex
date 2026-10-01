import type {ReactNode} from 'react';
type Props={size?:number;className?:string};
// Original web glyphs: consistent 24-unit grid, optical inset, round terminals.
const glyph=(drawing:ReactNode)=>function SrezIcon({size=22,className=''}:Props){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={'srez-nav-icon '+className}>{drawing}</svg>;};
export const SrezNavIcons={
 home:glyph(<><path d="m3.5 10 7-6a2.3 2.3 0 0 1 3 0l7 6M5.5 9v10a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M9.5 20.5v-6h5v6"/></>),
 customers:glyph(<><circle cx="9" cy="7.5" r="3"/><path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20ZM16 4.8a3 3 0 0 1 0 5.6M17.5 13.2a5 5 0 0 1 3 4.6V20"/></>),
 campaigns:glyph(<><path d="M4 9h4l10-4v14L8 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1ZM8 9v6M6 15l1.5 5h3L9 15.4M21 10v4"/></>),
 coupons:glyph(<><path d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v2a3 3 0 0 0 0 6v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17v-2a3 3 0 0 0 0-6V7a1.5 1.5 0 0 1 1.5-1.5Z"/><path d="M14.5 8.5v1M14.5 11.5v1M14.5 14.5v1"/></>),
 results:glyph(<><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m7 15 3.5-3.5 3 2 3.5-5M14 8.5h3v3"/></>),
 stores:glyph(<><path d="M18.5 9.5c0 5-6.5 11-6.5 11S5.5 14.5 5.5 9.5a6.5 6.5 0 0 1 13 0Z"/><circle cx="12" cy="9.5" r="2.25"/></>),
 partners:glyph(<><path d="m10 8 2.5-2.5a4.25 4.25 0 0 1 6 6L16 14M8 10l-2.5 2.5a4.25 4.25 0 0 0 6 6L14 16M8.5 15.5l7-7"/></>),
 brand:glyph(<><rect x="4" y="3" width="7" height="18" rx="2.5"/><path d="m11 6.5 6-1.6a2 2 0 0 1 2.4 1.4l.9 3.4a2 2 0 0 1-1.4 2.4L11 14.2M11 13.5h7.5a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11"/><circle cx="7.5" cy="17.5" r=".8" fill="currentColor" stroke="none"/></>),
 assistant:glyph(<><path d="M6 4.5h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 3v-3a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z"/><path d="m12 8 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/></>),
 data:glyph(<><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="M3.5 9h17M9 9v11M9 14.5h11"/></>),
};
