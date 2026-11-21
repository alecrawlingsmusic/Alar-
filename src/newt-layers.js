// Newt section layers: editable chord blocks, lyrics, pitchless vocal rhythm and section orchestration.
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultChord=()=>[{beat:1,duration:4,symbol:''}];
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
 const bars=s.chordBars.map((bar,b)=>'<div class="nl-bar"><div class="nl-bar-title">BAR '+(b+1)+'</div><div class="nl-chordrow">'+bar.map((c,j)=>'<div class="nl-chord" style="flex:'+Math.max(.5,+c.duration||1)+'"><label>Chord<input aria-label="Chord bar '+(b+1)+' block '+(j+1)+'" data-nl-chord="'+i+':'+b+':'+j+'" value="'+e(c.symbol)+'" placeholder="Gmaj7"></label><label>Beat<input type="number" min="1" max="'+beats+'" step=".5" data-nl-beat="'+i+':'+b+':'+j+'" value="'+c.beat+'"></label><button type="button" data-nl-split="'+i+':'+b+':'+j+'">＋ Split</button>'+(bar.length>1?'<button type="button" data-nl-delete="'+i+':'+b+':'+j+'">×</button>':'')+'</div>').join('')+'</div></div>').join('');
 const roster=parts.map(p=>'<label class="nl-part"><span>'+e(p)+'</span><select data-nl-band="'+i+'" data-part="'+e(p)+'">'+['playing','tacet','cue'].map(v=>'<option value="'+v+'" '+(s.band[p]===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>').join('');
 return '<div class="nl-workspace"><h4>Harmony · chord blocks</h4><p class="note">Enter chords in individual blocks. Split for more changes; edit beat positions for placement.</p>'+bars+'<h4>Lyrics</h4><textarea data-nl-lyrics="'+i+'" rows="3" placeholder="Paste or type lyrics; use hyphens to split syllables">'+e(s.lyrics)+'</textarea><h4>Vocal rhythm · no pitch required</h4><textarea data-nl-rhythm="'+i+'" rows="2" placeholder="Walk/8 ing/8 down/4 R/8 the/8 road/4">'+e(s.vocalRhythm)+'</textarea><p class="note">Use /4 quarter, /8 eighth, /2 half, /1 whole, dots (/4.), R/8 rest, | bar line. Each space creates a rhythm event. Pitch can be added later.</p><div class="nl-preview" id="nl-preview-'+i+'"></div><h4>Band · this section</h4><div class="nl-roster">'+roster+'</div></div>';
}
export function bindLayers(root,draft,store,rerender){
 const section=(i)=>draft.sections[+i];
 root.querySelectorAll('[data-nl-chord]').forEach(el=>el.onchange=()=>{const [i,b,j]=el.dataset.nlChord.split(':').map(Number);section(i).chordBars[b][j].symbol=el.value;store()});
 root.querySelectorAll('[data-nl-beat]').forEach(el=>el.onchange=()=>{const [i,b,j]=el.dataset.nlBeat.split(':').map(Number);section(i).chordBars[b][j].beat=Math.min(draft.beats,Math.max(1,+el.value||1));store();rerender()});
 root.querySelectorAll('[data-nl-split]').forEach(el=>el.onclick=()=>{const [i,b,j]=el.dataset.nlSplit.split(':').map(Number);const bar=section(i).chordBars[b],ch=bar[j];const half=Math.max(.5,ch.duration/2);ch.duration=half;bar.splice(j+1,0,{beat:Math.min(draft.beats,ch.beat+half),duration:half,symbol:''});store();rerender()});
 root.querySelectorAll('[data-nl-delete]').forEach(el=>el.onclick=()=>{const [i,b,j]=el.dataset.nlDelete.split(':').map(Number);const bar=section(i).chordBars[b];if(bar.length>1){bar.splice(j,1);store();rerender()}});
 root.querySelectorAll('[data-nl-lyrics]').forEach(el=>el.oninput=()=>{section(el.dataset.nlLyrics).lyrics=el.value;store();preview(+el.dataset.nlLyrics)});
 root.querySelectorAll('[data-nl-rhythm]').forEach(el=>el.oninput=()=>{section(el.dataset.nlRhythm).vocalRhythm=el.value;store();preview(+el.dataset.nlRhythm)});
 root.querySelectorAll('[data-nl-band]').forEach(el=>el.onchange=()=>{section(el.dataset.nlBand).band[el.dataset.part]=el.value;store()});
 function preview(i){const s=section(i),words=s.lyrics.trim().split(/\s+/).filter(Boolean),events=s.vocalRhythm.trim().split(/\s+/).filter(Boolean);const out=root.querySelector('#nl-preview-'+i);if(out)out.innerHTML='<strong>Rhythm sketch</strong><div class="nl-events">'+events.map((x,j)=>'<span class="nl-event"><b>'+e(x)+'</b><small>'+e(words[j]||'·')+'</small></span>').join('')+'</div><small>'+words.length+' lyric tokens · '+events.length+' rhythm events. Rests and melismas may need manual alignment.</small>'}
 draft.sections.forEach((_,i)=>preview(i));
}
