/* 새로고침 시 브라우저가 "마지막으로 스크롤했던 위치"(예: 십자말풀이 섹션)를 기억했다가 페이지 로드 후 되돌리는
   기본 동작(scroll restoration) 때문에, 로딩이 끝나고 우리가 scrollTo(0,0)으로 맨 위로 보정하는 순간
   html{scroll-behavior:smooth} 때문에 그 되돌아온 지점에서 위로 스르륵 스크롤되는 게 화면에 그대로 보였던 것.
   브라우저가 아예 위치를 기억/복원하지 않도록 끔 */
if('scrollRestoration' in history)history.scrollRestoration='manual';
/* ===== 십자말풀이 스테이지 스케일 =====
   피그마 원본이 1920x1080 캔버스라서, 그 비율(16:9) 그대로 축소/확대해 항상 100vh 안에 꽉 차게 맞춤 */
(()=>{
  const stage=document.getElementById('cwStage'),cwSec=document.getElementById('cw');
  function fit(){
    const w=cwSec.clientWidth,h=cwSec.clientHeight;
    const s=Math.min(w/1920,h/1080);
    stage.style.transform=`scale(${s})`;
    stage.style.left=((w-1920*s)/2)+'px';
    stage.style.top=((h-1080*s)/2)+'px';
  }
  fit();addEventListener('resize',fit);
})();
/* ===== 프로젝트 데이터 (내용/이미지는 여기서 수정) =====
   피그마 원본(node 75:308)의 격자를 셀 단위로 실측해서 그대로 재현함(단어는 실제 프로젝트명의 로마자 표기).
   가로/세로 교차 지점과 번호(1~6) 순서까지 원본과 동일 — 그래서 배경 장식 애셋도 피그마 원본 좌표를 그대로 쓸 수 있음 */
const projects=[
  {t:"소소복담",        tag:"Branding · Package", d:"소소복담 프로젝트 소개 문구를 여기에 입력하세요.",                   img:"", word:"SOSOBOKDAM",   x:0, y:0,dir:"h"}, // 1 가로
  {t:"국순당 리디자인",  tag:"Brand · Redesign",   d:"국순당의 브랜드 아이덴티티와 패키지를 새롭게 해석한 리디자인 프로젝트.", img:"", word:"KOOKSOONDANG",x:6, y:0,dir:"v"}, // 2 세로
  {t:"AI와 디자인의 상관관계", tag:"Research · Essay", d:"AI 시대에 디자이너의 역할과 창작 과정이 어떻게 달라지는지 탐구한 리서치.", img:"", word:"CORRELATION", x:5, y:6,dir:"h"}, // 3 가로
  {t:"해잇",            tag:"Brand · Graphic",    d:"해잇 프로젝트 소개 문구를 여기에 입력하세요.",                       img:"", word:"HAEIT",        x:11,y:5,dir:"v"}, // 4 세로
  {t:"삼토 페스티벌",   tag:"Event · Visual",     d:"삼토 페스티벌의 키비주얼과 홍보물 디자인.",                          img:"", word:"SAMTOFESTIVAL",x:8, y:9,dir:"h"}, // 5 가로
  {t:"집메이트",        tag:"UX/UI · App",        d:"룸메이트 매칭과 공동 생활을 돕는 서비스 기획 및 디자인.",            img:"", word:"ZIPMATE",      x:19,y:5,dir:"v"}, // 6 세로
];
const grayMap=[0,1,2,3,4,5]; // 회색 블록 → 표시할 프로젝트 이미지 (projects[i].img)

