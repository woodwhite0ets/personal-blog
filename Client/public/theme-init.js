(function () {
  try {
    var t = localStorage.getItem('blog-theme');
    var ok = ['paper', 'midnight', 'terminal', 'solar'].indexOf(t) >= 0;
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', ok ? t : 'paper');
  } catch (e) {}
})();
