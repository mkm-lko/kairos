/**
 * KAIROS — LANDING PAGE ENGINE
 * Vanilla JavaScript implementation for the interactive landing page.
 */

// Global state representation for the landing canvas
const STATE = {
  activeView: "landing"
};

// Initialize when window loads
window.addEventListener("DOMContentLoaded", initLanding);

function initLanding() {
  initLandingNeuralCanvas();
  initThemeToggle();
  registerLandingEvents();
}

// --- THEME TOGGLE ---
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle-btn");
  const icon = document.getElementById("theme-toggle-icon");
  const label = document.getElementById("theme-toggle-label");
  if (!btn) return;

  // Restore saved preference
  const saved = localStorage.getItem("kairos_theme");
  if (saved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    if (icon) icon.textContent = "☀️";
    if (label) label.textContent = "Light";
  }

  btn.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    if (isLight) {
      document.documentElement.removeAttribute("data-theme");
      if (icon) icon.textContent = "🌙";
      if (label) label.textContent = "Dark";
      localStorage.setItem("kairos_theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      if (icon) icon.textContent = "☀️";
      if (label) label.textContent = "Light";
      localStorage.setItem("kairos_theme", "light");
    }
  });
}

// --- LANDING NEURAL CANVAS ANIMATION ---
function initLandingNeuralCanvas() {
  const canvas = document.getElementById("neural-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let particles = [];
  let glassParticles = [];
  const particleCount = 60;
  const glassParticleCount = 15;
  const connectionDistance = 120;
  let mouse = { x: null, y: null, radius: 180 };

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.size = Math.random() * 2.5 + 1.5;
      this.colorType = Math.random() > 0.4 ? 'blue' : 'red';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          let force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 1.2;
          this.y += (dy / dist) * force * 1.2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.colorType === 'red' ? "rgba(127, 29, 29, 0.6)" : "rgba(56, 189, 248, 0.55)";
      ctx.fill();
    }
  }

  class GlassParticle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vy = -(Math.random() * 0.15 + 0.05);
      this.size = Math.random() * 40 + 20;
      this.alpha = Math.random() * 0.015 + 0.005;
    }

    update() {
      this.y += this.vy;
      if (this.y < -this.size) {
        this.y = canvas.height + this.size;
        this.x = Math.random() * canvas.width;
      }
    }

    draw() {
      let grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
      grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
      grad.addColorStop(0.4, `rgba(15, 23, 42, ${this.alpha * 1.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  for (let i = 0; i < glassParticleCount; i++) {
    glassParticles.push(new GlassParticle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < glassParticles.length; i++) {
      glassParticles[i].update();
      glassParticles[i].draw();
    }

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          let alpha = (1 - dist / connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);

          if (particles[i].colorType === 'red' && particles[j].colorType === 'red') {
            ctx.strokeStyle = `rgba(127, 29, 29, ${alpha * 1.5})`;
          } else if (particles[i].colorType === 'blue' && particles[j].colorType === 'blue') {
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          } else {
            ctx.strokeStyle = `rgba(127, 29, 29, ${alpha})`;
          }
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

// --- LANDING PAGE EVENT HANDLERS ---
function registerLandingEvents() {
  // Get Started buttons redirect/open app.html in another tab
  const getStartedNav = document.getElementById("hero-dive-btn-nav");
  if (getStartedNav) {
    getStartedNav.addEventListener("click", () => {
      window.open("app.html", "_blank");
    });
  }

  const getStartedHero = document.getElementById("hero-dive-btn");
  if (getStartedHero) {
    getStartedHero.addEventListener("click", () => {
      window.open("app.html", "_blank");
    });
  }

  // Watch Demo button opens app.html in another tab researching "True Crime"
  const watchDemo = document.getElementById("watch-demo-btn");
  if (watchDemo) {
    watchDemo.addEventListener("click", () => {
      window.open("app.html?topic=True Crime", "_blank");
    });
  }

  // Upgrade to Pro in pricing details saves state to localStorage and opens app
  const buyPro = document.getElementById("pricing-buy-btn");
  if (buyPro) {
    buyPro.addEventListener("click", () => {
      // Add XP to localStorage
      let currentXp = parseInt(localStorage.getItem("kairos_xp") || "150");
      currentXp += 100;
      localStorage.setItem("kairos_xp", currentXp);
      localStorage.setItem("kairos_pro_status", "true");

      // Set trigger flag to toast after landing on app.html
      localStorage.setItem("kairos_toast_trigger", JSON.stringify({
        badge: "PRO STATUS",
        reason: "Full capabilities unlocked. Thank you!"
      }));

      // Open app in new tab
      window.open("app.html", "_blank");
    });
  }
}
