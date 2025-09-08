const backendURL = "http://127.0.0.1:8000"; //Local


document.addEventListener('DOMContentLoaded', initializePage);

function initializePage() {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  loadFeatured();
  initializeEventListeners();
}

function initializeEventListeners() {
  const modal = document.getElementById('modal');
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  const newsletterButton = document.querySelector('.newsletter-form button');
  const newsletterInput = document.querySelector('.newsletter-form input');

  if (newsletterButton) newsletterButton.addEventListener('click', e => { e.preventDefault(); handleNewsletterSignup(); });
  if (newsletterInput) newsletterInput.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); handleNewsletterSignup(); } });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

async function loadFeatured(category = null) {
  try {
    showLoadingState();
    const url = `${backendURL}/featured?num_articles=6`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const articles = await response.json();
    if (!articles?.length) return showError('No articles found.');
    renderHeroSection(articles[0]);
    renderFeaturedGrid(articles.slice(1));
  } catch (err) {
    console.error(err);
    showError('Failed to load articles.');
  }
}

function renderHeroSection(article) {
  const hero = document.getElementById("hero");
  hero.innerHTML = `
    <div class="hero-card" onclick="loadRecommendations(${article.id}, '${escapeHtml(article.title)}')">
      <div class="hero-image">
        <img src="https://picsum.photos/seed/${encodeURIComponent(article.title)}/800/500" alt="Hero Image" loading="lazy">
      </div>
      <div class="hero-content">
        <div class="hero-badge">NEWS OF THE DAY</div>
        <h2>${escapeHtml(article.title)}</h2>
        <div class="hero-meta">
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(article.date)}</span>
          <span><i class="fas fa-clock"></i> 5 min read</span>
          <span><i class="fas fa-eye"></i> Trending</span>
        </div>
      </div>
    </div>
  `;
}

function renderFeaturedGrid(articles) {
  const grid = document.getElementById("featuredGrid");
  grid.innerHTML = "";
  articles.forEach((article, idx) => {
    const card = document.createElement("div");
    card.className = "news-card";
    card.innerHTML = `
      <img src="https://picsum.photos/seed/${encodeURIComponent(article.title)}/400/200" alt="Article Image" loading="lazy">
      <div class="card-content">
        <h3>${escapeHtml(article.title)}</h3>
        <div class="card-meta">
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(article.date)}</span>
          <span><i class="fas fa-user"></i> Editor's Pick</span>
        </div>
        <a href="#" class="read-more">Discover Similar <i class="fas fa-arrow-right"></i></a>
      </div>
    `;
    card.addEventListener('click', () => loadRecommendations(article.id, article.title));
    card.style.animationDelay = `${idx * 0.1}s`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.animation = 'fadeInUp 0.6s ease forwards';
    grid.appendChild(card);
  });
}

