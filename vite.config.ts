import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({plugins:[react()],cacheDir:'.vite',base:mode==='pages'?'./':'/',server:{port:5198,strictPort:true,proxy:{'/api':'http://127.0.0.1:4198','/uploads':'http://127.0.0.1:4198'}},build:{target:['es2020','safari15.4','chrome90','firefox90'],outDir:mode==='pages'?'dist-pages':'dist',chunkSizeWarningLimit:900}}));
