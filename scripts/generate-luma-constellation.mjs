import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
// Trace only the USDC glyph boundaries with stars; no filled logo or connecting lines.
const paths=[...readFileSync('public/brand/usdc.svg','utf8').matchAll(/<path d="([^"]+)"/g)].slice(1).map(m=>m[1]);
let seed=481;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function outline(d) {
 const tokens=d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g);
 let i=0,x=0,y=0,start=[0,0];const points=[];
 const n=()=>Number(tokens[i++]);
 const add=(a,b)=>{x=a;y=b;points.push([(a-48)*17+1024,(b-48)*17+970]);};
 while(i<tokens.length) {
  const cmd=tokens[i++];
  if(cmd==='M') {const a=n(),b=n();start=[a,b];add(a,b);}
  else if(cmd==='L') add(n(),n());
  else if(cmd==='H') add(n(),y);
  else if(cmd==='V') add(x,n());
  else if(cmd==='Z') add(...start);
  else if(cmd==='C') {const x0=x,y0=y,a=n(),b=n(),c=n(),e=n(),f=n(),g=n();for(let j=1;j<=24;j++){const t=j/24,u=1-t;add(u*u*u*x0+3*u*u*t*a+3*u*t*t*c+t*t*t*f,u*u*u*y0+3*u*u*t*b+3*u*t*t*e+t*t*t*g);}}
  else throw Error(`Unsupported path command ${cmd}`);
 }
 const sampled=[points[0]];let remaining=25+random()*35;
 for(let j=1;j<points.length;j++) {let [a,b]=points[j-1];const [c,d]=points[j];let length=Math.hypot(c-a,d-b);while(length>=remaining){const t=remaining/length;a+=(c-a)*t;b+=(d-b)*t;sampled.push([a,b]);length=Math.hypot(c-a,d-b);remaining=20+random()*42;}remaining-=length;}
 // Avoid a doubled star at the closed contour seam.
 if(Math.hypot(sampled.at(-1)[0]-sampled[0][0],sampled.at(-1)[1]-sampled[0][1])<20) sampled.pop();
 return sampled;
}
const nodes=paths.flatMap(outline).filter(()=>random()>.1).map(([x,y])=>[x+(random()-.5)*32,y+(random()-.5)*32]);
const backgroundStars=Array.from({length:90},()=>`<circle cx="${80+random()*1888}" cy="${60+random()*1670}" r="${.5+random()}" fill="#eefaff" opacity="${.1+random()*.22}"/>`).join('');
const stars=nodes.map(([x,y])=>{
 const major=random()<.17,r=major?2.5+random()*2.2:1.1+random()*2.2,flare=major?7+random()*8:4;
 const halo=major?32+random()*23:14+random()*22;
 return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})" opacity="${major?.8+random()*.2:.3+random()*.65}"><circle r="${halo}" fill="url(#halo)"/><circle r="${major?9:3+random()*4}" fill="#dcf8ff" opacity=".65" filter="url(#bloom)"/><circle r="${r}" fill="#f4fcff"/>${major?`<path d="M0-${flare}Q1.7-1.7 ${flare} 0Q1.7 1.7 0 ${flare}Q-1.7 1.7-${flare} 0Q-1.7-1.7 0-${flare}Z" fill="#f2fcff" transform="rotate(${random()*35-17})"/>`:''}</g>`;
}).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048" fill="none">
<title>USDC written in stars — Luma</title><desc>A glowing star constellation tracing the full outline of the USDC symbol, with no connecting lines, against Luma's gradient.</desc>
<defs>
<linearGradient id="bg" x2="0" y2="1"><stop stop-color="#06162b"/><stop offset=".38" stop-color="#173a55"/><stop offset=".6" stop-color="#254c6c"/><stop offset=".91" stop-color="#87b3bc"/><stop offset="1" stop-color="#dfcca1"/></linearGradient>
<radialGradient id="halo"><stop stop-color="#e4faff" stop-opacity=".6"/><stop offset=".18" stop-color="#c8f0fb" stop-opacity=".24"/><stop offset=".5" stop-color="#9bd7e9" stop-opacity=".06"/><stop offset="1" stop-color="#87b3bc" stop-opacity="0"/></radialGradient>
<filter id="bloom" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
<path d="M0 0h2048v2048H0z" fill="url(#bg)"/>
${backgroundStars}${stars}
</svg>`;
mkdirSync('public/social',{recursive:true});writeFileSync('public/social/luma-usdc-constellation.svg',svg);
console.log(`Created 2048 × 2048 dotted constellation with ${nodes.length} stars.`);
