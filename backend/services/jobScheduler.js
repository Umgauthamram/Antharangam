

import { initializeHarvesters } from './harvesterManager.js'; 


export function startScheduler() {
    console.log('[JobScheduler] Starting scheduler...');
    
    initializeHarvesters(); 
    
}