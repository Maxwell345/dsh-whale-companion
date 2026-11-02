/** Crop native-alpha imagegen contact sheets; never draws or redesigns a character. */
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(process.env.WHALE_ASSET_PACKAGE || path.resolve(path.dirname(process.execPath), '../package.json'))
const sharp = require('sharp')
const DEFAULT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const options = Object.fromEntries(process.argv.slice(2).filter((a,i,all) => a.startsWith('--') && a !== '--install').map((a,i,all) => [a.slice(2), process.argv[process.argv.indexOf(a)+1]]))
const ROOT = options['asset-root'] ? path.resolve(options['asset-root']) : DEFAULT_ROOT
const outfit = options.outfit
if (!['maid','knit','winter'].includes(outfit) || !options.sheet) throw new Error('Usage: node pack-turnaround.mjs --outfit maid --sheet source.png [--output tempDir] [--install]')
const install = process.argv.includes('--install')
const assetDir = path.join(ROOT, outfit)
const direct = install && !options.output
const dir = options.output ? path.resolve(options.output) : direct ? path.join(assetDir, 'turnaround') : await fs.mkdtemp(path.join(os.tmpdir(), 'whale-frame-pack-'))
const input = await sharp(path.resolve(options.sheet)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const W=input.info.width,H=input.info.height,source=input.data
let transparent=0,covered=0
for(let p=3;p<source.length;p+=4){if(source[p]<4)transparent++;if(source[p]>200)covered++}
if(transparent<W*H*.1||covered<W*H*.1)throw new Error('Input lacks usable native transparency. Do not key a complex background; regenerate transparent or pure-color source.')
function components(data,w,h){const labels=new Int32Array(w*h),queue=new Int32Array(w*h),items=[];let id=0;for(let p=0;p<labels.length;p++){if(labels[p]||data[p*4+3]<32)continue;id++;let n=0,qh=0,qt=1,x0=w,x1=-1,y0=h,y1=-1;queue[0]=p;labels[p]=id;while(qh<qt){const k=queue[qh++],x=k%w,y=(k/w)|0;n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);for(const d of[-1,1,-w,w]){const j=k+d;if(j<0||j>=w*h||labels[j]||data[j*4+3]<32||Math.abs(j%w-x)>1)continue;labels[j]=id;queue[qt++]=j}}if(n>w*h*.025)items.push({id,n,x0,x1,y0,y1})}return{labels,items}}
function bounds(data,w,h,threshold=16){let x0=w,x1=-1,y0=h,y1=-1;for(let p=0;p<w*h;p++)if(data[p*4+3]>threshold){const x=p%w,y=(p/w)|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}return{x0,x1,y0,y1}}
function footX(data,w,h,b){let sum=0,mass=0;for(let y=Math.max(b.y0,Math.round(b.y1-(b.y1-b.y0)*.07));y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){const a=data[(y*w+x)*4+3];if(a>16){sum+=x*a;mass+=a}}return sum/mass}
const cc=components(source,W,H)
if(cc.items.length!==4)throw new Error('Expected four separated silhouettes; found '+cc.items.length)
cc.items.sort((a,b)=>((a.y0<H/2?0:1)-(b.y0<H/2?0:1))||(a.x0-b.x0))
const reference=await sharp(path.join(assetDir,'sprite.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true})
const outW=reference.info.width,outH=reference.info.height,target=bounds(reference.data,outW,outH),targetFoot=footX(reference.data,outW,outH,target)
await fs.mkdir(dir,{recursive:true})
await fs.copyFile(path.join(assetDir,'sprite.png'),path.join(dir,'front.png'))
const names=['front','right','back','left'],frames=[],renderOffsetX={front:0}
for(let index=1;index<4;index++){
 const c=cc.items[index],expanded=new Uint8Array(W*H)
 for(let p=0;p<expanded.length;p++)if(cc.labels[p]===c.id){for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=p%W+dx,y=((p/W)|0)+dy;if(x>=0&&x<W&&y>=0&&y<H)expanded[y*W+x]=1}}
 const raw=Buffer.from(source)
 for(let p=0;p<expanded.length;p++){const j=p*4,a=expanded[p]&&(!cc.labels[p]||cc.labels[p]===c.id)?Math.round(Math.max(0,Math.min(1,(raw[j+3]-3)/250))*255):0;raw[j+3]=a;if(!a)raw.fill(0,j,j+4)}
 const b=bounds(raw,W,H),foot=footX(raw,W,H,b),x0=Math.max(0,b.x0-2),y0=Math.max(0,b.y0-2),cw=Math.min(W-x0,b.x1-b.x0+5),ch=Math.min(H-y0,b.y1-b.y0+5)
 const factor=Math.min((target.y1-target.y0+1)/(b.y1-b.y0+1),(outW-4)/cw),nw=Math.round(cw*factor),nh=Math.round(ch*factor)
 const crop=await sharp(raw,{raw:{width:W,height:H,channels:4}}).extract({left:x0,top:y0,width:cw,height:ch}).resize(nw,nh,{kernel:'lanczos3'}).ensureAlpha().raw().toBuffer({resolveWithObject:true})
 const cb=bounds(crop.data,nw,nh),naturalLeft=Math.round(targetFoot-(foot-x0)*factor),left=Math.max(2,Math.min(outW-2-nw,naturalLeft)),top=target.y1-cb.y1
 const output=await sharp({create:{width:outW,height:outH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:crop.data,raw:{width:nw,height:nh,channels:4},left,top}]).png().toBuffer()
 await fs.writeFile(path.join(dir,names[index]+'.png'),output)
 const aligned=await sharp(output).ensureAlpha().raw().toBuffer()
 renderOffsetX[names[index]]=Math.round((targetFoot-footX(aligned,outW,outH,bounds(aligned,outW,outH)))*100)/100
 frames.push({view:names[index],sourceBounds:b,sourceFootX:foot,factor,left,top,naturalLeft,horizontalFitShift:left-naturalLeft,outputBounds:{x0:left+cb.x0,x1:left+cb.x1,y0:top+cb.y0,y1:top+cb.y1}})
}
const previewHeight=560,panelWidth=470,shots=[]
for(let i=0;i<4;i++)shots.push({input:await sharp(path.join(dir,names[i]+'.png')).resize({height:previewHeight}).png().toBuffer(),left:Math.round(i*panelWidth+36+(renderOffsetX[names[i]]||0)*previewHeight/outH),top:15})
const previewPath=path.join(direct?assetDir:dir,'turnaround-preview.png')
await sharp({create:{width:panelWidth*4,height:590,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(shots).png().toFile(previewPath)
const report={source:path.resolve(options.sheet),reference:path.join(assetDir,'sprite.png'),targetBounds:target,targetFootX:targetFoot,frames,renderOffsetX}
if(!direct)await fs.writeFile(path.join(dir,'alignment.json'),JSON.stringify(report,null,2)+'\n')
if(install){const turnaround=path.join(assetDir,'turnaround');await fs.mkdir(turnaround,{recursive:true});if(!direct){for(const name of names)await fs.copyFile(path.join(dir,name+'.png'),path.join(turnaround,name+'.png'));await fs.copyFile(previewPath,path.join(assetDir,'turnaround-preview.png'))}const rigPath=path.join(assetDir,'rig.json'),rig=JSON.parse(await fs.readFile(rigPath,'utf8'));rig.turnaround={frames:Object.fromEntries(names.map(n=>[n,'turnaround/'+n+'.png'])),source:'builtin-imagegen',frameHoldMs:220,crossfadeMs:100,renderOffsetX};await fs.writeFile(rigPath,JSON.stringify(rig,null,2)+'\n')}
console.log(JSON.stringify({outfit,output:dir,installed:install,...report},null,2))
