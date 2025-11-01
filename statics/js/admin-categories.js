document.addEventListener('DOMContentLoaded', function() {
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      try {
        const res = await fetch('/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message);
        if (result.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  }

  const editCategoryBtns = document.querySelectorAll('.btn-edit-category');
  editCategoryBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const categoryId = this.dataset.categoryId;
      const categoryName = this.dataset.categoryName;
      document.getElementById('editCategoryId').value = categoryId;
      document.getElementById('editCategoryName').value = categoryName;
    });
  });

  const editCategoryForm = document.getElementById('editCategoryForm');
  if (editCategoryForm) {
    editCategoryForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const categoryId = document.getElementById('editCategoryId').value;
      const name = document.getElementById('editCategoryName').value;
      try {
        const res = await fetch('/admin/categories/' + categoryId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const result = await res.json();
        alert(result.message);
        if (result.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  }

  const deleteCategoryBtns = document.querySelectorAll('.btn-delete-category');
  deleteCategoryBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const categoryId = this.dataset.categoryId;
      if (!confirm('Xóa lĩnh vực này?')) return;
      try {
        const res = await fetch('/admin/categories/' + categoryId, {
          method: 'DELETE'
        });
        const result = await res.json();
        alert(result.message);
        if (result.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });
});
