import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
// Abstract engraved currency motif, deliberately separate from the official token asset.
const engraving = 'M34 17C9 28 9 68 34 79 M62 17C87 28 87 68 62 79 M60 34C57 24 34 25 34 39C34 53 62 43 62 58C62 72 37 72 34 61 M48 21V77';
const mark = readFileSync('lib/luma-brand.ts', 'utf8').match(/LUMA_MARK_PATH = '([^']+)'/)[1];
let coinId = 0;
function tile(x, y, size, angle, opacity = 1) {
  const id = ++coinId;
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(1 .94)" opacity="${opacity}">
    <defs><clipPath id="coin${id}"><circle r="${size*.465}"/></clipPath></defs>
    <circle cy="18" r="${size*.46}" fill="#020c1b" opacity=".6" filter="url(#shadow)"/>
    <circle cy="7" r="${size*.48}" fill="url(#edge)" stroke="#87b3bc" stroke-opacity=".45"/>
    <circle r="${size*.48}" fill="url(#rim)"/>
    <circle r="${size*.465}" fill="url(#coinSurface)"/>
    <g transform="translate(${-size*.38} ${-size*.38}) scale(${size*.76/96})" fill="none" stroke-linecap="round">
      <path d="${engraving}" stroke="#020d1d" stroke-opacity=".8" stroke-width="2.2" transform="translate(0 1.2)"/>
      <path d="${engraving}" stroke="url(#etched)" stroke-width="1.25"/>
    </g>
    <g clip-path="url(#coin${id})">
      <circle r="${size*.47}" fill="url(#faceLight)"/>
      <ellipse cx="${-size*.12}" cy="${-size*.37}" rx="${size*.57}" ry="${size*.29}" transform="rotate(-24)" fill="url(#gloss)" opacity=".3"/>
    </g>
    <circle r="${size*.467}" stroke="url(#rim)" stroke-width="1.5"/>
    <path d="M${-size*.42} ${-size*.22} A${size*.477} ${size*.477} 0 0 1 ${size*.23} ${-size*.415}" stroke="#eefaff" stroke-opacity=".8" stroke-width="2.5" stroke-linecap="round"/>
  </g>`;
}
const rings=[{r:420,glow:.1,line:.3,width:5},{r:680,glow:.4,line:.65,width:10},{r:940,glow:.9,line:1,width:18}].map(({r,glow,line,width})=>`<circle cx="960" cy="1100" r="${r}" stroke="url(#orbit)" stroke-width="${width}" opacity="${glow}" filter="url(#glow)"/><circle cx="960" cy="1100" r="${r}" stroke="url(#orbit)" opacity="${line}" stroke-width="${r===940 ? 2.5 : 1.5}"/>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" fill="none">
<title>Luma launch — abstract currency in orbit</title><desc>Dark reflective coins with fine engraved currency outlines, arranged on luminous rings over a midnight navy gradient.</desc>
<defs>
<radialGradient id="coinSurface" cx=".22" cy=".13" r="1"><stop stop-color="#7095a6"/><stop offset=".32" stop-color="#325774"/><stop offset=".7" stop-color="#102c46"/><stop offset="1" stop-color="#061629"/></radialGradient>
<linearGradient id="etched" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#ecfcff" stop-opacity=".9"/><stop offset=".4" stop-color="#a6d0d9" stop-opacity=".65"/><stop offset=".72" stop-color="#87b3bc" stop-opacity=".3"/><stop offset="1" stop-color="#dfcca1" stop-opacity=".8"/></linearGradient>
<linearGradient id="bg" x2=".6" y2="1"><stop stop-color="#030c1b"/><stop offset=".5" stop-color="#06162b"/><stop offset="1" stop-color="#254c6c"/></linearGradient>
<radialGradient id="atmosphere"><stop stop-color="#87b3bc" stop-opacity=".32"/><stop offset=".6" stop-color="#87b3bc" stop-opacity=".08"/><stop offset="1" stop-color="#87b3bc" stop-opacity="0"/></radialGradient>
<radialGradient id="warm"><stop stop-color="#dfcca1" stop-opacity=".17"/><stop offset="1" stop-color="#dfcca1" stop-opacity="0"/></radialGradient>
<linearGradient id="orbit" gradientUnits="userSpaceOnUse" x1="960" y1="150" x2="960" y2="1120"><stop stop-color="#d8f7ff"/><stop offset=".45" stop-color="#9edbe9" stop-opacity=".8"/><stop offset="1" stop-color="#87b3bc" stop-opacity=".12"/></linearGradient>
<radialGradient id="faceLight" cx=".24" cy=".13" r=".93"><stop stop-color="#b5eeff" stop-opacity=".35"/><stop offset=".45" stop-color="#174689" stop-opacity="0"/><stop offset="1" stop-color="#020c24" stop-opacity=".65"/></radialGradient>
<linearGradient id="gloss" x2=".5" y2="1"><stop stop-color="#fff" stop-opacity=".7"/><stop offset=".65" stop-color="#d1f2ff" stop-opacity=".2"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bddde6" stop-opacity=".27"/><stop offset=".45" stop-color="#376080" stop-opacity=".7"/><stop offset="1" stop-color="#0a203b" stop-opacity=".95"/></linearGradient>
<linearGradient id="rim" x2=".8" y2="1"><stop stop-color="#e7faff" stop-opacity=".85"/><stop offset=".5" stop-color="#87b3bc" stop-opacity=".2"/><stop offset="1" stop-color="#c8e3e8" stop-opacity=".55"/></linearGradient>
<linearGradient id="edge" x2="0" y2="1"><stop stop-color="#395f76"/><stop offset="1" stop-color="#0b2036"/></linearGradient>
<linearGradient id="silver" x2=".6" y2="1"><stop stop-color="#fff"/><stop offset=".45" stop-color="#c0dbe0"/><stop offset="1" stop-color="#7fa4b3"/></linearGradient>
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
</defs>
<path d="M0 0h1920v1080H0z" fill="url(#bg)"/>
<ellipse cx="1020" cy="970" rx="1080" ry="940" fill="url(#atmosphere)"/>
<ellipse cx="1730" cy="1170" rx="700" ry="530" fill="url(#warm)"/>
${rings}
${tile(122,675,212,-18,.8)}
${tile(458,306,238,12)}
${tile(1110,177,250,-11)}
${tile(1680,496,252,17)}
${tile(397,719,213,10)}
${tile(858,428,247,-13)}
${tile(1480,667,225,14)}
${tile(690,778,203,-14)}
${tile(1170,736,214,14)}
<ellipse cx="960" cy="1024" rx="210" ry="125" fill="url(#atmosphere)"/>
<svg x="866" y="906" width="188" height="133" viewBox="94 165 544 385"><path d="${mark}" fill="url(#silver)"/></svg>
</svg>`;
mkdirSync('public/social',{recursive:true});
writeFileSync('public/social/luma-launch-orbits.svg',svg);
console.log('Created Luma orbital launch graphic: 1920 × 1080.');
