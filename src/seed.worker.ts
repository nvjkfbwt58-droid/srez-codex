import {seedData} from './domain';
self.onmessage=()=>{const data=seedData(progress=>self.postMessage({progress}));self.postMessage({data});};
