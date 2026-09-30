import type {ReactNode} from 'react';
type Props={size?:number;className?:string};
const glyph=(drawing:ReactNode)=>function SrezIcon({size=22,className=''}:Props){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={'srez-nav-icon '+className}>{drawing}</svg>;};
export const SrezNavIcons={
 home:glyph(<><rect x="3" y="3" width="7" height="11" rx="2" fill="currentColor" fillOpacity=".14"/><rect x="14" y="3" width="7" height="6" rx="2"/><rect x="14" y="13" width="7" height="8" rx="2" fill="currentColor" fillOpacity=".14"/><path d="M3 18h7M3 21h4"/></>),
 customers:glyph(<><circle cx="9" cy="8" r="3.5" fill="currentColor" fillOpacity=".14"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M19 15c2 1 2 3 2 5"/><path d="M5 20h8"/></>),
 campaigns:glyph(<><rect x="3" y="5" width="18" height="15" rx="4" fill="currentColor" fillOpacity=".1"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="m9 13 6 3-6 3z" fill="currentColor" stroke="none"/></>),
 coupons:glyph(<><path d="M4 3h11l6 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" fill="currentColor" fillOpacity=".12"/><path d="M15 3v6h6M8 17l5-5"/><circle cx="8" cy="12" r=".75" fill="currentColor"/><circle cx="13" cy="17" r=".75" fill="currentColor"/></>),
 results:glyph(<><circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity=".1"/><path d="m6 13 4 3 7-8M13 8h4v4"/></>),
 stores:glyph(<><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" fill="currentColor" fillOpacity=".12"/><path d="M9 3v16M15 5v16"/><circle cx="12" cy="11" r="2.2" fill="var(--surface,#fff)"/><path d="m12 13.2 0 2"/></>),
 partners:glyph(<><rect x="3" y="5" width="11" height="11" rx="3" fill="currentColor" fillOpacity=".14"/><rect x="10" y="9" width="11" height="11" rx="3"/><path d="m8 10 8 5"/></>),
 brand:glyph(<><path d="m12 3 9 9-9 9-9-9Z" fill="currentColor" fillOpacity=".12"/><path d="m8 12 4-4 4 4-4 4Z"/><path d="M12 3v5M16 12h5"/></>),
 assistant:glyph(<><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="currentColor" fillOpacity=".12"/><path d="M7 11h2l2-4 2 8 2-4h2"/></>),
 data:glyph(<><rect x="4" y="3" width="16" height="18" rx="3" fill="currentColor" fillOpacity=".1"/><path d="M4 9h16M10 9v12M4 15h16"/><path d="M8 6h3"/></>),
};
