import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',timeout:60000,use:{baseURL:'http://127.0.0.1:5178',viewport:{width:1600,height:1000},locale:'ru-RU',timezoneId:'Europe/Moscow',trace:'retain-on-failure'},workers:1,reporter:[['list'],['html',{open:'never'}]]});
