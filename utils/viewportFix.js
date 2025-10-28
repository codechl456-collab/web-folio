// 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
// Exports initViewportFix which sets --vh and wires resize/orientationchange/load

export function initViewportFix({ debounceMs = 120 } = {}) {
    function getViewportHeight() {
        // Prefer the Visual Viewport API when available — it reflects the
        // visible viewport on mobile browsers (accounts for address bar).
        if (window.visualViewport && typeof window.visualViewport.height === 'number') {
            return window.visualViewport.height;
        }
        return window.innerHeight;
    }

    function setViewportHeight() {
        const vh = getViewportHeight() * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // Debounce helper
    function debounce(fn, wait) {
        let t = null;
        return function(...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    // Run once now
    setViewportHeight();

    const onResize = debounce(() => {
        setViewportHeight();
        try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) { /* ignore */ }
    }, debounceMs);

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    // Use the Visual Viewport API events when available — on Android Chrome
    // the address bar hide/show frequently updates visualViewport.height but
    // doesn't always fire a window resize. Listening to visualViewport resize
    // and scroll allows us to update --vh and refresh ScrollTrigger when
    // address-bar UI changes occur.
    function onVisualViewportChange() {
        setViewportHeight();
        try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) { /* ignore */ }
    }

    if (window.visualViewport) {
        // Debounce visualViewport events as they can fire rapidly while
        // the address bar animates.
        const visualDebounced = debounce(onVisualViewportChange, debounceMs);
        window.visualViewport.addEventListener('resize', visualDebounced, { passive: true });
        window.visualViewport.addEventListener('scroll', visualDebounced, { passive: true });
    }

    // Also refresh on load and schedule a delayed refresh per requirements
    window.addEventListener('load', () => {
        setViewportHeight();
        try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) { /* ignore */ }
        setTimeout(() => { try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) {} }, 500);
    }, { once: true });

    // Some browsers animate the address bar and don't always emit resize
    // immediately; also run a few delayed updates after focus (e.g. when
    // navigating back to the tab) so pinned elements recalc correctly.
    function scheduleDelayedUpdates() {
        setTimeout(setViewportHeight, 80);
        setTimeout(() => { try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) {} }, 120);
        setTimeout(setViewportHeight, 260);
        setTimeout(() => { try { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); } catch (e) {} }, 520);
    }

    window.addEventListener('focus', scheduleDelayedUpdates);
    window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleDelayedUpdates(); });

    // expose programmatic setter
    return {
        setViewportHeight,
        destroy: () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
            window.removeEventListener('focus', scheduleDelayedUpdates);
            window.removeEventListener('visibilitychange', scheduleDelayedUpdates);
            if (window.visualViewport) {
                try {
                    window.visualViewport.removeEventListener('resize', onVisualViewportChange);
                    window.visualViewport.removeEventListener('scroll', onVisualViewportChange);
                } catch (e) { /* ignore */ }
            }
        }
    };
}
