const fs = require('fs');
const path = require('path');
const out = __dirname;
const mark = fs.readFileSync(path.join(out, '../../public/brand/luma-mark.svg'), 'utf8').match(/ d="([^"]+)"/)[1];
let seed = 73021;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const n = v => Number(v.toFixed(2));
const transform = p => [n(750 + (p[0] - 366) * 1.6), n(250 + (p[1] - 358) * 1.6)];
const tokens = mark.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g);
let i=0, p=[0,0], start, contour=[];
while(i<tokens.length){
  const cmd=tokens[i++];
  let end;
  if(cmd==='M'){p=[+tokens[i++],+tokens[i++]];start=[...p];contour.push(transform(p));continue;}
  if(cmd==='L') end=[+tokens[i++],+tokens[i++]];
  if(cmd==='H') end=[+tokens[i++],p[1]];
  if(cmd==='Z') end=start;
  if(cmd==='Q'){
    const c=[+tokens[i++],+tokens[i++]], q=[+tokens[i++],+tokens[i++]];
    for(let k=1;k<=16;k++){const t=k/16;contour.push(transform([((1-t)**2)*p[0]+2*(1-t)*t*c[0]+t*t*q[0],((1-t)**2)*p[1]+2*(1-t)*t*c[1]+t*t*q[1]]));}
    p=q;continue;
  }
  const dist=Math.hypot(end[0]-p[0],end[1]-p[1]);
  for(let k=1;k<=Math.ceil(dist/3);k++){const t=k/Math.ceil(dist/3);contour.push(transform([p[0]+t*(end[0]-p[0]),p[1]+t*(end[1]-p[1])]));}
  p=end;
}
let stars=[], carry=0, gap=15+rand()*26;
for(let j=1;j<contour.length;j++){
  carry+=Math.hypot(contour[j][0]-contour[j-1][0],contour[j][1]-contour[j-1][1]);
  if(carry>gap){
    const x=n(contour[j][0]+(rand()-.5)*15);
    const y=n(contour[j][1]+(rand()-.5)*15);
    const size=1.65+Math.pow(rand(),1.6)*3.9;
    if(stars.every(s=>Math.hypot(s[0]-x,s[1]-y)>12))stars.push([x,y,size]);
    carry=0;gap=15+rand()*26;
  }
}
const tips=[[366,176],[624,230],[624,486],[366,540],[108,486],[108,230]].map(transform);
stars=stars.filter(s=>tips.every(t=>Math.hypot(s[0]-t[0],s[1]-t[1])>13));
tips.forEach(t=>stars.push([...t,3.8+rand()*2.0]));
const sparkle=(x,y,r)=>`M ${n(x)} ${n(y-r)} Q ${n(x+r*.16)} ${n(y-r*.16)} ${n(x+r*.78)} ${n(y)} Q ${n(x+r*.16)} ${n(y+r*.16)} ${n(x)} ${n(y+r)} Q ${n(x-r*.16)} ${n(y+r*.16)} ${n(x-r*.78)} ${n(y)} Q ${n(x-r*.16)} ${n(y-r*.16)} ${n(x)} ${n(y-r)} Z`;
const star=(s,j)=>`<g id="Star-${String(j+1).padStart(3,'0')}"><circle cx="${s[0]}" cy="${s[1]}" r="${n(s[2]*4.8)}" fill="url(#starlight)"/><path d="${sparkle(...s)}" fill="#EFF7F7"/><circle cx="${s[0]}" cy="${s[1]}" r="${n(s[2]*.17)}" fill="#FFFFFF"/></g>`;
const ambient=[];
for(let j=0;j<35;j++){
  const x=n(65+rand()*1370),y=n(35+rand()*400);
  if(x>285&&x<1215)continue;
  ambient.push(`<circle cx="${x}" cy="${y}" r="${n(.55+rand()*.65)}" fill="#D5EBEE" opacity="${n(.16+rand()*.26)}"/>`);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 1500 500" fill="none">
<title>Luma constellation banner</title>
<desc>Editable vector artwork. Original Luma silhouette traced by individual stars. Glows are radial gradient vector circles. No embedded images, fonts, filters or external dependencies.</desc>
<defs>
<clipPath id="banner-frame"><rect width="1500" height="500"/></clipPath>
<linearGradient id="night" x1="750" y1="0" x2="750" y2="500" gradientUnits="userSpaceOnUse"><stop stop-color="#030F1C"/><stop offset=".48" stop-color="#224763"/><stop offset="1" stop-color="#568294"/></linearGradient>
<radialGradient id="starlight"><stop stop-color="#E5FAFF" stop-opacity=".6"/><stop offset=".15" stop-color="#C2E9F3" stop-opacity=".26"/><stop offset=".44" stop-color="#B5E3F0" stop-opacity=".075"/><stop offset="1" stop-color="#ACDEEF" stop-opacity="0"/></radialGradient>
</defs>
<g id="Background"><rect width="1500" height="500" fill="url(#night)"/></g>
<g id="Distant-stars">${ambient.join('\n')}</g>
<g id="Luma-constellation" clip-path="url(#banner-frame)">
<g id="Individual-stars">${stars.map(star).join('\n')}</g>
</g>
</svg>`;
fs.writeFileSync(path.join(out,'luma-constellation-banner-v2.svg'),svg);
console.log(`Saved 1500 × 500 SVG with ${stars.length} individually editable constellation stars.`);
const sharp=require('C:/Users/Jacob/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
sharp(Buffer.from(svg)).png().toFile(path.join(out,'luma-constellation-preview-v2.png'));
