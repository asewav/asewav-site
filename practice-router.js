(() => {
  document.body.classList.toggle('studio-only', new URLSearchParams(window.location.search).get('hero') !== 'pair');
  const musicAnchors = new Set(['book', 'buy', 'listen', 'inside', 'guides', 'sample', 'updates', 'faq', 'tonnetz']);
  function followLegacyLink() {
    if (musicAnchors.has(window.location.hash.slice(1))) {
      window.location.replace('/music-education/' + window.location.hash);
    }
  }
  followLegacyLink();
  window.addEventListener('hashchange', followLegacyLink);
})();
