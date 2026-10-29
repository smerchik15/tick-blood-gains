import {readFileSync,writeFileSync,mkdirSync,existsSync,unlinkSync} from 'node:fs';
const html=readFileSync('game.html','utf8');
const handler=readFileSync('worker/handler.mjs','utf8').replaceAll('export const VALUES','const VALUES').replaceAll('export function validateSubmission','function validateSubmission').replaceAll('export async function leaderboard','async function leaderboard');
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js','const HTML='+JSON.stringify(html)+';\n'+handler);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json'));
if(existsSync('dist/index.html'))unlinkSync('dist/index.html');
console.log('Built embedded game and leaderboard Worker');
