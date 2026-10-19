(function () {
  try {
    // 一次性迁移：旧版本可能存了 terminal/midnight 等偏好，清除后回到默认亮色纸面
    if (!localStorage.getItem('blog-theme-migrated')) {
      localStorage.removeItem('blog-theme');
      localStorage.setItem('blog-theme-migrated', '1');
    }
    var t = localStorage.getItem('blog-theme');
    var ok = ['paper', 'midnight'].indexOf(t) >= 0;
    document.documentElement.setAttribute('data-theme', ok ? t : 'paper');
  } catch (e) {}
})();
