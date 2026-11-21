// Fast dependency-free structural notation preview for MusicXML.
// This displays measures, staves, rests and chord symbols without WebAssembly.
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
export function renderStructuralScore(xml){
 const doc=new DOMParser().parseFromString(xml,'application/xml');
 if(doc.querySelector('parsererror'))throw new Error('MusicXML parsing failed');
 const partNodes=[...doc.querySelectorAll('score-part')];
 const parts=[...doc.querySelectorAll('part')];
 if(!parts.length)throw new Error('No MusicXML parts found');
 const count=Math.max(...parts.map(p=>p.querySelectorAll(':scope > measure').length));
 const barsPerLine=3,barWidth=210,left=160,rowHeight=112,top=70;
 const rows=Math.ceil(count/barsPerLine);
 const width=left+barsPerLine*barWidth+35;
 const height=top+parts.length*rows*rowHeight+45;
 let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Structural MusicXML score">';
 svg+='<rect width="100%" height="100%" fill="white"/>';
 const title=doc.querySelector('work-title, movement-title')?.textContent||'Newt score';
 svg+='<text x="'+width/2+'" y="34" text-anchor="middle" font-family="Georgia,serif" font-size="23" fill="#171717">'+esc(title)+'</text>';
 parts.forEach((part,pi)=>{
  const name=partNodes[pi]?.querySelector('part-name')?.textContent||'Part '+(pi+1);
  const measures=[...part.querySelectorAll(':scope > measure')];
  for(let line=0;line<rows;line++){
   const y=top+(pi*rows+line)*rowHeight;
   svg+='<text x="10" y="'+(y+30)+'" font-family="Georgia,serif" font-size="12" fill="#222">'+esc(name.slice(0,22))+'</text>';
   for(let i=0;i<5;i++)svg+='<line x1="'+left+'" y1="'+(y+i*9)+'" x2="'+(left+barsPerLine*barWidth)+'" y2="'+(y+i*9)+'" stroke="#333" stroke-width=".9"/>';
   for(let bi=0;bi<barsPerLine;bi++){
    const m=measures[line*barsPerLine+bi];if(!m)continue;
    const x=left+bi*barWidth;
    svg+='<line x1="'+x+'" y1="'+y+'" x2="'+x+'" y2="'+(y+36)+'" stroke="#222"/>';
    svg+='<text x="'+(x+7)+'" y="'+(y-11)+'" font-size="11" fill="#555">'+esc(m.getAttribute('number')||String(line*barsPerLine+bi+1))+'</text>';
    const harmonies=[...m.querySelectorAll('harmony')];
    harmonies.forEach((h,hi)=>{const root=h.querySelector('root-step')?.textContent||'';const alter=Number(h.querySelector('root-alter')?.textContent||0);const kind=h.querySelector('kind')?.getAttribute('text')||'';const bass=h.querySelector('bass-step')?.textContent;const symbol=root+(alter===1?'#':alter===-1?'b':'')+kind+(bass?'/'+bass:'');svg+='<text x="'+(x+14+hi*65)+'" y="'+(y-26)+'" font-size="13" font-weight="bold" fill="#222">'+esc(symbol)+'</text>'});
    const rest=m.querySelector('note rest');if(rest)svg+='<rect x="'+(x+barWidth/2-8)+'" y="'+(y+18)+'" width="16" height="4" fill="#222"/>';
    const rehearsal=m.querySelector('rehearsal')?.textContent;if(rehearsal)svg+='<text x="'+(x+12)+'" y="'+(y-45)+'" font-size="12" fill="#333">'+esc(rehearsal)+'</text>';
   }
   svg+='<line x1="'+(left+barsPerLine*barWidth)+'" y1="'+y+'" x2="'+(left+barsPerLine*barWidth)+'" y2="'+(y+36)+'" stroke="#222"/>';
  }
 });
 return svg+'</svg>';
}
