import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const usdc = readFileSync('public/brand/usdc.svg', 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
let counter = 0;
function coin(x,y,size,angle,squash,blur=0,opacity=1) {
 const id=++counter;
 return `<g opacity="${opacity}" ${blur ? `filter="url(#blur${blur})"` : ''}><g transform="translate(${x} ${y}) rotate(${angle}) scale(1 ${squash})">
 <defs><clipPath id="face${id}"><circle r="${size*.46}"/></clipPath></defs>
 <ellipse cy="${size*.14}" rx="${size*.53}" ry="${size*.50}" fill="#020c1a" opacity=".45" filter="url(#shadow)"/>
 <circle cy="${size*.055}" r="${size*.5}" fill="url(#edge)" stroke="#8aacbd" stroke-width="1.5"/>
 <circle cy="${size*.037}" r="${size*.5}" fill="none" stroke="#d5e5e9" stroke-opacity=".45" stroke-width="2"/>
 <circle cy="${size*.014}" r="${size*.5}" fill="none" stroke="#06162b" stroke-opacity=".6" stroke-width="3"/>
 <circle r="${size*.5}" fill="url(#rim)" stroke="#dae9ed" stroke-opacity=".85" stroke-width="2"/>
 <g transform="translate(${-size*.466} ${-size*.466}) scale(${size*.932/96})">${usdc}</g>
 <g clip-path="url(#face${id})">
 <circle r="${size*.47}" fill="url(#faceShade)"/>
 <ellipse cx="${-size*.24}" cy="${-size*.38}" rx="${size*.66}" ry="${size*.29}" transform="rotate(-25)" fill="url(#reflection)"/>
 <path d="M${-size*.7} ${size*.09} Q0 ${-size*.27} ${size*.7} ${-size*.36} L${size*.7} ${-size*.43} Q0 ${-size*.35} ${-size*.7} ${-size*.03}Z" fill="url(#reflection)" opacity=".5"/>
 </g>
 <circle r="${size*.478}" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="1.7"/>
 <path d="M${-size*.455} ${-size*.20} A${size*.499} ${size*.499} 0 0 1 ${size*.29} ${-size*.40}" stroke="url(#highlight)" stroke-width="4" stroke-linecap="round"/>
 </g></g>`;
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="960" viewBox="0 0 2400 960" fill="none">
<title>Glossy USDC — abstract Luma article artwork</title><desc>Cinematic floating USDC coins, reflective surfaces and shallow depth of field. No lettering or branding overlays.</desc>
<defs>
<linearGradient id="bg" x1=".2" y1="0" x2=".8" y2="1"><stop stop-color="#06162b"/><stop offset=".5" stop-color="#254c6c"/><stop offset=".88" stop-color="#87b3bc"/><stop offset="1" stop-color="#dfcca1"/></linearGradient>
<radialGradient id="light"><stop stop-color="#d6e7e4" stop-opacity=".55"/><stop offset="1" stop-color="#87b3bc" stop-opacity="0"/></radialGradient>
<radialGradient id="vignette"><stop offset=".4" stop-color="#06162b" stop-opacity="0"/><stop offset="1" stop-color="#06162b" stop-opacity=".8"/></radialGradient>
<linearGradient id="rim" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#f2faf9"/><stop offset=".19" stop-color="#9bbccc"/><stop offset=".4" stop-color="#315872"/><stop offset=".51" stop-color="#d9e8ec"/><stop offset=".66" stop-color="#759aa9"/><stop offset="1" stop-color="#e4d7b8"/></linearGradient>
<linearGradient id="edge"><stop stop-color="#06162b"/><stop offset=".3" stop-color="#436a82"/><stop offset=".48" stop-color="#bcd9de"/><stop offset=".6" stop-color="#507487"/><stop offset="1" stop-color="#0b233d"/></linearGradient>
<radialGradient id="faceShade" cx=".27" cy=".15" r=".9"><stop stop-color="#d1f2ff" stop-opacity=".25"/><stop offset=".45" stop-color="#02102e" stop-opacity="0"/><stop offset="1" stop-color="#020c24" stop-opacity=".65"/></radialGradient>
<linearGradient id="reflection" x1="0" y1="0" x2=".6" y2="1"><stop stop-color="#fff" stop-opacity=".8"/><stop offset=".65" stop-color="#d7f2fa" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="highlight"><stop stop-color="#eefaff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></linearGradient>
<filter id="shadow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="24"/></filter>
${[3,8,18,25].map(n=>`<filter id="blur${n}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n}"/></filter>`).join('')}
</defs>
<path fill="url(#bg)" d="M0 0h2400v960H0z"/>
<ellipse cx="1450" cy="650" rx="1300" ry="780" fill="url(#light)"/>
<g stroke="#d8eef1" stroke-opacity=".025" stroke-width="110"><ellipse cx="1700" cy="-360" rx="1480" ry="1200"/><ellipse cx="1700" cy="-360" rx="1760" ry="1450"/></g>
${coin(490,130,200,-32,.65,8,.55)}
${coin(1630,70,170,30,.65,8,.55)}
${coin(2090,760,210,-20,.73,8,.65)}
${coin(675,490,390,32,.58,3)}
${coin(1780,385,430,-28,.60,3)}
${coin(1190,490,690,-22,.86)}
<path fill="url(#vignette)" d="M0 0h2400v960H0z"/>
${coin(30,930,950,-32,.70,18,.85)}
${coin(2450,100,830,38,.62,25,.75)}
</svg>`;
mkdirSync('public/social',{recursive:true});
writeFileSync('public/social/luma-usdc-article.svg',svg);
console.log('Created cinematic 2400 × 960 SVG.');
