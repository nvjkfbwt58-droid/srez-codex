import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chartPoints,chartScale,monotonePath,nearestChartIndex,type Point} from '../src/chartGeometry';
import {bucketDaily,periodLength,rangeEndingAt,shiftPeriod} from '../src/chartPeriods';
import {seedData,report,DEFAULT_FILTERS,SEED_VERSION,addDays} from '../src/domain';

test('smooth chart includes observations without inventing extrema',()=>{
 for(const values of [[0,8,1,9,0],[5,5,5,5],[9,4,2,0],[-9,4,-2,8,0],[1,1.01,150,149,149]]){
  const points:Point[]=values.map((y,i)=>({x:i*20,y})),path=monotonePath(points);
  assert.ok(!/NaN|Infinity/.test(path));
  const segments=[...path.matchAll(/C([\d.e-]+),([\d.e-]+) ([\d.e-]+),([\d.e-]+) ([\d.e-]+),([\d.e-]+)/g)];
  assert.equal(segments.length,values.length-1);
  segments.forEach((segment,i)=>{
   const c1=Number(segment[2]),c2=Number(segment[4]),end=Number(segment[6]);assert.equal(end,values[i+1]);
   for(let j=0;j<=100;j++){const t=j/100,one=1-t,y=one**3*values[i]+3*one**2*t*c1+3*one*t*t*c2+t**3*end;assert.ok(y>=Math.min(values[i],end)-.001&&y<=Math.max(values[i],end)+.001,`${values}: ${y}`);}
  });
 }
 assert.equal(monotonePath([]),'');assert.equal(monotonePath([{x:2,y:3}]),'M2,3');
});
test('zero, negative returns and single-day charts keep values within their axes',()=>{
 for(const values of [[],[0,0],[10],[-150,-20],[-50,80],[.1,.5]]){
  const scale=chartScale(values);assert.ok(scale.max>scale.min);assert.ok(scale.min<=0&&scale.max>=0);
  for(const value of values)assert.ok(scale.y(value)>=48&&scale.y(value)<=250);
  assert.ok(scale.ticks.every(Number.isFinite));assert.ok(chartPoints(values,scale.y).every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
 }
 assert.equal(chartPoints([10],chartScale([10]).y)[0].x,416);
 assert.equal(nearestChartIndex(-100,28),0);assert.equal(nearestChartIndex(999,28),27);
});
const data=seedData(),r=report(data,DEFAULT_FILTERS);
test('day/week/month totals and comparison dates reconcile including partial buckets',()=>{
 for(const granularity of ['day','week','month'] as const){
  const buckets=bucketDaily(r.daily,granularity);
  for(const metric of ['revenue','profit','count'] as const){assert.equal(buckets.reduce((sum,b)=>sum+b[metric],0),r[metric]);assert.equal(buckets.reduce((sum,b)=>sum+b.previous[metric],0),r.previous[metric]);}
  assert.equal(buckets[0].date,DEFAULT_FILTERS.from);assert.equal(buckets.at(-1)!.endDate,DEFAULT_FILTERS.to);
  for(const bucket of buckets){assert.equal(bucket.previousDate,addDays(bucket.date,-28));assert.equal(bucket.previousEndDate,addDays(bucket.endDate,-28));}
 }
 const months=bucketDaily(r.daily,'month');assert.equal(months.length,2);assert.equal(months[0].endDate,'2026-08-31');assert.equal(months[1].date,'2026-09-01');
});
test('period buttons clamp to available history without crossing month/leap-year boundaries',()=>{
 const bounds={from:'2024-02-01',to:'2024-03-10'};
 assert.deepEqual(rangeEndingAt(bounds.to,14,bounds),{from:'2024-02-26',to:'2024-03-10'});
 assert.deepEqual(rangeEndingAt('2024-04-01',1,bounds),{from:bounds.to,to:bounds.to});
 assert.deepEqual(rangeEndingAt(bounds.to,1e100,bounds),bounds);
 const last=rangeEndingAt(bounds.to,14,bounds),prior=shiftPeriod(last,-1,bounds);
 assert.equal(periodLength(prior),14);assert.deepEqual(shiftPeriod(prior,1,bounds),last);
 const first=shiftPeriod({from:'2024-02-03',to:'2024-02-16'},-1,bounds);assert.equal(first.from,bounds.from);assert.equal(periodLength(first),14);
});
test('demo demand is reproducible but no longer a repeated weekly template',()=>{
 assert.equal(data.schemaVersion,SEED_VERSION);
 const counts=r.daily.map(d=>d.count),mean=counts.reduce((a,b)=>a+b,0)/counts.length;
 const weekly=counts.slice(7).reduce((s,v,i)=>s+(v-mean)*(counts[i]-mean),0)/counts.reduce((s,v)=>s+(v-mean)**2,0);
 assert.ok(Math.abs(weekly)<.6,'mechanically repeated weekly peaks');
 const hours=Array(24).fill(0);for(const receipt of data.receipts)if(receipt.type==='sale')hours[Number(receipt.at.slice(11,13))]++;
 assert.ok(hours[18]>hours[10]*2,'retail evening peak should be visible');
 assert.ok(new Set(r.daily.map(d=>d.average)).size>20,'basket value also varies independently');
});
