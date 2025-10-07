// Main JS for interactions
// - Mobile nav toggle
// - Smooth scrolling for anchor links
// - Reveal on scroll via IntersectionObserver
// - Simple parallax for hero background
// - Contact form basic handling (no backend)

document.addEventListener('DOMContentLoaded', () => {
  // set current year in footers
  const y = new Date().getFullYear();
  ['year','year-2','year-3','year-4'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = y;
  });

  // mobile nav toggle (class-based for accessibility)
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navWrap = document.querySelector('.nav-wrap');
  if(toggle && navLinks && navWrap){
    toggle.addEventListener('click', ()=>{
      const open = navLinks.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close menu when clicking a nav link (useful on mobile)
    navLinks.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{
      if(navLinks.classList.contains('mobile-open')){
        navLinks.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded','false');
      }
    }));
  }

  // smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e)=>{
      const href = a.getAttribute('href');
      if(href.length>1){
        e.preventDefault();
        const target = document.querySelector(href);
        if(target){
          target.scrollIntoView({behavior:'smooth',block:'start'});
        }
      }
    });
  });

  // reveal on scroll
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },{threshold:0.12});

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // simple parallax: move bg layers slightly on mouse
  const hero = document.querySelector('.hero');
  if(hero){
    const l1 = document.querySelector('.layer-1');
    const l2 = document.querySelector('.layer-2');
    hero.addEventListener('mousemove', (e)=>{
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if(l1) l1.style.transform = `translate(${x*20}px, ${y*20}px)`;
      if(l2) l2.style.transform = `translate(${x*-30}px, ${y*-30}px)`;
    });
  }

  // contact form: simple client-side validation and mock send
  const form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const msg = form.querySelector('.form-msg');
      if(!name || !email || !message){
        if(msg) msg.textContent = 'Please fill in all fields.';
        return;
      }
      // mock send
      if(msg) msg.textContent = 'Sending message...';
      setTimeout(()=>{
        if(msg) msg.textContent = 'Thanks! I\'ll get back to you soon.';
        form.reset();
      },900);
    });
  }

  // GSAP scroll-trigger animations (if loaded)
  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.hero-text h1', {y:20, opacity:0, duration:0.8, delay:0.2});
    gsap.from('.hero-text .lead', {y:16, opacity:0, duration:0.8, delay:0.35});
    gsap.utils.toArray('.project-card').forEach((card, i)=>{
      gsap.from(card, {y:30, opacity:0, duration:0.6, delay:i*0.08, scrollTrigger:{trigger:card, start:'top 85%'}});
    });
  }

  /* -----------------------------
     Particle background (lightweight)
     - Canvas-based particles that slowly drift and glow
     - React subtly to mouse movement
     - Performance: limit particle count based on device pixel ratio
  ------------------------------*/
  (function particleBackground(){
    // create canvas and insert into DOM (full-bleed, behind content)
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width = 0; let height = 0; let particles = [];
    let pointer = {x: -9999, y: -9999};
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Particle constructor
    function Particle(x,y,r, hue){
      this.x = x; this.y = y; this.r = r; this.h = hue;
      this.vx = (Math.random()-0.5) * 0.2;
      this.vy = (Math.random()-0.5) * 0.2;
      this.alpha = 0.15 + Math.random()*0.45;
    }
    Particle.prototype.update = function(){
      // slight attraction to pointer
      const dx = pointer.x - this.x;
      const dy = pointer.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy) + 0.001;
      const attract = Math.min(0.08 / dist, 0.03);
      this.vx += dx * attract * 0.0005;
      this.vy += dy * attract * 0.0005;
      this.x += this.vx;
      this.y += this.vy;
      // wrap around edges
      if(this.x < -50) this.x = width + 50;
      if(this.x > width + 50) this.x = -50;
      if(this.y < -50) this.y = height + 50;
      if(this.y > height + 50) this.y = -50;
    };
    Particle.prototype.draw = function(){
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r*3);
      g.addColorStop(0, `hsla(${this.h}, 90%, 60%, ${this.alpha})`);
      g.addColorStop(0.4, `hsla(${this.h}, 80%, 50%, ${this.alpha*0.35})`);
      g.addColorStop(1, `hsla(${this.h}, 70%, 40%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fill();
    };

    function resize(){
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.ceil(width * DPR);
      canvas.height = Math.ceil(height * DPR);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      initParticles();
    }

    function initParticles(){
      particles = [];
      // choose count based on width (keep light)
      const count = Math.ceil((width/1200) * 45);
      for(let i=0;i<count;i++){
        const x = Math.random()*width;
        const y = Math.random()*height;
        const r = 8 + Math.random()*14;
        // hue range matches accent palette (cyan -> purple -> blue)
        const hue = 180 + Math.random()*180; // ~180-360
        particles.push(new Particle(x,y,r,hue));
      }
    }

    let rafId = null;
    function tick(){
      ctx.clearRect(0,0,width,height);
      // gentle background wash
      ctx.fillStyle = 'rgba(6,10,18,0.18)';
      ctx.fillRect(0,0,width,height);
      for(const p of particles){
        p.update();
        p.draw();
      }
      rafId = requestAnimationFrame(tick);
    }

    // pointer handling
    window.addEventListener('mousemove', (e)=>{
      pointer.x = e.clientX; pointer.y = e.clientY;
    });
    window.addEventListener('mouseleave', ()=>{ pointer.x = -9999; pointer.y = -9999; });

    // pause animation when page not visible
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden){ if(rafId) cancelAnimationFrame(rafId); rafId = null; }
      else if(!rafId) tick();
    });

    window.addEventListener('resize', ()=> resize());
    // initialize
    resize();
    tick();

  })();
});
