export type Point={x:number;y:number};
const round=(n:number)=>Math.round(n*1000)/1000;

// Monotone cubic interpolation: every observation is on the curve and no segment
// overshoots its two observations. A smooth stroke must not invent sales peaks.
export function monotonePath(points:Point[]):string{
 if(!points.length)return '';
 if(points.length===1)return `M${round(points[0].x)},${round(points[0].y)}`;
 const slopes=points.slice(1).map((p,i)=>(p.y-points[i].y)/(p.x-points[i].x));
 const tangents=points.map((_,i)=>{
  if(i===0)return slopes[0];
  if(i===points.length-1)return slopes.at(-1)!;
  const a=slopes[i-1],b=slopes[i];
  if(a*b<=0)return 0;
  const before=points[i].x-points[i-1].x,after=points[i+1].x-points[i].x;
  const w1=2*after+before,w2=after+2*before;
  return (w1+w2)/(w1/a+w2/b);
 });
 let path=`M${round(points[0].x)},${round(points[0].y)}`;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],dx=(b.x-a.x)/3;
  path+=` C${round(a.x+dx)},${round(a.y+dx*tangents[i])} ${round(b.x-dx)},${round(b.y-dx*tangents[i+1])} ${round(b.x)},${round(b.y)}`;
 }
 return path;
}

export function chartScale(values:number[]){
 const finite=values.filter(Number.isFinite);
 const low=Math.min(0,...finite),high=Math.max(0,...finite);
 const span=high-low||1;
 const raw=Math.max(1,span/3.5),power=10**Math.floor(Math.log10(raw));
 const step=([1,2,2.5,5,10].find(n=>n*power>=raw)||10)*power;
 const min=low<0?Math.floor((low-span*.06)/step)*step:0;
 const max=high>0?Math.ceil((high+span*.06)/step)*step:low<0?0:1;
 const ticks=Array.from({length:Math.round((max-min)/step)+1},(_,i)=>round(min+i*step)).filter(n=>n<=max);
 return {min,max,ticks,y:(value:number)=>250-(value-min)/(max-min)*202};
}

export function chartPoints(values:number[],y:(v:number)=>number):Point[]{
 return values.map((v,i)=>({x:values.length===1?416:72+i/(values.length-1)*688,y:y(v)}));
}

export function nearestChartIndex(x:number,length:number){
 return Math.max(0,Math.min(length-1,Math.round((x-72)/688*Math.max(0,length-1))));
}