/* ===== 십자말풀이 생성 ===== */
const grid=document.getElementById('grid');
const cells={};
let maxX=0,maxY=0,minX=Infinity,minY=Infinity;
projects.forEach((p,i)=>{
  [...p.word].forEach((ch,k)=>{
    const x=p.x+(p.dir==='h'?k:0), y=p.y+(p.dir==='v'?k:0), key=x+','+y;
    maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);minX=Math.min(minX,x);minY=Math.min(minY,y);
    let el=cells[key];
    if(!el){
      el=document.createElement('div');el.className='cell';el.dataset.p='';el.dataset.ch=ch;
      el.style.left=`calc(var(--c)*${x})`;el.style.top=`calc(var(--c)*${y})`;
      grid.appendChild(el);cells[key]=el;
    }
    el.dataset.p+=i+',';
    if(k===0){const s=document.createElement('sup');s.textContent=i+1;el.appendChild(s);}
  });
});
const gridPxW=60*(maxX+1),gridPxH=60*(maxY+1);
grid.style.width=gridPxW+'px';grid.style.height=gridPxH+'px';
const all=[...grid.children]; // 격자선 SVG를 넣기 전에 셀 목록부터 확정(안 그러면 SVG까지 '칸'으로 잘못 섞임)
// 격자선은 칸마다 따로 그리지 않고 SVG 하나에 선분만 모아서 그림: 내부에서 맞닿는 경계는 한쪽 칸의
// 오른쪽/아래쪽 선으로만 한 번 그리고(항상 그림), 바깥 테두리(이웃이 없는 쪽)만 위쪽/왼쪽 선을 추가로 그림
// → 모든 경계가 정확히 한 번씩만, 하나의 렌더링 패스로 그려져 확대해도 모서리가 어긋나지 않음
{
  const svgNS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(svgNS,'svg');
  svg.setAttribute('class','gridlines');
  svg.setAttribute('width',gridPxW);svg.setAttribute('height',gridPxH);
  const addLine=(x1,y1,x2,y2)=>{
    const ln=document.createElementNS(svgNS,'line');
    ln.setAttribute('x1',x1);ln.setAttribute('y1',y1);ln.setAttribute('x2',x2);ln.setAttribute('y2',y2);
    svg.appendChild(ln);
  };
  Object.keys(cells).forEach(key=>{
    const [x,y]=key.split(',').map(Number),px=x*60,py=y*60;
    addLine(px,py+60,px+60,py+60); // 아래쪽 선(항상)
    addLine(px+60,py,px+60,py+60); // 오른쪽 선(항상)
    if(!cells[x+','+(y-1)])addLine(px,py,px+60,py); // 위쪽 이웃 없으면 위쪽 선도
    if(!cells[(x-1)+','+y])addLine(px,py,px,py+60); // 왼쪽 이웃 없으면 왼쪽 선도
  });
  grid.appendChild(svg);
}
// 격자 자체가 이제 피그마 원본과 셀 단위로 동일한 배치라서, 배경 장식(.g1~.g6)은 피그마 실측 좌표를 CSS에 그대로 박아두면 됨(별도 보정 불필요)
all.forEach(el=>{
  const ids=el.dataset.p.split(',').filter(Boolean).map(Number);
  el.addEventListener('mouseenter',()=>show(ids[0]));
  el.addEventListener('click',()=>show(ids[0]));
});
function show(i){
  const p=projects[i];
  all.forEach(c=>c.classList.toggle('on',c.dataset.p.split(',').includes(String(i))));
  document.querySelectorAll('.it').forEach(e=>e.classList.toggle('act',+e.dataset.i===i));
  document.querySelectorAll('.gray').forEach((g,k)=>{const on=grayMap[k]===i;g.classList.toggle('cur',on);});
}
/* 드래그 앤 드롭: 칸에 글자 넣기 */
const KEY='cw-letters';let saved={};
try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const putFns={};
Object.keys(cells).forEach(k=>{
  const el=cells[k],span=document.createElement('span');span.className='ch';el.appendChild(span);
  if(saved[k])span.textContent=saved[k];
  const put=t=>{const c=[...(t||'').trim()][0]||'';span.textContent=c;saved[k]=c;try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}};
  putFns[k]=put;
  el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('over')});
  el.addEventListener('dragleave',()=>el.classList.remove('over'));
  el.addEventListener('drop',e=>{e.preventDefault();el.classList.remove('over');put(e.dataTransfer.getData('text/plain'))});
  el.addEventListener('dblclick',()=>put(''));
});
/* 십자말풀이 자동으로 풀기: 모든 칸에 정답 글자를 채움 */
document.getElementById('cwAuto').addEventListener('click',()=>{
  Object.keys(cells).forEach(k=>putFns[k](cells[k].dataset.ch));
});
const chipBox=document.getElementById('chips');
[...new Set(projects.map(p=>p.word).join('').split(''))].forEach(ch=>{
  const c=document.createElement('div');c.className='chip';c.draggable=true;c.textContent=ch;
  c.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',ch);e.dataTransfer.effectAllowed='copy'});
  chipBox.appendChild(c);
});
document.querySelector('.cw-stage').addEventListener('mouseleave',()=>{
  all.forEach(c=>c.classList.remove('on'));
  document.querySelectorAll('.gray').forEach(g=>g.classList.remove('cur'));
  document.querySelectorAll('.it').forEach(e=>e.classList.remove('act'));
});
/* 소개 패널 */
function buildPanel(el,label,idx){
  el.innerHTML=`<h4>${label}</h4>`+idx.map(i=>{const p=projects[i];return `<div class="it" data-i="${i}"><div class="r1"><span class="n">0${i+1}</span><span class="t">${p.t}</span><span class="g">${p.tag}</span></div><div class="d">${p.d}</div></div>`}).join('');
  el.querySelectorAll('.it').forEach(e=>{e.addEventListener('mouseenter',()=>show(+e.dataset.i));e.addEventListener('click',()=>show(+e.dataset.i));});
}
buildPanel(document.getElementById('pa'),'가로',projects.map((p,i)=>p.dir==='h'?i:-1).filter(i=>i>=0));
buildPanel(document.getElementById('pd'),'세로',projects.map((p,i)=>p.dir==='v'?i:-1).filter(i=>i>=0));
/* 배경 장식(피그마 Union 애셋, HTML에 이미 심어둔 img) + 호버 연결 */
document.querySelectorAll('.gray').forEach((g,k)=>{
  let tm;
  g.addEventListener('mouseenter',()=>{show(grayMap[k]);clearTimeout(tm);tm=setTimeout(()=>g.classList.add('seen'),2000);});
  g.addEventListener('mouseleave',()=>clearTimeout(tm));
});
/* 회색 블록에 이미지 채우기 */
document.querySelectorAll('.gray').forEach((g,k)=>{
  const p=projects[grayMap[k]];
  if(p&&p.img){g.innerHTML=`<img src="${p.img}" alt="${p.t}">`;}
});

