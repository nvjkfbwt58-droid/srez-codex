// A local schematic, deliberately labelled as such. No remote tiles or GPU required.
export function MapSchematic({mini=false}:{mini?:boolean}){
 return <svg className="map-schematic" viewBox="0 0 1000 780" preserveAspectRatio="none" aria-hidden="true">
  <defs><pattern id={mini?'city-grid-mini':'city-grid'} width="74" height="65" patternUnits="userSpaceOnUse" patternTransform="rotate(-19)"><rect width="74" height="65" fill="#eaece4"/><rect x="8" y="8" width="57" height="47" rx="7" fill="#f0f0e9" stroke="#e0e2d9" strokeWidth=".7"/><path d="M0 0H74 M0 0V65" stroke="#fafaf5" strokeWidth="6"/></pattern></defs>
  <rect width="1000" height="780" fill={`url(#${mini?'city-grid-mini':'city-grid'})`}/>
  <g fill="#cedbc5" stroke="#c1d1b7" strokeWidth="1.3" opacity=".85"><path d="M23 30L279 0 250 124 172 157 112 97 27 160Z"/><path d="M768 40L977 3 1000 180 920 206 828 147Z"/><path d="M676 523L782 461 877 537 850 614 937 692 772 723 701 645Z"/><path d="M83 423L215 441 254 535 196 612 64 546Z"/><path d="M434 475L502 453 560 497 526 555 434 555 401 517Z"/></g>
  <path d="M35-30C189 65 127 110 263 148S267 260 192 294 235 397 324 350 381 274 444 345 528 407 571 361 721 360 719 467 633 534 712 594 882 606 893 817" stroke="#f6f7ef" strokeWidth="38" fill="none"/>
  <path d="M35-30C189 65 127 110 263 148S267 260 192 294 235 397 324 350 381 274 444 345 528 407 571 361 721 360 719 467 633 534 712 594 882 606 893 817" stroke="#b8d0d3" strokeWidth="26" fill="none"/>
  <g fill="none" stroke="#d6d7cb" strokeWidth="14"><ellipse cx="524" cy="290" rx="306" ry="224" transform="rotate(-13 524 290)"/><ellipse cx="524" cy="299" rx="130" ry="106"/><path d="M502 780L529 391 551 279 430-20M-30 220L405 312 553 302 1000 163M51 629L431 374 554 292 961 20M-20 410L405 350 562 359 1010 425"/></g>
  <g fill="none" stroke="#fffdf4" strokeWidth="9"><ellipse cx="524" cy="290" rx="306" ry="224" transform="rotate(-13 524 290)"/><ellipse cx="524" cy="299" rx="130" ry="106"/><path d="M502 780L529 391 551 279 430-20M-30 220L405 312 553 302 1000 163M51 629L431 374 554 292 961 20M-20 410L405 350 562 359 1010 425"/></g>
  <g fill="none" stroke="#c9cbbc" strokeWidth="1.2" strokeDasharray="3 5"><path d="M205-10L408 263 412 445 324 780M887-20L748 302 762 639 819 780"/></g>
  {!mini&&<g fontFamily="Inter, sans-serif" fill="#859180" fontSize="11" letterSpacing="2"><text x="830" y="102">ЛЕСОПАРК</text><text x="91" y="505">ПАРК</text><text x="499" y="322" fill="#92938b" fontSize="18" letterSpacing="4">МОСКВА</text><text x="734" y="583">ПАРК</text><text x="310" y="277" fill="#77959a" fontSize="10" transform="rotate(-24 310 277)">МОСКВА-РЕКА</text></g>}
 </svg>;
}
