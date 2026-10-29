/** Offline asset packaging. Uses preinstalled sharp; never runs in the pet. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(process.env.WHALE_ASSET_PACKAGE || path.resolve(path.dirname(process.execPath), '../package.json'))
const sharp = require('sharp')
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const W=1052,H=1494
const configs={
 maid:{
  tail:[[790,1083],[826,1000],[897,994],[960,1080],[1052,1076],[1052,1230],[818,1225]],
  legs:[[342,1248],[666,1248],[676,1494],[335,1494]],
  body:[[395,709],[635,709],[665,848],[649,923],[754,1041],[847,1140],[827,1202],[736,1254],[621,1271],[371,1269],[225,1232],[140,1171],[149,1137],[228,1043],[334,940],[367,850]],
  arms:[[[393,752],[402,842],[375,907],[320,958],[268,1000],[220,1038],[168,1020],[169,976],[192,942],[233,910],[266,874],[313,847],[343,788]],[[644,754],[675,784],[709,840],[747,866],[792,914],[813,945],[836,984],[841,1022],[796,1043],[760,1011],[706,972],[667,920],[637,849]]],
  ears:[[[192,495],[180,574],[186,627],[112,632],[32,592],[37,551],[135,502]],[[803,495],[890,501],[1002,553],[1005,594],[936,634],[807,626]]],
  head:[[169,172],[855,172],[857,691],[777,735],[734,809],[716,859],[667,859],[645,819],[662,755],[637,713],[353,712],[383,776],[361,847],[311,867],[279,839],[282,773],[233,699],[170,661]],
  hat:[[170,436],[183,333],[211,254],[276,180],[368,130],[497,105],[585,100],[688,151],[767,209],[819,293],[851,430],[817,450],[772,343],[715,277],[640,216],[557,184],[416,185],[317,226],[244,313],[203,411]],
  ahoge:[[268,0],[550,0],[550,173],[268,173]],
  face:[[397,409],[427,493],[464,563],[505,593],[548,582],[578,538],[585,414],[630,480],[681,530],[703,570],[680,636],[647,681],[587,704],[503,718],[417,704],[358,682],[326,651],[305,581],[350,526]],
  eyes:[[[299,565],[323,544],[336,517],[351,505],[379,505],[413,513],[437,542],[448,572],[439,615],[420,639],[374,647],[340,637],[320,615],[309,589]],[[550,560],[568,533],[590,511],[621,505],[653,507],[679,523],[697,553],[710,569],[691,594],[684,619],[658,640],[611,647],[576,632],[560,602]]],
  mouth:[478,647,44,26], eyeBoxes:[[299,516,149,131],[550,517,160,130]],cheeks:[[369,667,44,19],[628,667,44,19]],pivot:[504,705]
 },
 knit:{
  tail:[[620,1126],[748,1130],[803,1090],[833,1013],[892,1000],[961,1084],[1052,1084],[1052,1241],[805,1261],[688,1241],[623,1205]],
  legs:[[350,1130],[660,1130],[680,1494],[334,1494]],
  body:[[399,709],[633,709],[671,797],[663,984],[699,1037],[752,1097],[726,1144],[631,1162],[383,1153],[284,1112],[281,1087],[337,1008],[369,807]],
  arms:[[[381,784],[400,837],[388,927],[352,986],[321,1042],[267,1056],[209,1047],[173,1026],[163,996],[172,966],[202,922],[244,883],[296,861],[343,811]],[[647,785],[690,814],[732,863],[774,897],[808,938],[842,979],[853,1012],[836,1044],[782,1061],[727,1052],[682,1016],[652,964],[635,875]]],
  ears:[[[191,494],[180,573],[186,626],[112,633],[32,591],[37,551],[135,502]],[[803,495],[889,501],[1001,554],[1006,594],[936,635],[807,626]]],
  head:[[167,203],[856,203],[856,691],[777,738],[736,810],[716,866],[668,861],[646,819],[662,752],[637,712],[352,712],[382,777],[363,850],[314,872],[280,841],[283,773],[231,699],[170,660]],
  hat:[[163,478],[184,314],[235,218],[335,148],[455,102],[581,95],[717,147],[810,240],[858,364],[880,471],[828,500],[787,432],[741,323],[674,269],[599,227],[465,207],[366,233],[295,279],[238,359],[206,445]],
  ahoge:[[268,0],[550,0],[550,173],[268,173]],
  face:[[397,410],[427,493],[465,564],[506,594],[548,582],[579,538],[585,415],[630,480],[682,531],[704,571],[680,638],[647,683],[587,705],[503,718],[417,705],[358,683],[326,652],[305,582],[350,527]],
  eyes:[[[299,565],[323,544],[336,517],[351,505],[379,505],[413,513],[437,542],[448,572],[439,615],[420,639],[374,647],[340,637],[320,615],[309,589]],[[550,560],[568,533],[590,511],[621,505],[653,507],[679,523],[697,553],[710,569],[691,594],[684,619],[658,640],[611,647],[576,632],[560,602]]],
  mouth:[478,647,44,26],eyeBoxes:[[299,516,149,131],[550,517,160,130]],cheeks:[[369,667,44,19],[628,667,44,19]],pivot:[504,705]
 },
 winter:{
  tail:[[812,1148],[836,1061],[883,1061],[941,1130],[1052,1111],[1052,1249],[814,1253]],
  legs:[[350,1216],[687,1216],[699,1494],[339,1494]],
  body:[[396,723],[655,722],[698,821],[690,952],[766,1050],[839,1130],[852,1184],[806,1235],[672,1263],[392,1260],[244,1221],[189,1179],[194,1122],[281,1010],[350,873]],
  arms:[[[365,850],[396,899],[372,958],[338,1017],[307,1054],[261,1075],[214,1072],[167,1059],[159,1036],[173,1006],[199,975],[228,933],[284,901],[319,862]],[[696,852],[746,866],[783,914],[817,959],[851,994],[879,1030],[894,1053],[868,1078],[815,1078],[767,1068],[730,1023],[696,959],[665,903]]],
  ears:[[[228,335],[198,440],[171,497],[121,502],[75,468],[86,424],[166,374]],[[805,335],[865,376],[949,415],[976,459],[959,492],[899,508],[849,481]]],
  head:[[206,327],[834,327],[850,703],[778,770],[751,827],[719,871],[670,865],[655,829],[675,777],[653,732],[367,731],[396,783],[377,835],[346,866],[303,850],[281,800],[233,738],[203,668]],
  hat:[[125,674],[121,542],[149,461],[201,346],[289,253],[394,190],[513,145],[656,165],[790,243],[885,355],[932,463],[951,570],[922,677],[884,684],[847,594],[798,488],[746,409],[670,363],[586,338],[473,338],[385,365],[311,415],[263,485],[220,589],[176,677]],
  ahoge:[[389,0],[679,0],[679,168],[389,168]],
  face:[[430,457],[460,542],[495,593],[548,619],[580,600],[596,467],[643,514],[687,553],[712,590],[691,652],[663,698],[607,725],[525,738],[433,723],[374,699],[345,669],[329,604],[374,552]],
  eyes:[[[322,591],[344,572],[361,546],[380,533],[411,532],[448,542],[469,565],[483,601],[482,646],[460,674],[409,680],[365,674],[342,651],[326,621]],[[565,588],[584,560],[606,536],[640,530],[674,535],[699,550],[723,580],[728,602],[712,626],[705,655],[680,676],[630,680],[590,673],[568,654],[561,625]]],
  mouth:[497,671,44,26],eyeBoxes:[[322,532,161,148],[561,530,167,150]],cheeks:[[397,689,43,18],[652,690,43,18]],pivot:[524,731]
 }
}
function mask(poly){const out=new Uint8Array(W*H);const ys=poly.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)));y<Math.min(H,Math.ceil(Math.max(...ys)));y++){const xs=[];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j],v=y+.5;if((a[1]>v)!==(b[1]>v))xs.push(a[0]+(v-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)out.fill(1,y*W+Math.max(0,Math.ceil(xs[k]-.5)),y*W+Math.min(W,Math.ceil(xs[k+1]-.5)));}return out}
function rect(r){return [[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]]}
function u16(n){const b=Buffer.alloc(2);b.writeUInt16BE(n&65535);return b}function s16(n){const b=Buffer.alloc(2);b.writeInt16BE(n);return b}function u32(n){const b=Buffer.alloc(4);b.writeUInt32BE(n);return b}function s32(n){const b=Buffer.alloc(4);b.writeInt32BE(n);return b}
function pack(row){const a=[];for(let i=0;i<row.length;){let run=1;while(i+run<row.length&&run<128&&row[i+run]===row[i])run++;if(run>=3){a.push(257-run,row[i]);i+=run}else{const start=i;i+=run;while(i<row.length&&i-start<128){let r=1;while(i+r<row.length&&r<3&&row[i+r]===row[i])r++;if(r>=3)break;i+=Math.min(r,128-(i-start));}a.push(i-start-1);for(let j=start;j<i;j++)a.push(row[j]);}}return Buffer.from(a)}
function channel(raw,w,h,index){const rows=[];for(let y=0;y<h;y++){const row=Buffer.alloc(w);for(let x=0;x<w;x++)row[x]=raw[(y*w+x)*4+index];rows.push(pack(row));}return Buffer.concat([u16(1),...rows.map(r=>u16(r.length)),...rows])}
async function psd(file,layers,merged){const records=[],pixels=[];for(const l of [...layers].reverse()){const chans=[0,1,2,3].map(i=>channel(l.raw,l.w,l.h,i));let name=Buffer.from(l.id,'ascii');const pascal=Buffer.concat([Buffer.from([name.length]),name,Buffer.alloc((4-(name.length+1)%4)%4)]);const uni=Buffer.from(l.label.split('').map(c=>String.fromCharCode(c.charCodeAt(0)>>8,c.charCodeAt(0)&255)).join(''),'latin1');const unicode=Buffer.concat([u32(l.label.length),uni]);const extra=Buffer.concat([u32(0),u32(0),pascal,Buffer.from('8BIMluni'),u32(unicode.length),unicode,Buffer.alloc(unicode.length%2)]);records.push(Buffer.concat([s32(l.y),s32(l.x),s32(l.y+l.h),s32(l.x+l.w),u16(4),...chans.map((b,i)=>Buffer.concat([s16(i===3?-1:i),u32(b.length)])),Buffer.from('8BIMnorm'),Buffer.from([255,0,0,0]),u32(extra.length),extra]));pixels.push(...chans);}let info=Buffer.concat([s16(-layers.length),...records,...pixels]);if(info.length%2)info=Buffer.concat([info,Buffer.alloc(1)]);const layerMask=Buffer.concat([u32(info.length),info,u32(0)]);const compositeCh=[0,1,2,3].map(i=>channel(merged,W,H,i));const composite=Buffer.concat([u16(1),...compositeCh.map(b=>b.subarray(2,2+H*2)),...compositeCh.map(b=>b.subarray(2+H*2))]);await fs.writeFile(file,Buffer.concat([Buffer.from('8BPS'),u16(1),Buffer.alloc(6),u16(4),u32(H),u32(W),u16(8),u16(3),u32(0),u32(0),u32(layerMask.length),layerMask,composite]));}
for(const outfit of (process.argv.slice(2).length?process.argv.slice(2):Object.keys(configs))){
 const c=configs[outfit],dir=path.join(ROOT,outfit);await fs.mkdir(path.join(dir,'layers'),{recursive:true});
 const raw=await sharp(path.join(dir,'sprite.png')).ensureAlpha().raw().toBuffer();const labels=new Uint8Array(W*H);
 const specs=[['hair-back',null,[525,645],0,'01 Back hair'],['tail',c.tail,[815,1180],1,'02 Whale tail'],['legs',c.legs,[521,1255],2,'03 Legs socks shoes'],['body',c.body,[522,1060],3,'04 '+outfit+' clothes'],['arm-l',c.arms[0],[371,840],4,'05 Left sleeve and hand'],['arm-r',c.arms[1],[674,840],5,'06 Right sleeve and hand'],['hair-front',c.head,[526,472],7,'07 Bangs side locks'],['accessory',c.hat,[526,472],8,'08 Headwear'],['ahoge',c.ahoge,[526,144],9,'09 Ahoge or water spout'],['ear-l',c.ears[0],[196,556],6,'10 Left whale fin'],['ear-r',c.ears[1],[808,557],6,'11 Right whale fin'],['face',c.face,c.pivot,10,'12 Face skin'],['eye-l',c.eyes[0],[377,580],11,'13 Left eye'],['eye-r',c.eyes[1],[633,580],12,'14 Right eye'],['mouth',rect(c.mouth),[c.mouth[0],c.mouth[1]],13,'15 Mouth']];
 // Regions are hand traced on the reference sprite. Each original pixel belongs to one layer.
 for(let i=1;i<specs.length;i++){const m=mask(specs[i][1]);for(let p=0;p<m.length;p++)if(m[p])labels[p]=i;}
 const faceIndex=specs.findIndex(s=>s[0]==='face');const bufs=specs.map(()=>Buffer.alloc(W*H*4));
 for(let p=0;p<W*H;p++){if(raw[p*4+3]===0)continue;const b=bufs[labels[p]];raw.copy(b,p*4,p*4,p*4+4);}
 // Clean skin underneath eyes/mouth for blinking; no source eye remains on the face layer.
 for(let p=0;p<W*H;p++){const name=specs[labels[p]][0];if(!['eye-l','eye-r','mouth'].includes(name)||!raw[p*4+3])continue;let x=p%W,y=(p/W)|0;const b=bufs[faceIndex],t=Math.min(1,Math.abs(x-W/2)/230);b[p*4]=255;b[p*4+1]=Math.round(241-8*t);b[p*4+2]=Math.round(226-11*t);b[p*4+3]=raw[p*4+3];}
 const eyeIds=[specs.findIndex(s=>s[0]==='eye-l'),specs.findIndex(s=>s[0]==='eye-r')];
 const hi=specs.findIndex(s=>s[0]==='hair-front'),candidate=new Uint8Array(W*H),candidates=[];
 for(let p=0;p<W*H;p++){const ei=eyeIds.indexOf(labels[p]);if(ei<0)continue;const b=p*4,r=raw[b],g=raw[b+1],blue=raw[b+2],box=c.eyeBoxes[ei],nx=((p%W)-box[0]-box[2]*.5)/(box[2]*.33),ny=(((p/W)|0)-box[1]-box[3]*.6)/(box[3]*.41);if(nx*nx+ny*ny>1&&(((p/W)|0)<box[1]+box[3]*.38||(p%W)<box[0]+box[2]*.08||(p%W)>box[0]+box[2]*.92)&&r>55&&r>g*.65&&g>r&&blue>g*1.08){candidate[p]=1;candidates.push(p);}}
 const queue=[];for(const p of candidates)if([-1,1,-W,W].some(d=>labels[p+d]===hi)){candidate[p]=2;queue.push(p);}
 for(let i=0;i<queue.length;i++){const p=queue[i],b=p*4;raw.copy(bufs[hi],b,b,b+4);bufs[faceIndex].fill(0,b,b+4);bufs[labels[p]].fill(0,b,b+4);labels[p]=hi;for(const d of [-1,1,-W,W]){const k=p+d;if(candidate[k]===1){candidate[k]=2;queue.push(k);}}}
 // Solve a smooth skin field under the original eye art; warm edge skin is a fixed boundary.
 const unknown=new Uint8Array(W*H),known=new Uint8Array(W*H),field=new Float32Array(W*H*3),active=[];
 for(let p=0;p<W*H;p++){const id=labels[p],off=p*4,q=p*3;const eye=eyeIds.includes(id);const originalEye=(eye||specs[id][0]==='mouth')&&bufs[id][off+3]>0;const name=specs[id][0];const skin=raw[off]>224&&raw[off+1]>160&&raw[off+2]>128&&raw[off]-raw[off+1]>0&&raw[off]-raw[off+2]>9;
  if(originalEye){unknown[p]=1;active.push(p);field[q]=254;field[q+1]=229;field[q+2]=214;}
  else if((name==='face'||eye)&&skin&&raw[off+3]>200){known[p]=1;field[q]=raw[off];field[q+1]=raw[off+1];field[q+2]=raw[off+2];}}
 for(let iteration=0;iteration<600;iteration++){const reverse=iteration%2;for(let j=0;j<active.length;j++){const p=active[reverse?active.length-1-j:j],q=p*3;let n=0,r=0,g=0,b=0;for(const d of [-1,1,-W,W]){const k=p+d;if(k<0||k>=W*H||(!known[k]&&!unknown[k]))continue;const t=k*3;r+=field[t];g+=field[t+1];b+=field[t+2];n++;}if(n){field[q]+=(r/n-field[q])*1.65;field[q+1]+=(g/n-field[q+1])*1.65;field[q+2]+=(b/n-field[q+2])*1.65;}}}
 for(const p of active){const q=p*3,b=p*4;bufs[faceIndex][b]=Math.round(Math.max(0,Math.min(255,field[q])));bufs[faceIndex][b+1]=Math.round(Math.max(0,Math.min(255,field[q+1])));bufs[faceIndex][b+2]=Math.round(Math.max(0,Math.min(255,field[q+2])));}
 const layers=[];
 for(let i=0;i<specs.length;i++){const b=bufs[i];let minx=W,miny=H,maxx=-1,maxy=-1;for(let p=0;p<W*H;p++)if(b[p*4+3]){const x=p%W,y=(p/W)|0;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}if(maxx<0)continue;const w=maxx-minx+1,h=maxy-miny+1;const cropped=await sharp(b,{raw:{width:W,height:H,channels:4}}).extract({left:minx,top:miny,width:w,height:h}).raw().toBuffer();await sharp(cropped,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(dir,'layers',specs[i][0]+'.png'));layers.push({id:specs[i][0],label:specs[i][4],src:'layers/'+specs[i][0]+'.png',x:minx,y:miny,width:w,height:h,w,h,pivot:specs[i][2],z:specs[i][3],raw:cropped});}
 // Invisible seam coverage stays inside the original silhouette and excludes face pixels.
 const edge=new Uint8Array(W*H).fill(40),seam=new Uint8Array(W*H).fill(40);
 for(let p=0;p<W*H;p++){if(raw[p*4+3]<245)edge[p]=0;const x=p%W;if((x>0&&labels[p]!==labels[p-1])||(p>=W&&labels[p]!==labels[p-W]))seam[p]=0;}
 for(const d of [edge,seam]){for(let p=0;p<W*H;p++){const x=p%W;if(x)d[p]=Math.min(d[p],d[p-1]+1);if(p>=W)d[p]=Math.min(d[p],d[p-W]+1);}for(let p=W*H-1;p>=0;p--){const x=p%W;if(x<W-1)d[p]=Math.min(d[p],d[p+1]+1);if(p<W*(H-1))d[p]=Math.min(d[p],d[p+W]+1);}}
 const joint=Buffer.alloc(W*H*4);for(let p=0;p<W*H;p++){if(edge[p]>12&&seam[p]<17&&!['face','eye-l','eye-r','mouth'].includes(specs[labels[p]][0]))raw.copy(joint,p*4,p*4,p*4+4);}
 await sharp(joint,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(dir,'layers','joint-fill.png'));
 layers.push({id:'joint-fill',label:'00 Hidden seam coverage',src:'layers/joint-fill.png',x:0,y:0,width:W,height:H,w:W,h:H,pivot:[W/2,H/2],z:-1,raw:joint});
 layers.sort((a,b)=>a.z-b.z);
 let minx=W,miny=H,maxx=0,maxy=0;for(let p=0;p<W*H;p++)if(raw[p*4+3]>8){const x=p%W,y=(p/W)|0;minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}
 const rig={version:1,articulation:'overlap',maxAngles:{arm:0.02,hair:0.002,ear:0.02,tail:0.045,head:0.015},renderer:'canvas2d-sprite',width:W,height:H,bounds:[minx,miny,maxx-minx+1,maxy-miny+1],layers:layers.map(({w,h,raw,label,...l})=>l),face:{eyeL:c.eyeBoxes[0],eyeR:c.eyeBoxes[1],mouth:c.mouth,cheekL:c.cheeks[0],cheekR:c.cheeks[1],skin:'#fff1e2',pivot:c.pivot}};
 await fs.writeFile(path.join(dir,'rig.json'),JSON.stringify(rig,null,2)+'\n');
 await psd(path.join(dir,outfit+'-layered.psd'),layers,raw);
 const recomposed=await sharp({create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers.map(l=>({input:path.join(dir,l.src),left:l.x,top:l.y}))).png().toBuffer();await sharp(recomposed).resize({width:360}).png().toFile(path.join(dir,'layer-preview.png'));
 console.log(outfit+': '+layers.length+' layers; bounds '+rig.bounds.join(',')+'; PSD '+(await fs.stat(path.join(dir,outfit+'-layered.psd'))).size+' bytes');
}
