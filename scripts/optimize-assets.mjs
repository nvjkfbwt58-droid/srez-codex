import sharp from 'sharp';
import {stat} from 'node:fs/promises';
const names=['copper','kvartal-air','kvartal-right','kvartal-scene','lemon'];
for(const name of names){const from=`public/assets/${name}.png`,to=`public/assets/${name}.webp`;await sharp(from).resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:86,effort:6}).toFile(to);console.log(name,(await stat(from)).size,(await stat(to)).size);}
