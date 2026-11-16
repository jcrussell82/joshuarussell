(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* smooth scroll like Harbor: Lenis with lerp .17*(1.5-.85) ≈ .11; off for touch devices, Safari and reduced motion */
  var touch=matchMedia('(pointer:coarse)').matches||/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||(/Mac/.test(navigator.userAgent)&&navigator.maxTouchPoints>2);
  var safari=/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg/.test(navigator.userAgent);
  if(window.Lenis&&!reduce&&!touch&&!safari){
    var lenis=new Lenis({lerp:.17*(1.5-.85),wheelMultiplier:1,anchors:{offset:-96}});
    (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(performance.now());
    window.__lenis=lenis;
    var lb0=document.querySelector('.lightbox');
    if(lb0)new MutationObserver(function(){lb0.hidden?lenis.start():lenis.stop();}).observe(lb0,{attributes:true,attributeFilter:['hidden']});
  }
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){var t=e.target;
      if(t.classList.contains('rv')&&e.isIntersecting)t.classList.add('in');
      if(t.tagName==='VIDEO'){
        if(e.isIntersecting&&!reduce){if(!t.src)t.src=t.dataset.src;var p=t.play();if(p&&p.catch)p.catch(function(){});}
        else if(!t.paused)t.pause();
      }});
  },{threshold:.2}):null;
  document.querySelectorAll('.rv,video[data-src]').forEach(function(el){io?io.observe(el):el.classList.add('in');});
  /* reduced motion: show poster, give users a play control */
  if(reduce)document.querySelectorAll('video[data-src]').forEach(function(v){v.controls=true;v.src=v.dataset.src;v.preload='none';});
  /* video grows to full size as it scrolls toward the middle of the screen */
  var gw=[].slice.call(document.querySelectorAll('.grow-wrap'));
  if(gw.length&&!reduce){
    var tick=false;
    function grow(){gw.forEach(function(w){
      var r=w.getBoundingClientRect(),vh=innerHeight;
      var p=1-(r.top+r.height/2-vh/2)/(vh*.75);p=Math.max(0,Math.min(1,p));
      var e=1-Math.pow(1-p,3);
      var f=w.querySelector('.video-frame');
      f.style.setProperty('--gs',(0.84+0.16*e).toFixed(4));
      f.style.setProperty('--gr',(40-18*e).toFixed(1)+'px');
    });tick=false;}
    addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(grow);}},{passive:true});
    addEventListener('resize',grow);grow();
  }
  /* horizontal chapters: pinned, sideways on desktop; normal stack on small screens / reduced motion */
  var hs=document.querySelector('.hscroll');
  if(hs){
    var tr=hs.querySelector('.hs-track'),bar=hs.querySelector('.hs-progress i'),n=+getComputedStyle(hs).getPropertyValue('--count')||hs.querySelectorAll('.hpanel').length;
    var nums=[].slice.call(hs.querySelectorAll('.hs-nums span'));var mq=matchMedia('(min-width:1000px) and (min-height:640px)'),on=false,tk=false;
    function park(x){var i=Math.floor(x),f=x-i,t=Math.min(1,Math.max(0,(f-.3)/.7));t=t*t*(3-2*t);return i+t;}
    function upd(){tk=false;if(!on)return;var r=hs.getBoundingClientRect(),span=hs.offsetHeight-innerHeight;
      var pr=Math.min(1,Math.max(0,-r.top/span)),x=park(pr*(n-1)+0.0001);if(pr>=1)x=n-1;
      var pp=tr.children;var stepPx=pp.length>1?pp[1].offsetLeft-pp[0].offsetLeft:0;tr.style.transform=hs.classList.contains('hs-fixed')?'translate3d('+(-x*100/n)+'%,0,0)':'translate3d('+(-x*stepPx)+'px,0,0)';var cur=hs.querySelectorAll('.hpanel')[Math.round(x)];if(cur){var ch=cur.dataset.ch;nums.forEach(function(s){var on=s.dataset.ch===ch;if(on&&!s.classList.contains('on')){s.classList.remove('out');s.classList.add('on');}else if(!on&&s.classList.contains('on')){s.classList.remove('on');s.classList.add('out');}});}if(bar)bar.style.setProperty('--hp',(x/(n-1)*100)+'%');}
    function mode(){on=mq.matches&&!reduce;document.documentElement.classList.toggle('h-on',on);if(!on)tr.style.transform='';upd();}
    addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(upd);}},{passive:true});
    addEventListener('resize',function(){mode();});mode();
  }
  /* click any chapter graphic to see it larger */
  var lb=document.querySelector('.lightbox');
  if(lb){var li=lb.querySelector('img'),last=null;
    function close(){lb.hidden=true;li.src='';if(last)last.focus();}
    document.querySelectorAll('.zoom').forEach(function(b){b.addEventListener('click',function(){last=b;li.src=b.dataset.full;li.alt=b.querySelector('img').alt;lb.hidden=false;lb.querySelector('.lb-close').focus();});});
    lb.addEventListener('click',close);addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)close();});}
  /* animated gradient: 3D simplex noise drives the alpha of a #b3cbf9 field on a low-res canvas */
  (function(){
    var cv=document.querySelector('.aura');if(!cv||!cv.getContext)return;
    var g=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    var p=new Uint8Array(256);for(var i=0;i<256;i++)p[i]=i;
    for(i=255;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=p[i];p[i]=p[j];p[j]=t;}
    var perm=new Uint8Array(512);for(i=0;i<512;i++)perm[i]=p[i&255];
    var F3=1/3,G3=1/6;
    function n3(x,y,z){
      var s=(x+y+z)*F3,i=Math.floor(x+s),j=Math.floor(y+s),k=Math.floor(z+s),t=(i+j+k)*G3;
      var x0=x-i+t,y0=y-j+t,z0=z-k+t,i1,j1,k1,i2,j2,k2;
      if(x0>=y0){if(y0>=z0){i1=1;j1=0;k1=0;i2=1;j2=1;k2=0}else if(x0>=z0){i1=1;j1=0;k1=0;i2=1;j2=0;k2=1}else{i1=0;j1=0;k1=1;i2=1;j2=0;k2=1}}
      else{if(y0<z0){i1=0;j1=0;k1=1;i2=0;j2=1;k2=1}else if(x0<z0){i1=0;j1=1;k1=0;i2=0;j2=1;k2=1}else{i1=0;j1=1;k1=0;i2=1;j2=1;k2=0}}
      var pts=[[x0,y0,z0,0,0,0],[x0-i1+G3,y0-j1+G3,z0-k1+G3,i1,j1,k1],[x0-i2+2*G3,y0-j2+2*G3,z0-k2+2*G3,i2,j2,k2],[x0-1+.5,y0-1+.5,z0-1+.5,1,1,1]];
      var ii=i&255,jj=j&255,kk=k&255,n=0;
      for(var q=0;q<4;q++){var P=pts[q],tt=.6-P[0]*P[0]-P[1]*P[1]-P[2]*P[2];
        if(tt>0){var gi=g[perm[ii+P[3]+perm[jj+P[4]+perm[kk+P[5]]]]%12];tt*=tt;n+=tt*tt*(gi[0]*P[0]+gi[1]*P[1]+gi[2]*P[2]);}}
      return 32*n;
    }
    var mobile=innerWidth<690,R=mobile?90:110,SPEED=850,col=[0xb3,0xcb,0xf9];
    cv.width=R;cv.height=R;var ctx=cv.getContext('2d'),img=ctx.createImageData(R,R),d=img.data,clock=Math.random()*5000,ax=1.4,ay=1.4,vis=true;
    function size(){var r=cv.parentNode.getBoundingClientRect(),k=r.height/r.width;if(k<1){ax=1.4;ay=1.4*k}else{ax=k/3;ay=1}}
    function frame(){
      for(var x=0;x<R;x++)for(var y=0;y<R;y++){var v=n3(x/R*ax,y/R*ay,clock/SPEED),o=4*(x+y*R);d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=265*v;}
      ctx.putImageData(img,0,0);
    }
    function loop(){if(vis&&!document.hidden){frame();clock++;}requestAnimationFrame(loop);}
    size();addEventListener('resize',size);frame();cv.classList.add('on');
    if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting;},{rootMargin:'200px'}).observe(cv);
    if(!reduce)requestAnimationFrame(loop);
  })();
})();
