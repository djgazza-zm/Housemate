// Housemate Zm - Frontend JavaScript

// Featured Slider Controls
function slideLeft() {
  const slider = document.getElementById('featuredSlider');
  if (slider) slider.scrollBy({ left: -320, behavior: 'smooth' });
}

function slideRight() {
  const slider = document.getElementById('featuredSlider');
  if (slider) slider.scrollBy({ left: 320, behavior: 'smooth' });
}

// Admin Tabs
function showTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = 'block';
  if (btn) btn.classList.add('active');
}

// Auto-dismiss flash messages after 5 seconds
document.addEventListener('DOMContentLoaded', () => {
  const flashes = document.querySelectorAll('.flash');
  flashes.forEach(flash => {
    setTimeout(() => {
      flash.style.opacity = '0';
      flash.style.transform = 'translateY(-10px)';
      setTimeout(() => flash.remove(), 300);
    }, 5000);
  });

  // Touch support for slider
  const slider = document.getElementById('featuredSlider');
  if (slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; });
    slider.addEventListener('mouseup', () => { isDown = false; });
    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    });
  }
});
