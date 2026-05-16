/**
 * WeCareForYou - custom external JavaScript.
 * Bundled via angular.json "scripts". Provides small, framework-agnostic
 * UI enhancements (the case study explicitly asks for an external/custom
 * JS file and plain-JS enhancements).
 */
(function () {
  'use strict';

  // Reflect scroll position on <body> so the navbar can elevate on scroll.
  function onScroll() {
    if (window.scrollY > 8) {
      document.body.classList.add('is-scrolled');
    } else {
      document.body.classList.remove('is-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Expose a tiny helper used by the password field for caps-lock hinting.
  window.WeCare = {
    isCapsLock: function (event) {
      return event.getModifierState && event.getModifierState('CapsLock');
    },
    year: function () {
      return new Date().getFullYear();
    },
  };
})();
