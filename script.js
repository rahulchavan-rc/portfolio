document.addEventListener('DOMContentLoaded', () => {
    // --- 1. MINIMAL LOADER LOGIC ---
    document.body.classList.add('loading');
    
    // Quick loader dismissal for a snappy, professional feel
    setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        
        // Trigger initial animations
        setTimeout(() => {
            initScrollAnimations();
            const heroElements = document.querySelectorAll('.hero-section .fade-up, .hero-section .fade-in');
            heroElements.forEach(el => el.classList.add('visible'));
        }, 300);

    }, 3000); // 3s cinematic loader sequence


    // --- 2. SCROLL ANIMATIONS ---
    function initScrollAnimations() {
        const scrollElements = document.querySelectorAll('.fade-up, .fade-in');

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        scrollElements.forEach(el => {
            observer.observe(el);
        });
    }

    // --- 3. SMOOTH SCROLLING ---
    const navLinks = document.querySelectorAll('.nav-links a, .hero-actions a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
            // if it's not an internal hash link, allow default behavior (external links, mailto, download)
        });
    });

    // --- 4. SPOTLIGHT HOVER EFFECT ---
    document.querySelectorAll('.glass-panel').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // --- 5. HERO CANVAS ANIMATION (original implementation) ---
    (function initHeroCanvas() {
        const canvas = document.getElementById('heroCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let dpr = Math.max(1, window.devicePixelRatio || 1);
        let W = 0, H = 0;
        let mouse = { x: -9999, y: -9999 };

        // particles
        const particles = [];
        const PARTICLE_COUNT = 90; // increased for more visual density

        function resize() {
            W = canvas.clientWidth || canvas.offsetWidth || window.innerWidth;
            H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight;
            canvas.width = Math.floor(W * dpr);
            canvas.height = Math.floor(H * dpr);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function initParticles() {
            particles.length = 0;
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                    particles.push({
                        x: Math.random() * W,
                        y: Math.random() * H,
                        vx: (Math.random() - 0.5) * 1.2,
                        vy: (Math.random() - 0.5) * 1.2,
                        r: 1 + Math.random() * 2.4,
                    });
            }
        }

        function onMove(e) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = (e.clientX - rect.left);
            mouse.y = (e.clientY - rect.top);
        }

        function onLeave() {
            mouse.x = -9999;
            mouse.y = -9999;
        }

        canvas.addEventListener('mousemove', onMove);
        canvas.addEventListener('touchmove', e => onMove(e.touches[0] || e), { passive: true });
        canvas.addEventListener('mouseleave', onLeave);
        window.addEventListener('resize', () => { dpr = Math.max(1, window.devicePixelRatio || 1); resize(); initParticles(); });

        let tStart = Date.now();
        function draw() {
            const t = (Date.now() - tStart) * 0.001;

            // background subtle gradient
            const g = ctx.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, 'rgba(10,8,18,0.6)');
            g.addColorStop(1, 'rgba(8,12,24,0.6)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);

            // waveform (several sine layers)
            const baseY = H * 0.55;
            ctx.lineWidth = 2.2;
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(120,90,220,0.25)';

            for (let layer = 0; layer < 3; layer++) {
                const amp = 12 + layer * 8 + (mouse.y > -9000 ? (H - mouse.y) * 0.015 * (3 - layer) : 0);
                const freq = 0.0028 + layer * 0.0018;
                ctx.beginPath();
                for (let x = 0; x <= W; x += 4) {
                    const y = baseY + Math.sin((x * freq) + t * (1.6 + layer * 0.8)) * amp * (1 + 0.22 * Math.sin(t * 1.5 + layer));
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                const alpha = 0.28 + layer * 0.2;
                ctx.strokeStyle = `rgba(${140 + layer * 35},${100 + layer * 25},${230 - layer * 25},${alpha})`;
                ctx.lineWidth = 2 + layer * 0.6;
                ctx.stroke();
            }

            // particles
            particles.forEach(p => {
                // attraction to mouse
                const dx = (mouse.x - p.x);
                const dy = (mouse.y - p.y);
                const dist = Math.hypot(dx, dy) + 0.001;
                if (dist < 240) {
                    const force = (1 - dist / 240) * 1.0; // stronger, longer range attraction
                    p.vx += (dx / dist) * force * 0.12;
                    p.vy += (dy / dist) * force * 0.12;
                }

                // slight noise (a bit livelier)
                p.vx += (Math.random() - 0.5) * 0.04;
                p.vy += (Math.random() - 0.5) * 0.04;

                // integrate
                p.x += p.vx;
                p.y += p.vy;

                // damping
                p.vx *= 0.99;
                p.vy *= 0.99;

                // wrap
                if (p.x < -10) p.x = W + 10;
                if (p.x > W + 10) p.x = -10;
                if (p.y < -10) p.y = H + 10;
                if (p.y > H + 10) p.y = -10;
            });

            // draw particle connections
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d = Math.hypot(dx, dy);
                    if (d < 100) {
                        const alpha = 0.22 * (1 - d / 100);
                        ctx.strokeStyle = `rgba(170,130,255,${alpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            // draw particles
            particles.forEach(p => {
                ctx.beginPath();
                ctx.fillStyle = 'rgba(220,220,255,0.9)';
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(draw);
        }

        // start
        resize();
        initParticles();
        requestAnimationFrame(draw);
    })();
    
});
