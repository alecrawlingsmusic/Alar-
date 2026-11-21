// Newt section layers: editable chord blocks, lyrics, pitchless vocal rhythm and section orchestration.
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function normalizeLayers(section,parts,beats){
 if(!Array.isArray(section.chordBars))section.chordBars=Array.from({length:section.bars},(_,i)=>[{beat:1,duration:beats,symbol:(section.chords||'').split('|')[i]?.trim()||''}]);
 while(section.chordBars.length<section.bars)section.chordBars.push([{beat:1,duration:beats,symbol:''}]);
 section.chordBars.length=section.bars;
 if(typeof section.lyrics!=='string')section.lyrics='';
 if(typeof section.vocalRhythm!=='string')section.vocalRhythm='';
 if(!section.band||typeof section.band!=='object')section.band={};
 for(const p of parts)if(!section.band[p])section.band[p]='playing';
}
export function renderLayers(s,i,parts,beats){
 normalizeLayers(s,parts,beats);
 const bars=s.chordBars.map((bar,b)=>'<div class="nl-bar"><div class="nl-bar-title">BAR '+(b+1)+'</div><div class="nl-beatgrid">'+Array.from({length:beats},(_,beat)=>{const at=bar.filter(x=>x.beat>=beat+1&&x.beat<beat+2).sort((a,z)=>a.beat-z.beat);const split=at.some(x=>x.beat%1!==0);const first=at.find(x=>x.beat===beat+1);const second=at.find(x=>x.beat===beat+1.5);const cell=(ch,pos)=>'<input data-nl-slot="'+i+':'+b+':'+pos+'" aria-label="Bar '+(b+1)+' beat '+pos+'" value="'+e(ch?.symbol||'')+'" placeholder="·">';return '<div class="nl-beat"><div class="nl-beathead"><span>'+ (beat+1)+'</span><button type="button" data-nl-toggle="'+i+':'+b+':'+beat+'" title="'+(split?'Merge beat':'Split beat into eighths')+'">'+(split?'½×':'½+')+'</button></div><div class="nl-beatcells">'+cell(first,beat+1)+(split?cell(second,beat+1.5):'')+'</div></div>'}).join('')+'</div></div>').join('');
 const roster=parts.map(p=>'<label class="nl-part"><span>'+e(p)+'</span><select data-nl-band="'+i+'" data-part="'+e(p)+'">'+['playing','tacet','cue'].map(v=>'<option value="'+v+'" '+(s.band[p]===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>').join('');
 return '<div class="nl-workspace"><h4>Harmony · chord blocks</h4><p class="note">Enter chords in individual blocks. Four beats per bar. Tap ½+ to split any beat into two eighth-note chord slots. Blank slots sustain the preceding harmony.</p>'+bars+'<h4>Lyrics</h4><textarea data-nl-lyrics="'+i+'" rows="3" placeholder="Paste or type lyrics; use hyphens to split syllables">'+e(s.lyrics)+'</textarea><h4>Vocal rhythm · no pitch required</h4><textarea data-nl-rhythm="'+i+'" rows="2" placeholder="Walk/8 ing/8 down/4 R/8 the/8 road/4">'+e(s.vocalRhythm)+'</textarea><p class="note">Use /4 quarter, /8 eighth, /2 half, /1 whole, dots (/4.), R/8 rest, | bar line. Each space creates a rhythm event. Pitch can be added later.</p><div class="nl-preview" id="nl-preview-'+i+'"></div><h4>Band · this section</h4><div class="nl-roster">'+roster+'</div></div>';
}
export function bindLayers(root,draft,store,rerender){
 const section=(i)=>draft.sections[+i];
 root.querySelectorAll('[data-nl-slot]').forEach(el=>el.oninput=()=>{const [i,b,beat]=el.dataset.nlSlot.split(':').map(Number);const bar=section(i).chordBars[b];let chord=bar.find(x=>x.beat===beat);if(!chord){chord={beat,duration:beat%1?.5:1,symbol:''};bar.push(chord);bar.sort((a,z)=>a.beat-z.beat)}chord.symbol=el.value;store()});
 root.querySelectorAll('[data-nl-toggle]').forEach(el=>el.onclick=()=>{const [i,b,idx]=el.dataset.nlToggle.split(':').map(Number),bar=section(i).chordBars[b],beat=idx+1;const half=bar.find(x=>x.beat===beat+.5);if(half){bar.splice(bar.indexOf(half),1);const whole=bar.find(x=>x.beat===beat);if(whole)whole.duration=1}else{let whole=bar.find(x=>x.beat===beat);if(!whole){whole={beat,duration:.5,symbol:''};bar.push(whole)}whole.duration=.5;bar.push({beat:beat+.5,duration:.5,symbol:''})}bar.sort((a,z)=>a.beat-z.beat);store();rerender()});
 root.querySelectorAll('[data-nl-lyrics]').forEach(el=>el.oninput=()=>{section(el.dataset.nlLyrics).lyrics=el.value;store();preview(+el.dataset.nlLyrics)});
 root.querySelectorAll('[data-nl-rhythm]').forEach(el=>el.oninput=()=>{section(el.dataset.nlRhythm).vocalRhythm=el.value;store();preview(+el.dataset.nlRhythm)});
 root.querySelectorAll('[data-nl-band]').forEach(el=>el.onchange=()=>{section(el.dataset.nlBand).band[el.dataset.part]=el.value;store()});
 function preview(i){const s=section(i),words=s.lyrics.trim().split(/\s+/).filter(Boolean),events=s.vocalRhythm.trim().split(/\s+/).filter(Boolean);const out=root.querySelector('#nl-preview-'+i);if(out)out.innerHTML='<strong>Rhythm sketch</strong><div class="nl-events">'+events.map((x,j)=>'<span class="nl-event"><b>'+e(x)+'</b><small>'+e(words[j]||'·')+'</small></span>').join('')+'</div><small>'+words.length+' lyric tokens · '+events.length+' rhythm events. Rests and melismas may need manual alignment.</small>'}
 draft.sections.forEach((_,i)=>preview(i));
}
