import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>({plugins:[react()],base:mode==='pages'?'./':'/',server:{port:5178,strictPort:true,proxy:{'/api':'http://127.0.0.1:4178','/uploads':'http://127.0.0.1:4178'}},build:{outDir:mode==='pages'?'dist-pages':'dist',chunkSizeWarningLimit:900}}));
