import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultDesign} from '../src/domain';
import {recordEdit,undoEdit,redoEdit,continuesEdit,EMPTY_DESIGN_HISTORY,DESIGN_HISTORY_LIMIT} from '../src/designHistory';
import {fitPercent,zoomIn,zoomOut} from '../src/canvasZoom';
import {studioTextEdit} from '../src/studioTextEdits';

test('undo and redo restore complete designs, a new edit discards the abandoned branch',()=>{
 const first={...defaultDesign,title:'Первый'},second={...first,title:'Второй',fontSize:32};
 const history=recordEdit(EMPTY_DESIGN_HISTORY,first);
 const undone=undoEdit(history,second)!;
 assert.deepEqual(undone.design,first);
 assert.deepEqual(redoEdit(undone.history,undone.design)?.design,second);
 assert.equal(recordEdit(undone.history,first).future.length,0);
 assert.equal(undoEdit(EMPTY_DESIGN_HISTORY,first),null);
});

test('bounded undo history keeps the original design for before/after',()=>{
 let history=EMPTY_DESIGN_HISTORY;
 for(let i=0;i<70;i++)history=recordEdit(history,{...defaultDesign,title:String(i)});
 assert.equal(history.past.length,DESIGN_HISTORY_LIMIT);
 assert.equal(history.original?.title,'0');
 assert.equal(history.past[0].title,'30');
 assert.equal(continuesEdit({key:'font',at:100},'font',500),true);
 assert.equal(continuesEdit({key:'font',at:100},'title',500),false);
 assert.equal(continuesEdit({key:'font',at:100},'font',900),false);
});

test('fitted zoom respects both dimensions and manual controls move in their indicated direction',()=>{
 assert.equal(fitPercent({width:300,height:490},{width:360,height:700}),70);
 assert.equal(fitPercent({width:1000,height:1000},{width:360,height:700}),100);
 assert.equal(fitPercent({width:300,height:100},{width:360,height:700}),30);
 assert.equal(zoomIn(45),60);assert.equal(zoomOut(45),45);
 assert.equal(zoomIn(77),80);assert.equal(zoomOut(77),70);
 assert.equal(zoomIn(120),120);assert.equal(zoomOut(60),60);
});

test('local text commands update only editable copy and leave visual instructions to generation',()=>{
 assert.deepEqual(studioTextEdit('Заголовок: Особое предложение'),{title:'Особое предложение'});
 assert.deepEqual(studioTextEdit('Убери описание'),{showDescription:false});
 assert.equal(studioTextEdit('Сделай фон темнее'),null);
 assert.throws(()=>studioTextEdit('Заголовок: '+'x'.repeat(141)));
});
