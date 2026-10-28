import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createDocument,createOfficialMenu,createFakeHost,loadBundle,settle} from './harness.mjs';
const before=fileURLToPath(new URL('./fixtures/personal2-client.js',import.meta.url));
const after=fileURLToPath(new URL('../lib/client.js',import.meta.url));
function dom(node){return {tag:node.tagName,attrs:[...node.attributes].sort(),style:Object.fromEntries(Object.entries(node.style).filter(([,v])=>v!==undefined)),text:node._text,children:node.children.map(dom)}}
async function capture(file,effort){
 const doc=createDocument(),menu=createOfficialMenu(doc,{effortLabel:effort});
 const bundle=loadBundle(file,doc),host=createFakeHost({effort});
 bundle.plugin.apply(host.ctx);bundle.react.mount(host.registered[0].Component,{sessionId:'unchanged-deepseek'},menu.composer);await settle();
 const snapshot={root:dom(bundle.react.find('root')),rowStyle:{...menu.effortRow.style},valueColor:menu.effortValueEl.style.color,seatColor:menu.seatEffortEl.style.color,css:bundle.plugin.__internals.CSS};
 bundle.react.unmount();return snapshot;
}
for(const effort of ['off','low','high','max']){
 const a=await capture(before,effort),b=await capture(after,effort);
 assert.ok(b.css.startsWith(a.css),'all existing CSS rules must remain byte-for-byte unchanged');
 delete a.css;delete b.css;assert.deepEqual(b,a,'DeepSeek '+effort+' DOM, visual variables, particles, timing, and colors must not change');
}
console.log('DeepSeek before/after DOM and animation parameters identical at all four levels');
