document.addEventListener('DOMContentLoaded', function() {
  const heroCarousel = document.getElementById('heroCarousel');
  if (heroCarousel) {
    new bootstrap.Carousel(heroCarousel, {
      interval: 5000,
      wrap: true,
      keyboard: true
    });
  }

  const cards = document.querySelectorAll('.course-card, .category-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(20px)';
        setTimeout(() => {
          entry.target.style.transition = 'all 0.6s ease-out';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1
  });

  cards.forEach(card => observer.observe(card));
});