/* ===== 스크롤: 빛이 내려와 십자말풀이로 ===== */
// 조명이 작아지며 잔상 남기고 사라지는 연출은 히어로 쪽(.hero-wrap)에서 처리되고,
// 여기 beam-track은 그 이후 검정→회색 배경 전환만 짧게 담당(문구 없음, 스크롤 거리도 짧게 줄임)
const track=document.getElementById('track'),stage=document.getElementById('stage');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smoothstep=t=>t*t*(3-2*t); // 구간 전체를 부드러운 S자 곡선으로 보간해서, 색이 휙 바뀌지 않고 눈에 편하게 서서히 바뀌도록 함
function onScroll(){
  const r=track.getBoundingClientRect(), total=track.offsetHeight-innerHeight;
  const p=clamp(-r.top/total,0,1);
  const vh=innerHeight;
  // 배경: 검정(#080809) → 옅은 회색(십자말풀이 섹션과 같은 톤 #f5f5f5). 구간 전체(0~1)를 다 써서 서서히 전환
  const bp=smoothstep(p);
  const rC=Math.round(8+(245-8)*bp),gC=Math.round(8+(245-8)*bp),bC=Math.round(9+(245-9)*bp);
  stage.style.background=`rgb(${rC},${gC},${bC})`;
  // 말풀이 등장 (스크롤 마지막 구간 이후 진입)
  const cw=document.getElementById('cw').getBoundingClientRect();
  if(cw.top<vh*.95&&!started){started=true;reveal();}
}
let started=false;
function reveal(){
  all.forEach((c,i)=>setTimeout(()=>{c.classList.add('in','flash');setTimeout(()=>c.classList.remove('flash'),500);},i*45));
  setTimeout(()=>show(0),all.length*45+300);
}
/* ===== 스포트라이트: 가운데서 하나 켜지면 드래그해서 제자리에 놓기 → 고정되며 회색으로 → 다음 것 등장 → 셋 다 놓이면 전부 컬러로 ===== */
(()=>{
  const hero=document.getElementById('hero'),heroWrap=document.getElementById('heroWrap'),cv=document.getElementById('hc'),ctx=cv.getContext('2d');
  // 퍼즐이 끝난 뒤(=body 잠금 해제 후) 스크롤하면, 화면은 그대로 붙어있는 채로 이 값이 0→1로 진행되며
  // 조명이 작아지고 잔상을 남기며 아래로 사라지는 연출에 쓰임
  function fallQ(){
    const total=heroWrap.offsetHeight-innerHeight;
    if(total<=0)return 0;
    return Math.max(0,Math.min(1,-heroWrap.getBoundingClientRect().top/total));
  }
  const texts=[document.getElementById('tb0'),document.getElementById('tb1'),document.getElementById('tb2')];
  const hh=document.getElementById('hh');
  hh.textContent='';
  // dir: 이 빛의 빔이 뻗어나가는 방향(도, 0=오른쪽 90=아래 180=왼쪽 270=위, 화면 기준)
  // hx,hy(하이라이트 오프셋)를 0으로 둬서 빛의 가장 밝은 지점이 항상 텍스트 슬롯의 정중앙(HOMES)과 정확히 겹치도록 함
  // 색은 피그마 원본(node 95:122)의 실제 그라데이션(중심=진한 색 → 가장자리=옅은 색)을 그대로 가져옴.
  // 예전엔 중심을 옅은 색으로 뒀었는데(하얗게 빛나는 느낌), 이번 레퍼런스는 반대로 중심이 진하고 가장자리로 갈수록 옅어짐.
  const BLOBS=[
    {c:['#E5FF7F','#CEFEA2','#B7FEC6'],hx:0,hy:0,dir:55, side:1,rr:764/2398*1.05*1.18*1.2}, // 녹색(Ellipse 24)
    {c:['#F46171','#F99E94','#FEDCB7'],hx:0,hy:0,dir:125,side:-1,rr:764/2398*1.05*1.18*1.2}, // 핑크(Ellipse 23)
    {c:['#054ABB','#6A9DD1','#CFF0E7'],hx:0,hy:0,dir:270,side:1,rr:764/2398*1.05*1.18*1.2}, // 파랑(Ellipse 22)
  ];
  function hex2rgb(hex){const n=parseInt(hex.replace('#',''),16);return{r:(n>>16)&255,g:(n>>8)&255,b:n&255};}
  function rgbStr({r,g,b}){return`rgb(${r},${g},${b})`;}
  function toGray(hex){ // 채도를 뺀, 살짝 차가운 무채색 잔상
    const{r,g,b}=hex2rgb(hex),l=r*.299+g*.587+b*.114;
    return rgbStr({r:Math.round(l*.94),g:Math.round(l*.96),b:Math.round(Math.min(255,l*1.04))});
  }
  function anyToRgb(c){ // '#hex' 또는 'rgb(r,g,b)' 둘 다 받는다
    if(c[0]==='#')return hex2rgb(c);
    const m=c.match(/\d+/g).map(Number);return{r:m[0],g:m[1],b:m[2]};
  }
  function mix(colA,colB,t){
    const a=anyToRgb(colA),b=anyToRgb(colB);
    return rgbStr({r:Math.round(a.r+(b.r-a.r)*t),g:Math.round(a.g+(b.g-a.g)*t),b:Math.round(a.b+(b.b-a.b)*t)});
  }
  BLOBS.forEach(b=>{b.gray=b.c.map(toGray);b.phase='pending';b.x=0;b.y=0;});
  // 낙하 중 위치/크기는 fq(진행률)만의 함수라서, 현재~조금 이전 fq를 한 프레임 안에서 다시 샘플링하면
  // 스크롤 속도와 무관하게 항상 매끄러운 잔상을 얻을 수 있음(프레임 간 상태를 들고 있을 필요가 없어 가볍고, 겹쳐 찍혀 하얗게 뜨는 문제도 없음)
  function fallPos(homeX,homeY,i,q){
    const conv=Math.pow(q,.7);
    const sway=Math.sin(q*Math.PI*(2.1+i*.4)+i*2.1)*w*.025*(1-q*.6);
    return{x:homeX+(w*.5-homeX)*conv*.85+sway,y:homeY+q*h*1.4};
  }
  const fallShrink=q=>Math.pow(1-q,1.25);
  function drawFallTrail(i,home,r,baseAlpha,fq,cols){
    const mid=anyToRgb(cols[1]),SPAN=.14,K=40; // 원래 K=10이라 잔상이 듬성듬성한 개별 원으로 겹쳐 보였음 →
    // 촘촘하게 더 잘게 쪼개고(그만큼 한 조각당 알파는 비례해서 낮춰) 하나의 매끈한 번짐처럼 보이게 함
    const ALPHA_K=.4*(10/K);
    // 원 본체와 같은 이유로 'screen' 사용(밝게 겹치는 느낌은 유지하되 순식간에 흰색으로 날아가지 않도록).
    // 원 본체는 blur 필터가 걸려서 실제 반지름보다 더 크고 부드럽게 퍼져 보이는데, 꼬리는 blur가 없어서
    // 같은 반지름이어도 더 작고 또렷하게 보였음 → 꼬리에도 원 본체와 같은 정도의 blur를 걸어 크기가 맞도록 함
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';ctx.lineJoin='round';ctx.filter=`blur(${r*.03}px)`;
    let prev=null;
    // k=0(머리, 지금 위치)은 바로 아래에서 그릴 원 본체와 겹쳐 하얗게 뜨므로 제외하고 그 뒤쪽 잔상만 그림
    for(let k=K;k>=1;k--){
      const q=fq-(k/K)*SPAN;
      if(q<0){prev=null;continue;}
      const pos=fallPos(home.x,home.y,i,q),rr=r*fallShrink(q),nodeT=1-k/K;
      const a=baseAlpha*(1-q)*nodeT*ALPHA_K;
      if(prev&&a>.008){
        ctx.strokeStyle=`rgba(${mid.r},${mid.g},${mid.b},${a})`;
        ctx.lineWidth=Math.max(.5,rr*1.15);
        ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(pos.x,pos.y);ctx.stroke();
      }
      prev=pos;
    }
    ctx.restore();
  }
  let w=0,h=0,dpr=1;
  let HOMES=[{x:0,y:0},{x:0,y:0},{x:0,y:0}],SNAPR=[0,0,0];
  const clampX=(x,m=0)=>Math.max(m,Math.min(w-m,x)),clampY=(y,m=0)=>Math.max(m,Math.min(h-m,y));
  function size(){
    dpr=Math.min(2,devicePixelRatio||1);w=hero.clientWidth;h=hero.clientHeight;
    cv.width=w*dpr;cv.height=h*dpr;
    const hr=hero.getBoundingClientRect();
    // 슬롯(글자 자리)은 실제 텍스트가 CSS로 놓인 위치를 그대로 읽어와 계산 — 화면 크기가 달라져도 항상 정확히 맞음
    HOMES=texts.map(el=>{
      const tr=el.getBoundingClientRect();
      return {x:(tr.left+tr.right)/2-hr.left,y:(tr.top+tr.bottom)/2-hr.top};
    });
    SNAPR=texts.map(el=>{
      const tr=el.getBoundingClientRect();
      return Math.min(100,Math.max(40,Math.hypot(tr.width,tr.height)/2*.85));
    });
  }
  size();
  new ResizeObserver(size).observe(hero);

  // 순서대로 하나씩: 가운데 등장 → 드래그해서 제자리로 → 고정+회색 → 다음 등장 → 셋 다 놓이면 전부 컬러로
  const ORDER=[2,0,1]; // 파랑(2) → 녹색(0) → 핑크(1) 순서로 등장
  let seqIdx=-1,cur=-1,allColorAt=0;
  function spawnNext(){
    seqIdx++;
    if(seqIdx>=ORDER.length){ // 셋 다 자리 잡음: 잠시 후 전부 컬러로 되돌리고 스크롤 해제
      cur=-1;
      setTimeout(()=>{
        allColorAt=performance.now();
        BLOBS.forEach(b=>b.phase='revealed');
        document.body.classList.remove('lock');
        hh.textContent='SCROLL ↓';
      },500);
      return;
    }
    cur=ORDER[seqIdx];
    const b=BLOBS[cur];
    size(); // 등장 직전에 크기를 다시 재서, 화면 중앙 좌표가 항상 최신 값이 되도록
    b.phase='active';b.onAt=performance.now();
    b.x=b.tx=w*.5;b.y=b.ty=h*.5; // 화면 정중앙에서 켜짐
    // 빛줄기 끝(anchor)은 등장한 자리를 기준으로 한 번만 계산해서 화면 밖으로 멀리 고정 — 이후 원이 움직여도 이 점은 그대로, 원 쪽만 방향을 틀며 따라감
    const rad=b.dir*Math.PI/180,ux=Math.cos(rad),uy=Math.sin(rad);
    const len=Math.hypot(w,h)*1.15; // 화면 대각선보다 길게 뻗어서 끝이 반드시 화면 밖으로 나가도록
    b.anchor={x:b.x+ux*len,y:b.y+uy*len};
    // 화면 대각선(diag) 전체를 "움직일 수 있는 최대 거리"로 잡았던 게 틀렸음 — 중앙(b.x,b.y)에서 실제로 화면 경계에 닿을 때까지
    // anchor 방향(ux,uy)으로 이동 가능한 거리는 그보다 훨씬 짧음(가로/세로 각각 중앙~가장자리 절반 거리 중 먼저 닿는 쪽).
    // 레이-박스(ray-box) 교차로 정확한 최대 이동거리(maxReach)를 구해야 마우스를 화면 끝까지 움직였을 때 비율이 실제로 0 근처까지 내려감
    const txB=ux>0?(w-b.x)/ux:(ux<0?(0-b.x)/ux:Infinity);
    const tyB=uy>0?(h-b.y)/uy:(uy<0?(0-b.y)/uy:Infinity);
    const maxReach=Math.min(txB,tyB);
    b.anchorDist0=len;b.anchorMinD=len-maxReach;
    hh.textContent='빛을 마우스로 움직여서 제자리를 찾아주세요';
  }
  window.__lightSeqStart=()=>{if(seqIdx<0)setTimeout(spawnNext,900);};

  // 이제 드래그가 아니라 마우스를 따라 그대로 움직임
  addEventListener('pointermove',e=>{
    if(cur<0||BLOBS[cur].phase!=='active')return;
    const r=hero.getBoundingClientRect();
    BLOBS[cur].tx=clampX(e.clientX-r.left);BLOBS[cur].ty=clampY(e.clientY-r.top);
  });

  function frame(){
    requestAnimationFrame(frame);
    if(hero.getBoundingClientRect().bottom<0)return;
    if(!w||!h){size();if(!w||!h)return;}
    try{draw();}catch(err){}
  }
  // 형광등이 켜지듯: 완전히 꺼진 상태에서 몇 차례 깜빡이다 밝게 안정됨
  const FLICKER=[[0,0],[70,1],[130,.85],[190,1],[250,.9],[330,1]];
  const FLICKER_END=FLICKER[FLICKER.length-1][0];
  function flickerAlpha(age){
    if(age<0)return 0;
    if(age>=FLICKER_END)return 1;
    for(let i=FLICKER.length-1;i>=0;i--){if(age>=FLICKER[i][0])return FLICKER[i][1];}
    return 0;
  }
  const MUTE_MS=420; // 회색으로 가라앉는 트랜지션 시간
  const UNMUTE_MS=550; // 마지막에 다시 컬러로 돌아오는 트랜지션 시간
  const SETTLE_HOLD=350; // 제자리 근처에 왔을 때 바로 붙지 않고 잠시 멈칫하는 시간
  const SETTLE_MS=750; // 그 후 천천히 제자리로 미끄러져 들어가는 시간
  function easeOutCubic(t){return 1-Math.pow(1-t,3);}
  // 피그마 레퍼런스(node 75:365)를 전체 섹션 스크린샷으로 다시 확인: 원과 맞닿는 넓은 쪽은 투명하게 사라지고
  // (원 자체의 빛이 이어받음), anchor(먼 쪽)의 좁은 끝이 오히려 진하고 선명한 색으로 보이는 구조.
  // → 원 쪽은 지름만큼 넓고 알파 0(안 보임, 그래서 이음매 위치는 무관), anchor 쪽은 좁고 불투명.
  function drawBeam(b,cx,cy,r,alpha){
    const anchor=b.anchor;if(!anchor)return;
    let dx=anchor.x-cx,dy=anchor.y-cy,d=Math.hypot(dx,dy)||1;
    const ux=dx/d,uy=dy/d,px=-uy*b.side,py=ux*b.side;
    // 피그마 원본(node 75:365) 실측: 원 쪽은 원 반지름의 .42배로 좁고, 멀어질수록 원 반지름의 1.06배로 넓어짐.
    // 길이는 화면 밖까지 무한히 뻗는 게 아니라 원 반지름의 3.6배 정도의 유한한 길이.
    // 색도 원본처럼 원과 맞닿는 쪽이 진하고 불투명, 끝으로 갈수록 옅어지며 알파 0으로 사라짐(빛줄기 자체 그라데이션만으로 자연스럽게 원과 연결됨)
    // 빛줄기 끝(끝의 좁은 tip)은 화면 안에서 잘린 채로 보이면 안 되고, 항상 화면 밖에 고정되어 있어야 함.
    // 화면이 작아지면 r*3.6로는 화면 경계까지도 못 미칠 수 있어서, 현재 위치(cx,cy)에서 anchor 방향으로
    // 실제 화면 경계까지 닿는 거리를 구해 그보다는 반드시 더 길게(경계를 넘어서게) 뻗도록 함
    const txB=ux>0?(w-cx)/ux:(ux<0?(0-cx)/ux:Infinity);
    const tyB=uy>0?(h-cy)/uy:(uy<0?(0-cy)/uy:Infinity);
    const edgeLen=Math.max(0,Math.min(txB,tyB));
    const len=Math.max(r*3.6,edgeLen*1.15),farX=cx+ux*len,farY=cy+uy*len;
    const nearHalf=r*0.96,farHalf=r*.42; // 원 쪽이 넓고 멀어질수록 좁아지도록(반대 방향으로 수정)
    ctx.save();
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha;ctx.filter=`blur(${r*.05}px)`;
    const g=ctx.createLinearGradient(cx,cy,farX,farY);
    const near=hex2rgb(b.c[1]),far=hex2rgb(b.c[0]);
    g.addColorStop(0,`rgba(${near.r},${near.g},${near.b},0)`);
    g.addColorStop(1,`rgba(${far.r},${far.g},${far.b},.9)`);
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.moveTo(cx+px*nearHalf,cy+py*nearHalf);
    ctx.lineTo(farX+px*farHalf,farY+py*farHalf);
    ctx.lineTo(farX-px*farHalf,farY-py*farHalf);
    ctx.lineTo(cx-px*nearHalf,cy-py*nearHalf);
    ctx.closePath();ctx.fill();
    ctx.restore();
  }
  let lastFq=-1;
  function draw(){
    const sc=Math.max(w,h)*.62,now=performance.now();
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const fq=fallQ();
    if(fq!==lastFq){ // 텍스트/힌트도 조명이 떨어지는 만큼 같이 옅어짐
      lastFq=fq;
      const op=1-fq;
      texts.forEach(t=>t.style.opacity=op);
      hh.style.opacity=op;
    }
    BLOBS.forEach((b,i)=>{
      if(b.phase==='pending')return;
      let r=b.rr*sc;
      let alpha=1,cols=b.c,cx,cy,fading=false;
      if(b.phase==='active'){
        b.x+=(b.tx-b.x)*.16;b.y+=(b.ty-b.y)*.16; // 무겁지 않게, 손 따라 비교적 빠르게
        b.x=clampX(b.x);b.y=clampY(b.y);
        cx=b.x;cy=b.y;
        const home=HOMES[i];
        if(Math.hypot(cx-home.x,cy-home.y)<SNAPR[i]){ // 제자리 근처 → 바로 붙지 않고 잠시 멈췄다가 천천히 자리로 들어감
          b.phase='settling';b.settleAt=now;b.fromX=cx;b.fromY=cy;
        }
        alpha=flickerAlpha(now-b.onAt);
        drawBeam(b,cx,cy,r,alpha);
      }else if(b.phase==='settling'){
        const home=HOMES[i],age=now-b.settleAt;
        if(age<SETTLE_HOLD){cx=b.fromX;cy=b.fromY;}
        else{
          const t=Math.min(1,(age-SETTLE_HOLD)/SETTLE_MS),te=easeOutCubic(t);
          cx=b.fromX+(home.x-b.fromX)*te;cy=b.fromY+(home.y-b.fromY)*te;
          if(t>=1){ // 완전히 자리 잡음 → 고정하고 회색으로, 다음 것 등장
            b.x=b.tx=home.x;b.y=b.ty=home.y;
            b.phase='placed';b.muteAt=now;
            texts[i].classList.add('hit');
            setTimeout(spawnNext,600);
          }
        }
        alpha=flickerAlpha(now-b.onAt);
        drawBeam(b,cx,cy,r,alpha);
      }else if(b.phase==='placed'){ // 회색 잔상으로 가라앉음
        cx=HOMES[i].x;cy=HOMES[i].y;
        const t=Math.min(1,(now-b.muteAt)/MUTE_MS);
        cols=b.c.map((c,k)=>mix(c,b.gray[k],t));
        alpha=1-.35*t;
      }else{ // revealed: 마지막에 전부 다시 컬러로, 이후 스크롤하면 아래로 떨어지며 사라짐
        fading=true; // 정지해 있을 때든 떨어지는 중이든 동일하게 취급(아래에서 렌더 방식을 안 바꿔야 떨어지기 시작하는 순간 크기/밝기가 툭 튀지 않음)
        cx=HOMES[i].x;cy=HOMES[i].y;
        const t=Math.min(1,(now-allColorAt)/UNMUTE_MS);
        cols=b.c.map((c,k)=>mix(b.gray[k],c,t));
        alpha=.65+.35*t;
        if(fq>0){
          // 셋이 따로따로가 아니라 한 무리로 모이면서 떨어지도록, 화면 중앙 쪽으로 함께 수렴시킴
          drawFallTrail(i,HOMES[i],r,alpha,fq,cols);
          const pos=fallPos(HOMES[i].x,HOMES[i].y,i,fq);
          cx=pos.x;cy=pos.y;
          // 머리(원 본체)와 꼬리(잔상)가 같은 fallShrink 공식을 써야 크기가 서로 어긋나지 않음(둘 다 같이 작아짐)
          r=r*fallShrink(fq);
          alpha=alpha*(1-fq);
        }
      }
      if(alpha>.008&&r>.4){
        // 화면 밖에 고정된 빛줄기 끝(anchor)에 마우스(원)가 가까워질수록 블러가 약해져 또렷해지고,
        // 멀어질수록(=원래 기본 느낌) 블러가 강해지도록 anchor까지의 거리 비율로 블러 세기를 계산
        let blurK=.03;
        // anchor 거리 기반으로 블러를 바꾸는 건 마우스로 직접 움직이는 동안(active/settling)에만 의미가 있음.
        // placed/revealed(떨어지는 중 포함)에서도 그대로 적용하면, 세 원마다 anchor 방향이 달라서(55°/125°/270°)
        // 한가운데로 모여 떨어지는 동안 원마다 anchor까지 거리가 서로 달라져 블러(=겉보기 크기)가 제각각이 되어 버림
        // → 그 상태에서는 고정된 기본 블러(.03)만 쓰게 해서 세 원이 항상 똑같은 크기로 보이게 함
        if((b.phase==='active'||b.phase==='settling')&&b.anchor&&b.anchorDist0){
          const dA=Math.hypot(b.anchor.x-cx,b.anchor.y-cy);
          // 화면 안에서 실제로 움직일 수 있는 범위(anchorMinD~anchorDist0)만으로 비율을 잡아야 마우스를 움직이는 만큼 확실히 반응함
          const ratio=Math.max(0,Math.min(1,(dA-b.anchorMinD)/(b.anchorDist0-b.anchorMinD))); // 0=anchor 쪽으로 최대한 다가감(거의 블러 없음), 1=가장 멀어짐(기존 느낌)
          blurK=.0+.02*ratio*ratio; // 최대 블러를 .03으로 더 낮춰서, 가까워지면 거의 선명해지도록
        }
        // 피그마 원본은 원에 mix-blend-mode:lighten을 씀(채널별 최댓값만 취함) — 'lighter'(단순 가산)처럼
        // 값을 더해서 금방 흰색으로 뜨지 않고, 훨씬 채도 있게 색이 유지됨. 'screen'도 lighter보다는 완만하지만
        // lighten만큼 원색을 그대로 지키지는 못해서, 평소(active/placed 등)엔 lighten을 쓰고
        // 배경이 밝아진 뒤 떨어질 때만(fading) 여전히 screen을 씀(순간적으로 밝아지는 느낌이 필요해서)
        ctx.globalCompositeOperation=fading?'screen':'lighten';ctx.filter=`blur(${r*blurK}px)`;ctx.globalAlpha=alpha;
        const g=ctx.createRadialGradient(cx+(b.hx||0)*r,cy+(b.hy||0)*r,0,cx,cy,r);
        g.addColorStop(0,cols[0]);g.addColorStop(.38,cols[1]);g.addColorStop(.68,cols[2]);g.addColorStop(.85,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
      }
    });
    ctx.globalCompositeOperation='source-over';ctx.filter='none';ctx.globalAlpha=1;
  }
  requestAnimationFrame(frame);
})();
/* ===== 인트로: 스위치 → 로딩 → 메인 ===== */
(()=>{
  const intro=document.getElementById('intro'),sw=document.getElementById('sw'),pct=document.getElementById('pct'),bar=document.getElementById('bar');
  let busy=false;
  scrollTo({top:0,left:0,behavior:'instant'}); // behavior:'instant'로 scroll-behavior:smooth를 무시하고 즉시 이동(안 그러면 스르륵 스크롤되는 게 보임)
  sw.addEventListener('click',()=>{
    if(busy)return;busy=true;
    sw.classList.add('on');intro.classList.add('go');
    const t0=performance.now(),D=2600;
    (function step(now){
      const p=Math.min(1,(now-t0)/D),e=1-Math.pow(1-p,2);
      const n=Math.round(e*100);pct.textContent='LOADING '+n+'%';bar.style.width=n+'%';
      if(p<1)return requestAnimationFrame(step);
      setTimeout(()=>{intro.classList.add('done');scrollTo({top:0,left:0,behavior:'instant'});window.__lightSeqStart&&window.__lightSeqStart();},350); // 로딩이 끝나고 잠시 후부터 스포트라이트가 하나씩 순서대로 켜짐
    })(t0);
  });
})();
/* ===== 마지막 섹션: 커서를 따라다니는 원 + 드래그 가능한 텍스트 ===== */
(()=>{
  const end=document.getElementById('end'),ball=document.getElementById('ball'),mq=document.getElementById('mq');
  const words=["Photoshop","Illustrator","After Effects","Figma","InDesign","Premiere Pro","React","HTML","CSS","JavaScript","Claude","UX/UI","Branding","Motion"];
  const sep="  ·  ";
  const rows=[];
  for(let i=0;i<14;i++){
    const r=document.createElement('div');r.className='row';
    const k=i*3%words.length,u=words.slice(k).concat(words.slice(0,k)).join(sep)+sep;
    r.innerHTML='<span>'+u+'</span><span>'+u+'</span><span>'+u+'</span>';
    mq.appendChild(r);rows.push({el:r,o:-i*137,v:(i%2?1:-1)*(.35+(i%3)*.15)});
  }
  let tx=0,ty=0,cx=0,cy=0,drag=false,lx=0,dx=0;
  end.addEventListener('mousemove',e=>{
    const r=end.getBoundingClientRect(),s=ball.offsetWidth;
    tx=e.clientX-r.left-s/2-ball.offsetLeft;ty=e.clientY-r.top-s/2-ball.offsetTop;
    if(drag){dx+=e.clientX-lx;lx=e.clientX;}
  });
  end.addEventListener('mousedown',e=>{drag=true;lx=e.clientX;end.style.cursor='grabbing'});
  addEventListener('mouseup',()=>{drag=false;end.style.cursor='grab'});
  end.addEventListener('touchstart',e=>{drag=true;lx=e.touches[0].clientX},{passive:true});
  end.addEventListener('touchmove',e=>{dx+=e.touches[0].clientX-lx;lx=e.touches[0].clientX},{passive:true});
  end.addEventListener('touchend',()=>drag=false);
  (function loop(){
    cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
    ball.style.transform='translate('+cx+'px,'+cy+'px)';
    const h=rows[0].el.offsetHeight||60,top=(end.offsetHeight-h*rows.length)/2;
    mq.style.transform='translate('+(-ball.offsetLeft-cx)+'px,'+(top-ball.offsetTop-cy)+'px)';
    rows.forEach(r=>{
      r.o+=r.v;const w=r.el.firstElementChild.offsetWidth||1;
      const p=(((r.o+dx*(r.v>0?1:-1)*.9)%w)-w)%w;
      r.el.style.transform='translateX('+p+'px)';
    });
    requestAnimationFrame(loop);
  })();
})();
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
