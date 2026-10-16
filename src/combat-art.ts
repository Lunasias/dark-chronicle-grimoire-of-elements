import type {Unit} from './types';
export type SpriteState = 'idle'|'move'|'attack'|'cast'|'hurt'|'death';
export function archetype(u:Unit):string {
 if(u.id.includes('morgana')||u.id.includes('boss'))return 'empress';
 if(u.id.includes('goblin'))return 'goblin';
 if(u.id.includes('sorceress'))return 'witch';
 if(u.id==='lyria'||/mage/i.test(u.title))return 'mage';
 if(u.id==='selenis'||/ranger/i.test(u.title))return 'ranger';return 'knight';
}
/** Bespoke silhouettes in a 48×70 local space; feet remain at (0,0). */
export function drawFighter(ctx:CanvasRenderingContext2D,u:Unit,x:number,y:number,scale:number,time:number,state:SpriteState='idle',progress=0,face=1){
 const kind=archetype(u),swing=Math.sin(Math.min(1,progress)*Math.PI);
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 if(state==='death'){ctx.globalAlpha=1-progress;ctx.rotate(face*progress*1.35);ctx.scale(1,1-progress*.45);}
 if(state==='hurt')ctx.translate(-face*swing*6,0);
 if(state==='attack')ctx.translate(face*swing*9,-swing*2);
 if(state==='cast')ctx.translate(0,-swing*5);
 const stride=state==='move'?Math.sin(progress*Math.PI*6)*6:0;
 const bob=state==='move'?-Math.abs(stride)*.6:Math.sin(time/420+u.spd)*1.1;
 const ink='#111625',skin=kind==='goblin'?'#9dbd7c':'#edc5b2';
 const rect=(a:number,b:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(a,b,w,h);};
 const poly=(pts:number[][],color:string,stroke=ink)=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}};
 const line=(pts:number[][],color:string,width=2)=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(const p of pts.slice(1))ctx.lineTo(p[0],p[1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
 const orb=(a:number,b:number,r:number,color:string)=>{ctx.beginPath();ctx.arc(a,b,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();};
 ctx.translate(0,bob);
 // Distinct cape shapes and costume proportions, not palette swaps.
 if(kind==='empress'){
  poly([[-8,-48],[-25,-58],[-32,-24],[-14,-31],[-18,-8],[0,-18],[18,-8],[14,-31],[32,-24],[25,-58],[8,-48]],'#471d4f');
  line([[-25,-52],[-23,-33],[-16,-29]],'#b95a99');line([[25,-52],[23,-33],[16,-29]],'#b95a99');
 }else if(kind==='ranger')poly([[-8,-46],[-22,-6],[-8,-15],[3,-5],[14,-10],[8,-46]],'#244c42');
 else if(kind==='knight')poly([[-11,-48],[-17,-7],[0,-15],[15,-6],[10,-48]],'#773246');
 else if(kind==='witch')poly([[-9,-42],[-21,-8],[0,-15],[21,-8],[9,-42]],'#492766');
 // Separate boots and animated limbs.
 rect(-10,-19+stride,7,16,'#26334b');rect(3,-19-stride,7,16,'#26334b');
 rect(-12,-6+stride,10,5,'#111b2d');rect(3,-6-stride,11,5,'#111b2d');
 if(kind==='mage'||kind==='witch'||kind==='empress'){
  poly([[-9,-44],[9,-44],[16,-7],[0,-10],[-16,-7]],kind==='mage'?'#5962a4':kind==='empress'?'#9c315a':'#63378e');
  poly([[-3,-40],[3,-40],[6,-9],[0,-13],[-6,-9]],'#c7acd8');
  line([[-10,-15],[0,-18],[11,-15]],'#e5b66b');
 }else{
  poly([[-10,-43],[9,-43],[12,-27],[6,-19],[-7,-19],[-12,-28]],kind==='knight'?'#aabacb':kind==='ranger'?'#527b58':'#76613c');
  rect(-10,-29,20,4,'#463345');rect(-2,-29,5,4,'#e6bc68');
 }
 // Arms with different equipment anchors.
 line([[-9,-41],[-15,-30],[-14,-21]],ink,7);line([[-9,-41],[-15,-30],[-14,-21]],skin,4);
 line([[9,-41],[15,-32],[18,-28]],ink,7);line([[9,-41],[15,-32],[18,-28]],skin,4);
 rect(-5,-49,10,7,skin);
 // Hair behind face, angular face, two visible eyes.
 poly([[-10,-59],[0,-65],[10,-59],[11,-43],[5,-45],[-7,-43],[-12,-48]],kind==='ranger'?'#d9c792':kind==='knight'?'#a14352':kind==='empress'?'#e4cce2':'#554d80');
 poly([[-7,-58],[7,-58],[7,-49],[2,-44],[-3,-44],[-8,-50]],skin);
 rect(-5,-53,3,2,'#25324a');rect(3,-53,3,2,'#25324a');rect(0,-48,3,1,'#ae6672');
 if(kind==='knight'){
  poly([[-12,-43],[-5,-46],[-3,-36],[-14,-35]],'#dae1e7');poly([[7,-45],[15,-42],[13,-35],[5,-38]],'#dae1e7');
  poly([[-10,-58],[-9,-65],[4,-66],[10,-59],[2,-59],[-3,-63]],'#b4c9d9');
  poly([[-3,-66],[0,-77],[8,-73],[5,-65]],'#da5862');
  poly([[-24,-34],[-12,-38],[-8,-26],[-15,-15],[-23,-23]],'#385e91');
  line([[-16,-34],[-15,-20]],'#dfc385',2);line([[-21,-28],[-11,-29]],'#dfc385',2);
  ctx.save();ctx.translate(19,-30);ctx.rotate(state==='attack'?-swing*1.3:.2);
  poly([[-2,4],[-3,-29],[0,-37],[3,-29],[2,4]],'#e5eff6');line([[-7,3],[7,3]],'#d9b467',3);rect(-2,4,4,10,'#6b4250');ctx.restore();
 }else if(kind==='mage'){
  poly([[-19,-60],[-8,-64],[-2,-81],[8,-70],[10,-63],[19,-60]],'#454579');line([[-9,-63],[9,-63]],'#e4b564',3);
  line([[21,-5],[19,-62]],'#9c704f',4);poly([[19,-76],[25,-67],[19,-57],[13,-67]],'#a5ecf4');orb(19,-67,3,'#e6feff');
  rect(-11,-18,7,3,'#dbb66d');rect(6,-18,7,3,'#dbb66d');
 }else if(kind==='ranger'){
  poly([[-12,-55],[-8,-66],[4,-69],[13,-58],[8,-58],[0,-64],[-7,-57]],'#42624c');
  poly([[-10,-55],[-20,-60],[-10,-49]],skin);poly([[10,-55],[20,-60],[10,-49]],skin);
  line([[-17,-30],[-23,-58]],'#574538',7);for(let i=0;i<3;i++)line([[-24+i*3,-59],[-26+i*3,-69]],'#d8cfb0',2);
  ctx.beginPath();ctx.ellipse(24,-33,10,25,-.15,-Math.PI/2,Math.PI/2);ctx.strokeStyle='#d8a66e';ctx.lineWidth=3;ctx.stroke();line([[20,-58],[24,-33],[27,-8]],'#e9dabe',1);
  line([[14,-31],[38,-33]],'#ebe8c9');poly([[38,-33],[33,-36],[33,-30]],'#dbe9ed');
 }else if(kind==='goblin'){
  poly([[-7,-56],[-23,-62],[-17,-48],[-6,-49]],skin);poly([[6,-56],[23,-62],[16,-48],[6,-49]],skin);
  poly([[-9,-58],[-3,-65],[9,-61],[10,-55]],'#493f39');rect(-8,-36,16,5,'#9c8055');
  poly([[-19,-28],[-28,-43],[-23,-46],[-15,-30]],'#c7d5ce');poly([[17,-27],[29,-43],[32,-40],[21,-24]],'#e1e4ca');
  line([[-26,-28],[-17,-35]],'#bca26d',3);line([[17,-32],[27,-25]],'#bca26d',3);
 }else if(kind==='witch'){
  poly([[-9,-57],[-16,-75],[-7,-68],[-4,-59]],'#b9a5d1');poly([[6,-59],[12,-74],[15,-64],[11,-55]],'#b9a5d1');
  orb(23,-40,9,'#6b399a');orb(23,-40,5,'#d6a7f2');line([[14,-28],[22,-32],[30,-28]],'#d2afc9');
 }else{
  poly([[-10,-58],[-15,-75],[-6,-67],[0,-79],[6,-67],[15,-75],[10,-58]],'#d5ac61');orb(0,-65,3,'#e86293');
  poly([[-15,-46],[-24,-50],[-18,-34],[-9,-37]],'#c69c5f');poly([[15,-46],[24,-50],[18,-34],[9,-37]],'#c69c5f');
  line([[25,-5],[24,-72]],'#705265',4);poly([[23,-74],[37,-67],[40,-55],[33,-61],[25,-64],[11,-62],[14,-70]],'#d7c8dc');
 }
 if(state==='hurt'){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.55*swing;rect(-15,-65,30,62,'#fca5a5');}
 ctx.restore();
}
