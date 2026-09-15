import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../server/store';
import {createApp} from '../server/app';
function simplePDF(){const stream='0.95 0.3 0.1 rg 0 0 400 400 re f';const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 400] /Contents 4 0 R >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];let text='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=Buffer.byteLength(text);text+='xref\n0 5\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return text;}
test('PDF brandbook upload converts only selected pages into persistent assets',async()=>{const store=new Store(await mkdtemp(join(tmpdir(),'srez-pdf-'))),app=createApp({store}),server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',()=>r()));try{const body=new FormData();body.append('files',new Blob([simplePDF()],{type:'application/pdf'}),'brandbook.pdf');body.append('pages','1');const r=await fetch(`http://127.0.0.1:${(server.address() as any).port}/api/brands/kvartal/assets`,{method:'POST',body});const out=await r.json() as any;assert.equal(r.status,201,JSON.stringify(out));assert.equal(out.assets.length,2);assert.equal(out.assets[1].page,1);assert.equal(out.assets[1].mime,'image/png');assert.equal(out.assets[1].parentId,out.assets[0].id);}finally{await new Promise<void>(r=>server.close(()=>r()));store.close();}});
