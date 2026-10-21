import {createRequire} from 'node:module';
const content=createRequire(import.meta.url)('../public/listing-content.js');
export const {categories,inferCategory,formatDescription}=content;
