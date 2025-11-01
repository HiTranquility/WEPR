document.addEventListener('DOMContentLoaded', function() {
  const createCourseForm = document.getElementById('createCourseForm');
  if (createCourseForm) {
    createCourseForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      try {
        const res = await fetch('/teacher/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message);
        if (result.success) window.location.href = '/teacher/courses';
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  }

  const publishBtns = document.querySelectorAll('.btn-publish-course');
  publishBtns.forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      const courseId = this.dataset.courseId;
      if (!confirm('Xuất bản khóa học này?')) return;
      try {
        const res = await fetch(`/teacher/course/${courseId}/publish`, { method: 'POST' });
        const data = await res.json();
        alert(data.message);
        if (data.success) window.location.reload();
      } catch (err) {
        alert('Có lỗi xảy ra!');
      }
    });
  });
});