async function loadRecommendations(articleId, title) {
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  const container = document.getElementById("recommendations");

  modal.style.display = "block";
  document.body.style.overflow = 'hidden';
  modalTitle.innerHTML = `<span class="loading"></span> Loading...`;
  container.innerHTML = createLoadingGrid();

  try {
    const response = await fetch(`${backendURL}/recommend/${articleId}?num_recs=5`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const recommendations = await response.json();
    if (!recommendations?.length) return showNoRecommendationsMessage(title);
    renderRecommendations(recommendations, title);
  } catch (err) {
    console.error(err);
    showRecommendationError();
  }
}

function renderRecommendations(recs, title) {
  const modalTitle = document.getElementById("modalTitle");
  const container = document.getElementById("recommendations");
  const truncated = title.length > 50 ? title.slice(0, 50) + '...' : title;
  modalTitle.innerHTML = `<i class="fas fa-lightbulb"></i> Stories Similar to: "${escapeHtml(truncated)}"`;
  container.innerHTML = "";

  recs.forEach((rec, idx) => {
    const card = document.createElement("div");
    card.className = "recommendation-card";
    card.innerHTML = `
      <img src="https://picsum.photos/seed/${encodeURIComponent(rec.title)}/300/150" alt="Article Image" loading="lazy">
      <div class="rec-content">
        <h3>${escapeHtml(rec.title)}</h3>
        <div class="rec-meta">
          <span><i class="fas fa-calendar-alt"></i> ${formatDate(rec.date)}</span>
          <div class="similarity-score">${Math.round(rec.score * 100)}% Match</div>
        </div>
        <a href="${escapeHtml(rec.link)}" target="_blank" rel="noopener noreferrer" class="rec-link">
          <i class="fas fa-external-link-alt"></i> Read Full Story
        </a>
      </div>
    `;
    card.style.animationDelay = `${idx * 0.1}s`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.animation = 'fadeInUp 0.5s ease forwards';
    container.appendChild(card);
  });
}

function closeModal() { 
  const modal = document.getElementById("modal"); 
  modal.style.animation = 'modalFadeOut 0.3s ease forwards';
  document.body.style.overflow = 'auto'; 
  setTimeout(() => { modal.style.display = "none"; modal.style.animation = ''; }, 300);
}

function handleNewsletterSignup() {
  const input = document.querySelector('.newsletter-form input');
  const email = input.value.trim();
  if (!email || !isValidEmail(email)) return showNotification('Please enter a valid email.', 'error');

  const btn = document.querySelector('.newsletter-form button');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span class="loading"></span> Subscribing...'; btn.disabled = true;

  setTimeout(() => {
    showNotification('Subscribed successfully!', 'success');
    input.value = ''; btn.innerHTML = orig; btn.disabled = false;
  }, 1500);
}

// Utility & Helpers
function showLoadingState() { document.getElementById("hero").innerHTML = createLoadingHero(); document.getElementById("featuredGrid").innerHTML = createLoadingCards(); }
function createLoadingHero() { return `<div class="hero-card" style="pointer-events:none"><div class="hero-image" style="background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><div class="loading" style="width:40px;height:40px;border-width:4px;"></div></div><div class="hero-content"><div class="hero-badge">LOADING...</div><h2>Loading featured news...</h2></div></div>`; }
function createLoadingCards() { return Array(5).fill('<div class="news-card" style="pointer-events:none;"><div style="height:200px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><div class="loading"></div></div><div class="card-content"><h3>Loading...</h3></div></div>').join(''); }
function createLoadingGrid() { return `<div style="grid-column:1/-1;text-align:center;padding:60px;"><div class="loading" style="width:40px;height:40px;border-width:4px;margin:0 auto 20px;"></div><p>Loading recommendations...</p></div>`; }
function showNoRecommendationsMessage(title) { document.getElementById("recommendations").innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;"><h3>No stories similar to "${escapeHtml(title)}"</h3></div>`; }
function showRecommendationError() { document.getElementById("recommendations").innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;"><h3>Failed to load recommendations</h3></div>`; }
function showError(msg) { document.getElementById("hero").innerHTML = `<div style="padding:60px;text-align:center"><h2>${escapeHtml(msg)}</h2><button onclick="loadFeatured()">Retry</button></div>`; }
function showNotification(msg, type='info'){const n=document.createElement('div');const colors={success:'#2ed573',error:'#ff4757',warning:'#ffa502',info:'#5352ed'};n.style.cssText=`position:fixed;top:20px;right:20px;background:${colors[type]};color:white;padding:15px 25px;border-radius:10px;z-index:9999;animation:slideInRight 0.3s ease;`;n.innerHTML=escapeHtml(msg);document.body.appendChild(n);setTimeout(()=>{n.style.animation='slideOutRight 0.3s ease forwards';setTimeout(()=>n.remove(),300)},5000);}
function escapeHtml(unsafe){return typeof unsafe==='string'?unsafe.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):unsafe;}
function formatDate(date){const d=new Date(date);return isNaN(d.getTime())?date:d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}
function isValidEmail(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);}
function addDynamicStyles(){const s=document.createElement('style');s.textContent=`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOutRight{to{transform:translateX(100%);opacity:0}}`;document.head.appendChild(s);}
addDynamicStyles();
