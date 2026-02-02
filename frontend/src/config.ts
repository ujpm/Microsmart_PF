import logo1 from './assets/logo-1.svg';
import logo2 from './assets/logo-2.svg';
import logo3 from './assets/logo-3.svg';

export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:8000"
};

export const BRAND = {
  name: "MicroSmart",
  version: "BETA V 1.1.0",
  logos: {
    icon: logo1,       
    primary: logo2,    
    wordmark: logo3    
  },
  urls: {
    suite: "https://microsmart-complex.uwizeyimanajp2.workers.dev/"
  }
};