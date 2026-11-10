// Bundle DrumPath into one self-contained page for the claude.ai copy (D-021): node tools/build-artifact.mjs
// Inlines every <link rel=stylesheet href="src/…"> and <script src="…"> from index.html → dist/drumpath-claude.html
// Publish it to the DrumPath artifact (capabilities: sample {images:true}, db, user). Google Fonts stay external (allowed).
import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
let html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const used=[];
const file=src=>{const f=src.split('?')[0];used.push(f);return fs.readFileSync(path.join(ROOT,f),'utf8');};
html=html.replace(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g,(m,href)=>/^https?:/.test(href)?m:`<style>\n${file(href)}\n</style>`);
html=html.replace(/<script src="([^"]+)"><\/script>/g,(m,src)=>/^https?:/.test(src)?m:`<script>\n${file(src).replace(/<\/script/gi,'<\\/script')}\n</script>`);
if(/<(script|link)[^>]+(src|href)="(?!https?:|data:|#)[^"]+"/.test(html))throw new Error('a local file was left unbundled');
fs.mkdirSync(path.join(ROOT,'dist'),{recursive:true});fs.writeFileSync(path.join(ROOT,'dist/drumpath-claude.html'),html);
console.log(`dist/drumpath-claude.html: ${Math.round(html.length/1024)} KB from ${used.length} files`);
