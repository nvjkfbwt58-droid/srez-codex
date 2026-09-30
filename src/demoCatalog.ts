import type {Group,Product} from './domain';

// Fictional retail assortment. Official partner catalogs are maintained separately.
export const demoCategories=['Чай и кофе','Хлеб и выпечка','Сладости и десерты','Готовая еда'];
type DemoGroup={id:string;name:string;sizes:[string,string,string];items:[string,number][]};
export const demoGroups:DemoGroup[][]=[
 [
  {id:'coffee-beans',name:'Кофе в зёрнах',sizes:['125 г','250 г','500 г'],items:[['Бразилия Сантос',290],['Эфиопия Сидамо',390],['Колумбия Уила',350],['Бленд «Утренний»',270]]},
  {id:'leaf-tea',name:'Листовой чай',sizes:['50 г','100 г','200 г'],items:[['Ассам с бергамотом',190],['Зелёный чай с жасмином',210],['Молочный улун',240],['Иван-чай с чабрецом',180]]},
  {id:'coffee-to-go',name:'Кофе с собой',sizes:['200 мл','300 мл','400 мл'],items:[['Капучино',180],['Латте',190],['Раф ванильный',240],['Американо',140]]},
  {id:'warm-drinks',name:'Какао и чай с собой',sizes:['200 мл','300 мл','400 мл'],items:[['Какао на молоке',180],['Матча-латте',250],['Чай облепиховый',190],['Чай имбирный с лимоном',170]]},
 ],
 [
  {id:'bread',name:'Хлеб на закваске',sizes:['300 г','500 г','750 г'],items:[['Хлеб ржаной с тмином',140],['Хлеб пшеничный деревенский',130],['Хлеб с семечками',170],['Хлеб цельнозерновой',160]]},
  {id:'croissants',name:'Круассаны',sizes:['1 шт.','2 шт.','4 шт.'],items:[['Круассан сливочный',150],['Круассан миндальный',210],['Круассан с шоколадом',190],['Круассан с фисташкой',240]]},
  {id:'buns',name:'Булочки и слойки',sizes:['1 шт.','2 шт.','4 шт.'],items:[['Булочка с корицей',140],['Слойка с вишней',150],['Улитка с маком',130],['Плюшка с сахаром',100]]},
  {id:'pies',name:'Пироги',sizes:['150 г','300 г','600 г'],items:[['Пирог с яблоком',170],['Пирог с капустой',150],['Пирог с курицей',220],['Киш со шпинатом',230]]},
 ],
 [
  {id:'cookies',name:'Печенье',sizes:['100 г','200 г','300 г'],items:[['Печенье овсяное с клюквой',190],['Печенье с шоколадной крошкой',210],['Печенье миндальное',250],['Печенье имбирное',180]]},
  {id:'chocolate',name:'Шоколад',sizes:['50 г','90 г','150 г'],items:[['Шоколад молочный с фундуком',150],['Шоколад тёмный 70%',170],['Шоколад белый с малиной',190],['Шоколад с солёной карамелью',180]]},
  {id:'desserts',name:'Порционные десерты',sizes:['120 г','180 г','240 г'],items:[['Чизкейк классический',230],['Тирамису',250],['Панна-котта с клубникой',220],['Брауни с грецким орехом',210]]},
  {id:'cakes',name:'Торты',sizes:['500 г','750 г','1 кг'],items:[['Торт медовый',790],['Торт морковный',850],['Торт шоколадный',890],['Торт фисташка-малина',1090]]},
 ],
 [
  {id:'sandwiches',name:'Сэндвичи и роллы',sizes:['150 г','220 г','300 г'],items:[['Сэндвич с индейкой',210],['Ролл с курицей',230],['Сэндвич с тунцом',250],['Ролл с овощами и хумусом',200]]},
  {id:'salads',name:'Салаты',sizes:['150 г','250 г','350 г'],items:[['Салат греческий',220],['Салат с курицей и киноа',260],['Салат овощной',170],['Салат с печёной свёклой',210]]},
  {id:'hot-meals',name:'Горячие блюда',sizes:['250 г','350 г','450 г'],items:[['Курица с булгуром',290],['Паста с грибами',310],['Гречка с овощами',230],['Тефтели с картофельным пюре',320]]},
  {id:'soups',name:'Супы',sizes:['250 мл','350 мл','450 мл'],items:[['Суп томатный',190],['Крем-суп грибной',220],['Суп куриный с лапшой',180],['Крем-суп тыквенный',210]]},
 ],
];

export function demoProducts():Product[]{
 return Array.from({length:192},(_,i)=>{
  const category=i%4,position=Math.floor(i/4),group=demoGroups[category][Math.floor(position/12)];
  const [name,base]=group.items[position%4],size=Math.floor(position%12/4);
  const price=Math.round(base*[1,1.65,2.7][size]/10)*1000;
  return {id:`P${String(i+1).padStart(3,'0')}`,category,groupId:'demo-'+group.id,groupName:group.name,
   name:`${name} · ${group.sizes[size]}`,price,cost:i===2?11500:Math.round(price*[.74,.82,.64,.72][category]),unit:'шт.'};
 });
}

const previousGroups=[['Светлый сорт','Янтарный сорт','Тёмный сорт','Пшеничный сорт'],['Классический вкус','Мягкий вкус','Оригинальный вкус','Лёгкий вкус'],['Чипсы с солью','Фисташки','Арахис','Сухарики','Начос'],['Лимонад лимон','Манго и маракуйя','Минеральная вода','Холодный чай']];
const replacements=new Map(previousGroups.flatMap((names,category)=>names.map((name,i)=>[`g-${category}-${name}`,'demo-'+demoGroups[category][i%4].id])));
// Upgrade only the old demo identifiers; custom category identifiers remain untouched.
export function migrateDemoRules(group:Group):Group{
 return {...group,children:group.children.map(rule=>'children' in rule?migrateDemoRules(rule):
  rule.field==='category'&&rule.values?{...rule,values:[...new Set(rule.values.map(id=>replacements.get(id)||id))]}:rule)};
}
