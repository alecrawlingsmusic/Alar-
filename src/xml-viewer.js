import {renderStructuralScore} from './structural-score.js';
// Live MusicXML preview for Newt. The XML is generated from the current draft.
let toolkitPromise;
let viewerOpen=false,viewerMode='score';
const timeout=(promise,ms,label)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+' timed out after '+Math.round(ms/1000)+' seconds')),ms))]);
const getToolkit=()=>{
 if(!toolkitPromise)toolkitPromise=new Promise((resolve,reject)=>{
  const ready=()=>{
   const api=window.verovio;
   if(!api?.toolkit||!api?.module){reject(new Error('Verovio browser library did not initialize'));return}
   const mod=api.module;
   if(mod.calledRun||mod.runtimeInitialized||mod._vrvToolkit_constructor){resolve(api);return}
   const previous=mod.onRuntimeInitialized;
   mod.onRuntimeInitialized=()=>{if(typeof previous==='function')previous();resolve(api)};
  };
  if(window.verovio?.module){ready();return}
  const script=document.createElement('script');
  script.src='https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js';
  script.async=true;
  script.onload=ready;
  script.onerror=()=>reject(new Error('Unable to download Verovio from verovio.org'));
  document.head.appendChild(script);
 }).catch(err=>{toolkitPromise=null;throw err});
 return toolkitPromise;
};
const escapeHtml=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export function mountXmlViewer(root,getXml){
 let open=viewerOpen,mode=viewerMode,page=1,tk=null,lastXml='',revision=0;
 const panel=document.createElement('section');
 panel.className='xml-viewer';
 panel.innerHTML='<button type="button" class="xml-viewer-toggle" aria-expanded="false">♬ Preview MusicXML score</button><div class="xml-viewer-content" hidden><div class="xml-viewer-bar"><div class="xml-viewer-tabs"><button type="button" data-xml-mode="score" class="active">Score preview</button><button type="button" data-xml-mode="source">MusicXML source</button></div><button type="button" data-xml-refresh>↻ Refresh</button></div><p class="xml-viewer-status" role="status"></p><div class="xml-viewer-output"></div><div class="xml-viewer-pages"><button type="button" data-xml-prev>← Previous</button><span class="xml-viewer-count"></span><button type="button" data-xml-next>Next →</button></div><p class="note">Score preview is a simplified structural rendering, not full Verovio engraving. It shows the current exported MusicXML. Newt currently exports a structural score with rests, rehearsal marks and basic chord symbols; lyric and vocal-rhythm engraving is not yet implemented.</p></div>';
 root.appendChild(panel);
 panel.querySelector('.xml-viewer-content').hidden=!open;
 panel.querySelector('.xml-viewer-toggle').setAttribute('aria-expanded',String(open));
 panel.querySelectorAll('[data-xml-mode]').forEach(b=>b.classList.toggle('active',b.dataset.xmlMode===mode));
 const $=s=>panel.querySelector(s),status=$('.xml-viewer-status'),output=$('.xml-viewer-output'),pages=$('.xml-viewer-pages');
 async function update(){
  if(!open)return;
  const version=++revision;
  let xml;
  try{if(typeof getXml!=='function')throw new Error('MusicXML generator is not connected');xml=getXml();if(typeof xml!=='string'||!xml.includes('<score-partwise'))throw new Error('Generator did not return a MusicXML score')}catch(e){status.textContent='Unable to generate MusicXML: '+e.message;output.innerHTML='';pages.hidden=true;return}
  if(mode==='source'){
   status.textContent='Generated MusicXML source · '+new Blob([xml]).size+' bytes';
   output.innerHTML='<pre class="xml-viewer-source"><code>'+escapeHtml(xml)+'</code></pre>';
   pages.hidden=true;return;
  }
  pages.hidden=true;
  try{
   const svg=renderStructuralScore(xml);
   if(version!==revision)return;
   output.innerHTML='<div class="xml-viewer-sheet">'+svg+'</div>';
   status.textContent='Instant structural score preview · measures, chord symbols and rests';
  }catch(e){
   status.textContent='Score preview unavailable: '+e.message+'. Showing MusicXML source.';
   mode='source';viewerMode='source';
   panel.querySelectorAll('[data-xml-mode]').forEach(x=>x.classList.toggle('active',x.dataset.xmlMode==='source'));
   output.innerHTML='<pre class="xml-viewer-source"><code>'+escapeHtml(xml)+'</code></pre>';
  }
 }
 $('.xml-viewer-toggle').onclick=()=>{open=!open;viewerOpen=open;$('.xml-viewer-content').hidden=!open;$('.xml-viewer-toggle').setAttribute('aria-expanded',String(open));if(open)update()};
 panel.querySelectorAll('[data-xml-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.xmlMode;viewerMode=mode;panel.querySelectorAll('[data-xml-mode]').forEach(x=>x.classList.toggle('active',x===b));update()});
 $('[data-xml-refresh]').onclick=()=>{lastXml='';update()};
 $('[data-xml-prev]').onclick=()=>{page=Math.max(1,page-1);update()};
 $('[data-xml-next]').onclick=()=>{page++;update()};
 if(open)update();
 return {refresh:update};
}
