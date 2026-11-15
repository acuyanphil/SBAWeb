/* Southland College - SBA | site.js
   Shared behaviour for every page: menu, dark mode, entrance animations,
   page transitions, card spotlight and the "selected program" pop-up. */
(function () {
    'use strict';

    var d = document, root = d.documentElement;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ready(fn) {
        if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', fn); else fn();
    }

    ready(function () {

        /* ---------- Mobile menu ---------- */
        var nav = d.getElementById('nav'), menuBtn = d.getElementById('menu');
        function closeMenu() {
            if (!nav) return;
            nav.classList.remove('open');
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        }
        if (nav && menuBtn) {
            menuBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var open = nav.classList.toggle('open');
                menuBtn.setAttribute('aria-expanded', open);
            });
            d.addEventListener('click', function (e) {
                if (!nav.contains(e.target) && e.target !== menuBtn) closeMenu();
            });
            d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
            window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });
        }

        /* ---------- Dark / light theme ---------- */
        var themeBtn = d.getElementById('theme-toggle');
        var saved = null;
        try { saved = localStorage.getItem('theme'); } catch (e) { }
        if (saved === 'dark') d.body.classList.add('dark-theme');
        root.classList.remove('pre-dark');

        function paintThemeLabel() {
            if (!themeBtn) return;
            themeBtn.textContent = d.body.classList.contains('dark-theme') ? '☀️ Light' : '🌙 Dark';
        }
        paintThemeLabel();

        if (themeBtn) {
            var themeTimer;
            themeBtn.addEventListener('click', function () {
                root.classList.add('theme-anim');
                d.body.classList.toggle('dark-theme');
                var dark = d.body.classList.contains('dark-theme');
                paintThemeLabel();
                try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { }
                clearTimeout(themeTimer);
                themeTimer = setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
            });
        }

        /* ---------- Top loading bar ---------- */
        var bar = d.createElement('div');
        bar.id = 'page-loader';
        bar.setAttribute('aria-hidden', 'true');
        d.body.appendChild(bar);
        requestAnimationFrame(function () { bar.classList.add('run'); });

        /* ---------- Smooth page-to-page transitions ---------- */
        d.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a || e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;

            var url;
            try { url = new URL(a.href, location.href); } catch (err) { return; }
            if (url.protocol !== location.protocol || url.host !== location.host) return;
            if (!/\.html?$/i.test(url.pathname) && !/\/$/.test(url.pathname)) return;

            var samePage = url.pathname === location.pathname;
            if (samePage && url.hash && url.search === location.search) return;   // in-page anchor: native smooth scroll
            if (samePage && url.search === location.search) {                     // clicked the page you are on
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
                closeMenu();
                return;
            }

            e.preventDefault();
            closeMenu();
            if (reduce) { location.href = url.href; return; }
            var enroll = a.classList.contains('btn-enroll');
            if (enroll) {
                // "dive in" from the button: the page zooms toward it while the arrow flies off
                var mainEl = d.querySelector('main');
                var br = a.getBoundingClientRect(), mr = mainEl.getBoundingClientRect();
                mainEl.style.transformOrigin = (br.left + br.width / 2 - mr.left) + 'px ' + (br.top + br.height / 2 - mr.top) + 'px';
                a.classList.add('is-going');
                d.body.classList.add('is-enrolling');
            }
            d.body.classList.add('is-leaving');
            bar.classList.remove('run');
            bar.classList.add('leave');
            setTimeout(function () { location.href = url.href; }, enroll ? 560 : 320);
        });

        // coming back with the browser Back button (page restored from cache)
        window.addEventListener('pageshow', function (e) {
            if (e.persisted) {
                d.body.classList.remove('is-leaving');
                bar.classList.remove('leave');
            }
        });

        /* ---------- Gentle reveal of elements (load + scroll) ---------- */
        var targets = [
            '.pagehead', '.hero > *', '.news-head', '.we-offer', '.why-head', '.why-card', '.why-cta', '.news-card', '.dcard',
            '.video-feature > *', '.program-card', '.card', '.step-card',
            '.tuition-section > *', '.student-assistance-section > *', '.enrollment-section > *',
            '.vm-block', '.attributes-col > h2', '.attribute-item', '.peo-section',
            '.section-center-heading', '.staff-card', '.accreditation-card', '.faq-card',
            'footer .wrap > div'
        ].join(',');

        var list = Array.prototype.slice.call(d.querySelectorAll(targets));
        if (!reduce && 'IntersectionObserver' in window) {
            list.forEach(function (el) { el.classList.add('rv'); });
            var first = true;
            var io = new IntersectionObserver(function (entries) {
                var vis = entries.filter(function (en) { return en.isIntersecting; })
                    .sort(function (a, b) {
                        var ra = a.boundingClientRect, rb = b.boundingClientRect;
                        return (ra.top - rb.top) || (ra.left - rb.left);
                    });
                vis.forEach(function (en, i) {
                    var base = first ? 180 : 0;
                    en.target.style.setProperty('--d', (base + Math.min(i, 8) * 90) + 'ms');
                    en.target.classList.add('in');
                    io.unobserve(en.target);
                });
                if (vis.length) first = false;
            }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
            list.forEach(function (el) { io.observe(el); });
        }

        /* ---------- Cursor spotlight on cards ---------- */
        if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
            var spot = '.dcard, .news-card, .program-card, .org-card, .step-card, .staff-card';
            d.addEventListener('pointermove', function (e) {
                var c = e.target.closest && e.target.closest(spot);
                if (!c) return;
                var r = c.getBoundingClientRect();
                c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                c.style.setProperty('--my', (e.clientY - r.top) + 'px');
            }, { passive: true });
        }

        /* ---------- Programs page: pop up the program chosen on the home page ---------- */
        var grid = d.querySelector('.programs-grid');
        if (grid) {
            var params = new URLSearchParams(location.search);
            var wanted = params.get('program') || location.hash.replace('#', '');
            var card = wanted && d.getElementById(wanted);
            if (card && card.classList.contains('program-card')) {
                setTimeout(function () {
                    card.classList.remove('rv', 'in');
                    card.style.removeProperty('--d');
                    grid.classList.add('has-focus');
                    card.classList.add('is-picked');
                    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
                    setTimeout(function () {
                        grid.classList.remove('has-focus');
                        card.classList.remove('is-picked');
                    }, 3000);
                }, reduce ? 0 : 700);
            }
        }

        /* ---------- Count-up numbers ---------- */
        var counters = Array.prototype.slice.call(d.querySelectorAll('[data-count]'));
        if (counters.length && !reduce && 'IntersectionObserver' in window) {
            counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
            var cio = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    var el = en.target, end = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
                    var t0 = null, dur = 1500;
                    cio.unobserve(el);
                    (function step(ts) {
                        if (t0 === null) t0 = ts;
                        var k = Math.min((ts - t0) / dur, 1), eased = 1 - Math.pow(1 - k, 3);
                        el.textContent = Math.round(end * eased) + suf;
                        if (k < 1) requestAnimationFrame(step);
                    })(performance.now());
                });
            }, { threshold: 0.6 });
            counters.forEach(function (el) { cio.observe(el); });
        }

        /* ---------- Admission page: arrive from "Enroll Now" with the program pre-selected ---------- */
        var enrollCard = d.querySelector('.enrollment-card');
        var progSelect = d.getElementById('program');
        var wantProg = new URLSearchParams(location.search).get('enroll');
        if (enrollCard && progSelect && wantProg) {
            var opt = Array.prototype.slice.call(progSelect.options).filter(function (o) {
                return o.value.toLowerCase() === wantProg.toLowerCase();
            })[0];
            if (opt) { progSelect.value = opt.value; progSelect.dispatchEvent(new Event('change', { bubbles: true })); }
            enrollCard.classList.remove('rv');
            setTimeout(function () {
                enrollCard.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
                setTimeout(function () {
                    enrollCard.classList.add('is-focus');
                    if (opt) {
                        progSelect.classList.add('is-flash');
                        var grp = progSelect.closest('.form-group');
                        if (grp && !grp.querySelector('.enroll-note')) {
                            var note = d.createElement('small');
                            note.className = 'enroll-note';
                            note.textContent = '\u2713 Selected from the Programs page';
                            grp.appendChild(note);
                            progSelect.addEventListener('change', function () { note.remove(); progSelect.classList.remove('is-flash'); }, { once: true });
                        }
                    }
                    setTimeout(function () { enrollCard.classList.remove('is-focus'); progSelect.classList.remove('is-flash'); }, 3200);
                }, reduce ? 0 : 900);
            }, reduce ? 0 : 650);
        }
    });
})();