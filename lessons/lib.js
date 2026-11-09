/* DrumPath lesson helpers (shared by lesson files) */
'use strict';
var DP_LESSONS=[];
var X=(n,sub,v,o={})=>Object.assign({n,sub,bars:1,v},o);
var rep=(s,k)=>s.repeat(k);
function withFill(sub,base,fill,name){
  const n=4*sub, out={};
  const vs=new Set([...Object.keys(base),'C',...fill.filter(Boolean)]);
  vs.forEach(v=>{
    const b1=(base[v]||rep('.',n)).split(''), b2=(base[v]||rep('.',n)).split('');
    if(v==='HH'||v==='R') b1[0]='.';
    if(v==='C') b1[0]='x';
    for(let k=0;k<fill.length;k++){const i=n-fill.length+k; b2[i]=fill[k]===v?'x':'.';}
    const s=b1.join('')+b2.join(''); if(s.includes('x')) out[v]=s;
  });
  return {n:name,sub,bars:2,v:out};
}
var B8={HH:'xxxxxxxx',K:'x...x...',S:'..x...x.'};
var B8_16={HH:'x.x.x.x.x.x.x.x.',K:'x.......x.......',S:'....x.......x...'};

