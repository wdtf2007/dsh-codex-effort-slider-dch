const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const pluginRoot=process.env.PLUGIN_ROOT||(fs.existsSync(path.join(__dirname,'../lib/client.js'))?path.resolve(__dirname,'..'):path.resolve('work/slider-personal'));
const vendorRoot=process.env.BROWSER_VENDOR||path.resolve('work/browser-vendor');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:820,height:630},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent(`<!doctype html><meta charset="utf-8"><style>
 body{background:#f5f6f8;color:#202124;font:14px "Segoe UI",sans-serif;padding:32px}
 h2{font-size:18px}p{color:#596273;font-size:12px}.menu{width:330px;background:white;border:1px solid #e4e6eb;padding:7px;border-radius:12px;box-shadow:0 10px 35px #0001}
 button[role=menuitem]{box-sizing:border-box;width:100%;display:flex;align-items:center;gap:10px;border:0;border-radius:7px;background:transparent;color:inherit;padding:10px;font:inherit;text-align:left;cursor:pointer}
 button[role=menuitem]:hover{background:#f3f5f8}.codexModelSelectCellLabel{flex:1}.codexModelSelectCellValue{color:#6b7280}.chevron{color:#9096a1}
 #composer{margin-top:22px}#seat{background:white;border:1px solid #ddd;border-radius:7px;padding:8px 12px}
 </style><h2>DSH 滑块兼容版 · 浅色界面验证</h2><p>隔离浏览器中的真实插件组件；模型目录与宿主写回为测试夹具，非当前 DSH 实机截图。</p>
 <div role="menu" id="test-menu" class="menu"><button role="menuitem"><span class="codexModelSelectCellLabel">模型</span><span class="codexModelSelectCellValue">Catalog Codex model</span><span class="chevron">›</span></button><button role="menuitem" id="effort"><span class="codexModelSelectCellLabel">推理等级</span><span class="codexModelSelectCellValue" id="effort-value">中</span><span class="chevron">›</span></button><button role="menuitem" class="codexModelSelectCell" id="speed"><span class="codexModelSelectCellLabel">速度</span><span class="codexModelSelectCellValue" id="speed-value">标准</span><span class="chevron">›</span></button><button role="menuitem"><span class="codexModelSelectCellLabel">输出详细程度</span><span class="codexModelSelectCellValue">默认</span><span class="chevron">›</span></button></div>
 <div data-composer-card id="composer"><button id="seat" aria-haspopup="menu" aria-expanded="true" aria-controls="test-menu"><span>Catalog Codex model</span> <span id="seat-effort">中</span></button><span id="mount"></span></div><p id="status">测试宿主，无账号、无网络模型调用。</p>`);
 await page.addScriptTag({path:path.join(vendorRoot,'react.js')});
 await page.addScriptTag({path:path.join(vendorRoot,'react-dom.js')});
 await page.evaluate(()=>window.__ModuleLoader__={load:r=>window.registration=r});
 await page.addScriptTag({path:path.join(pluginRoot,'lib/client.js')});
 await page.evaluate(()=>{
  const model={id:'catalog-codex',name:'Catalog Codex model',reasoning:{defaultEffort:'medium',efforts:[{id:'low',name:'轻度'},{id:'medium',name:'中'},{id:'high',name:'高'},{id:'xhigh',name:'极高'},{id:'ultra',name:'Ultra'}]}};
  window.snapshot={current:{provider:'openai-codex',model:model.id},groups:[{id:'openai-codex',models:[model]}],status:'ready'};
  window.listeners=new Set();window.writes=[];window.failNext=false;
  window.publish=()=>{listeners.forEach(f=>f());let m=snapshot.groups[0].models[0];let id=snapshot.current.reasoningEffort??m.reasoning.defaultEffort;let label=m.reasoning.efforts.find(x=>x.id===id)?.name??id;document.querySelector('#effort-value').textContent=label;document.querySelector('#seat-effort').textContent=label;};
  window.directory={store:{getSnapshot:()=>snapshot,subscribe:f=>{listeners.add(f);return()=>listeners.delete(f)}},load:()=>Promise.resolve(),select:async v=>{writes.push(v);if(failNext){failNext=false;throw Error('测试写回失败')}snapshot={...snapshot,current:{provider:v.provider,model:v.model,...v}};publish();return {ok:true}}};
  window.plugin=registration.factory(name=>name==='react'?React:ReactDOM);
  let component;plugin.apply({modelDirectories:{directoryFor:()=>directory},sessions:{subagentAddress:()=>undefined},slots:{inject:(n,f)=>f(),register:(o,c)=>component=c}});
  window.root=ReactDOM.createRoot(document.querySelector('#mount'));root.render(React.createElement(component,{sessionId:'browser-session'}));
 });
 const slider=page.getByRole('slider');await slider.waitFor();
 assert.equal(await slider.getAttribute('aria-valuemax'),'4');
 await slider.focus();await page.keyboard.press('End');await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),'ultra');
 assert.equal(await page.locator('[data-ces-part=root]').getAttribute('data-energy'),'1');
 fs.mkdirSync('outputs/screenshots',{recursive:true});
 await page.screenshot({path:'outputs/screenshots/codex-ultra-standard.png'});
 // Native preference UI changes its own label. The extension only observes it.
 await page.evaluate(()=>document.querySelector('#speed-value').textContent='高速');
 await page.waitForFunction(()=>document.querySelector('[data-ces-part="speed-icon"]').dataset.speed==='fast');
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),'ultra');
 await page.screenshot({path:'outputs/screenshots/codex-ultra-fast.png'});
 await page.getByRole('button',{name:'恢复模型默认推理档位',exact:true}).click();await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),'medium');
 assert.equal(await page.locator('[data-ces-part=root]').getAttribute('data-energy'),'0');
 await page.screenshot({path:'outputs/screenshots/codex-medium-fast.png'});
 await page.evaluate(()=>failNext=true);await slider.focus();await page.keyboard.press('End');
 await page.getByRole('status').filter({hasText:'测试写回失败'}).waitFor();
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),'medium');
 // Close/reopen by native trigger state, including menu still in DOM.
 await page.evaluate(()=>{document.querySelector('#seat').setAttribute('aria-expanded','false');document.querySelector('#speed-value').textContent='标准'});
 await page.waitForTimeout(100);
 assert.equal(await page.locator('[data-ces-part=host]').count(),0);
 await page.evaluate(()=>{document.querySelector('#seat').setAttribute('aria-expanded','true');document.querySelector('#speed-value').textContent='高速'});
 await slider.waitFor();
 await page.evaluate(()=>{
  const m=snapshot.groups[0].models[0];snapshot={...snapshot,current:{provider:'openai-codex',model:m.id},groups:[{id:'openai-codex',models:[{...m,reasoning:{efforts:m.reasoning.efforts}}]}]};publish();
 });
 await page.waitForFunction(()=>document.querySelector('[data-ces-part="track"]')?.getAttribute('aria-valuetext')==='默认',{},{timeout:5000});
 assert.equal(await slider.getAttribute('aria-valuetext'),'默认');
 assert.equal(await slider.getAttribute('aria-valuemax'),'5');
 await slider.focus();await page.keyboard.press('End');await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),'ultra');
 await page.getByRole('button',{name:'恢复模型默认推理档位',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[data-ces-part="track"]')?.getAttribute('aria-valuetext')==='默认',{},{timeout:5000});
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),undefined);
 assert.equal(await slider.getAttribute('aria-valuetext'),'默认');
 await page.evaluate(()=>{snapshot={...snapshot,current:{provider:'deepseek',model:'deepseek-test',reasoningEffort:'high'},groups:[{id:'deepseek',models:[{id:'deepseek-test',reasoning:{defaultEffort:'high',efforts:[{id:'off',name:'Off'},{id:'low',name:'Low'},{id:'high',name:'High'},{id:'max',name:'Max'}]}}]}]};document.querySelector('#speed').remove();publish()});
 await page.waitForTimeout(150);
 assert.equal(await slider.getAttribute('aria-valuemax'),'3');
 assert.equal(await page.locator('[data-ces-part=speed-icon]').count(),0);
 await slider.focus();await page.keyboard.press('End');await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>snapshot.current.reasoningEffort),'max');
 await page.screenshot({path:'outputs/screenshots/deepseek-max.png'});
 await page.evaluate(()=>root.unmount());await page.waitForTimeout(100);
 assert.equal(await page.locator('[data-ces-part=host]').count(),0);
 assert.equal(await page.locator('[data-ces-part=speed-icon]').count(),0);
 assert.equal(await page.locator('#effort').evaluate(e=>e.style.paddingTop),'');
 assert.deepEqual(errors,[]);await browser.close();
 console.log('Browser checks passed: real React, catalog writes, default, fast independence, errors, close/reopen, teardown, screenshots.');
})().catch(e=>{console.error(e);process.exit(1)});
