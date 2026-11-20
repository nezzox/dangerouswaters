import {test} from 'node:test';import {execFileSync} from 'node:child_process';
test('Ko-fi server validates authenticity, hides private data and deduplicates retries',()=>{execFileSync('python3',['-m','unittest','discover','-s','integrations/kofi/tests'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});});
