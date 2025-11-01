document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sortSelect');

  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('sort', this.value);
      currentUrl.searchParams.set('page', '1');
      window.location.href = currentUrl.toString();
    });
  }

  const clearFiltersBtn = document.getElementById('clearFilters');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      const currentUrl = new URL(window.location.href);
      currentUrl.search = '';
      window.location.href = currentUrl.toString();
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.set('sort', this.value);
      window.location.href = currentUrl.toString();
    });
  }
});
