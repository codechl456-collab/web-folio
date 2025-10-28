// Use CDN ESM builds so the browser can resolve imports in a static file setup
import gsap from 'https://cdn.skypack.dev/gsap';
import { ScrollTrigger } from 'https://cdn.skypack.dev/gsap/ScrollTrigger';
import { SplitText } from 'https://cdn.skypack.dev/gsap/SplitText';
import { Flip } from 'https://cdn.skypack.dev/gsap/Flip';
// Use esm.sh for Lenis to avoid Skypack build errors seen in some environments
import Lenis from 'https://esm.sh/lenis@1.3.13?target=es2020';

// 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
import { initViewportFix } from './utils/viewportFix.js';

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
    // initialize stable --vh and attach listeners BEFORE creating ScrollTriggers
    try { initViewportFix(); } catch (e) { console.warn('initViewportFix failed', e); }
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // We'll initialize SplitText-based title animations after fonts and images are ready.
    function initSplitAnimations(){
        // Main Text Animation titles
        const titleHeadings = gsap.utils.toArray('.title .text-heading');
        const splits = [];
        titleHeadings.forEach((heading) => {
            const split = SplitText.create(heading, { type: 'chars', charsClass: 'char' });
            splits.push(split);
            split.chars.forEach((char, i) => {
                const charInitialY = i % 2 === 0 ? -150 : 150;
                gsap.set(char, { y: charInitialY });
            });
        });
        const titles = gsap.utils.toArray('.title');
        titles.forEach((title, index) => {
            const titleContainer = title.querySelector('.title-container');
            const titleContainerInitialX = index === 1 ? -100 : 100;
            const split = splits[index];
            if (!split) return;
            const charcount = split.chars.length;

            ScrollTrigger.create({
                trigger: title,
                start: 'top bottom',
                end: 'top -25%',
                scrub: 1,
                onUpdate: (self) => {
                    const titleContainerX = titleContainerInitialX - self.progress * titleContainerInitialX;
                    gsap.set(titleContainer, { x: `${titleContainerX}%` });

                    split.chars.forEach((char, i) => {
                        let charStaggerIndex = i;
                        if (index === 1) charStaggerIndex = charcount - 1 - i;

                        const charStartDelay = 0.1;
                        const charTimelineSpan = 1 - charStartDelay;
                        const staggerFactor = Math.min(0.75, charTimelineSpan * 0.75);
                        const delay = charStartDelay + (charStaggerIndex / charcount) * staggerFactor;
                        const duration = charTimelineSpan - (staggerFactor * (charcount - 1)) / charcount;
                        const start = delay;
                        let charProgress = 0;
                        if (self.progress >= start) {
                            charProgress = Math.min(1, (self.progress - start) / duration);
                        }
                        const charInitialY = i % 2 === 0 ? -150 : 150;
                        const charY = charInitialY - charProgress * charInitialY;
                        gsap.set(char, { y: charY });
                    });
                },
            });
        });

        // Certificate title animations removed: headings are now static plain elements.
    }

    // removed duplicate/incorrect certificate IIFE; certificate splitting and clip-path logic
    // are initialized via initSplitAnimations() and the separate certificate clip-path
    // IIFE further below which remains intact.

    // Ensure ScrollTrigger recalculates after fonts/layout settle (fixes split-text timing)
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            ScrollTrigger.refresh();
        });
    } else {
        // fallback: refresh after next tick
        setTimeout(() => ScrollTrigger.refresh(), 50);
    }

    /* --- Begin inlined About JS (merged, no logic changed) --- */
    const lightColor = getComputedStyle(document.documentElement).getPropertyValue('--light')?.trim();
    const darkColor = getComputedStyle(document.documentElement).getPropertyValue('--dark')?.trim();

    function interpolateColor(color1, color2, factor) {
        return gsap.utils.interpolate(color1, color2, factor);
    }

    // Mobile-aware marquee image animation: use matchMedia to prevent
    // complex pinned clone behavior on small screens where Chrome address
    // bar changes break the fixed positioning calculations.
    const marqueeMatchMedia = gsap.matchMedia();
    let pinnedMarqueeImgClone = null;
    let isImgCloneActive = false;

    // Simple marquee movement animation (works on all screen sizes)
    gsap.to(".about-marquee-images", {
        scrollTrigger: {
            trigger: ".about-marquee",
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: (self) => {
                const progress = self.progress;
                const xPosition = -75 + progress * 25; // from -75% to 0%
                gsap.set(".about-marquee-images", { x: `${xPosition}%` });
            }
        }
    });

    // Desktop-only: Complex pinned image clone behavior (1024px and up)
    marqueeMatchMedia.add("(min-width: 1024px)", () => {
        function createPinnedMarqueeImgClone() {
            if (isImgCloneActive) return;
            const originalMarqueeImg = document.querySelector('.about-marquee-img.pin img');
            if (!originalMarqueeImg) return;
            
            // Use more robust positioning that accounts for viewport changes
            const rect = originalMarqueeImg.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            pinnedMarqueeImgClone = originalMarqueeImg.cloneNode(true);

            gsap.set(pinnedMarqueeImgClone, {
                position: 'fixed',
                left: centerX - originalMarqueeImg.offsetWidth / 2 + 'px',
                top: centerY - originalMarqueeImg.offsetHeight / 2 + 'px',
                width: originalMarqueeImg.offsetWidth + 'px',
                height: originalMarqueeImg.offsetHeight + 'px',
                zIndex: 100,
                transform: "rotate(-5deg)",
                transformOrigin: "center center",
                pointerEvents: "none",
                willChange: "transform, top, left",
            });
            document.body.appendChild(pinnedMarqueeImgClone);
            gsap.set(originalMarqueeImg, { opacity: 0 });
            isImgCloneActive = true;
        }

        function removePinnedMarqueeImgClone() {
            if (!isImgCloneActive) return;
            if (pinnedMarqueeImgClone) {
                pinnedMarqueeImgClone.remove();
                pinnedMarqueeImgClone = null;
            }
            const originalMarqueeImg = document.querySelector('.about-marquee-img.pin img');
            if (originalMarqueeImg) gsap.set(originalMarqueeImg, { opacity: 1 });
            isImgCloneActive = false;
        }

        // Desktop: Create pinned clone ScrollTrigger
        ScrollTrigger.create({
            trigger: ".about-marquee",
            start: "top top",
            onEnter: createPinnedMarqueeImgClone,
            onEnterBack: createPinnedMarqueeImgClone,
            onLeaveBack: removePinnedMarqueeImgClone,
        });

        return {
            // Cleanup function for this media query context
            destroy() {
                removePinnedMarqueeImgClone();
            }
        };
    });

    // Mobile/Tablet (under 1024px): Simple behavior - keep original image visible
    marqueeMatchMedia.add("(max-width: 1023px)", () => {
        // Ensure original pinned image stays visible and no clone is created
        const originalMarqueeImg = document.querySelector('.about-marquee-img.pin img');
        if (originalMarqueeImg) {
            gsap.set(originalMarqueeImg, { opacity: 1 });
        }
        
        // Clean up any existing clone if user resizes from desktop to mobile
        if (pinnedMarqueeImgClone) {
            pinnedMarqueeImgClone.remove();
            pinnedMarqueeImgClone = null;
        }
        isImgCloneActive = false;

        // Add a mobile-friendly content section to fill the gap where pinned clone would be
        const aboutSection = document.querySelector('.about-section');
        let mobileContent = document.getElementById('mobile-marquee-content');
        
        if (aboutSection && !mobileContent) {
            mobileContent = document.createElement('div');
            mobileContent.id = 'mobile-marquee-content';
            mobileContent.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; margin: 2rem 0;">
                    <h3 style="color: #000000ff; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Welcome to My Portfolio</h3>
                    <p style="color: #000000ff; font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; max-width: 600px; margin-left: auto; margin-right: auto;">
                        Explore my journey through innovative projects, creative solutions, and professional growth. Each section below showcases different aspects of my expertise and passion for development.
                    </p>
                    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-top: 2rem;">
                        <span style="padding: 0.5rem 1rem; border:1px solid white; background: rgba(0, 0, 0, 1); border-radius: 2px; color: #fff; font-size: 0.9rem;">Projects</span>
                        <span style="padding: 0.5rem 1rem; border:1px solid white; background: rgba(0, 0, 0, 1); border-radius: 2px; color: #fff; font-size: 0.9rem;">Skills</span>
                        <span style="padding: 0.5rem 1rem; border:1px solid white; background: rgba(0, 0, 0, 1); border-radius: 2px; color: #fff; font-size: 0.9rem;">Experience</span>
                    </div>
                     <div class="mobile-cta-section">
                        <div class="cta-text">Ready to know more about me?</div>
                        <div class="cta-arrow">↓</div>
                    </div>
                </div>
                
            `;
            mobileContent.style.cssText = `
                background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
                border-radius: 12px;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.1);
                margin: 2rem 0;
                position: relative;
                overflow: hidden;
            `;
            
            // Add custom styles for mobile content
            if (!document.getElementById('mobile-content-style')) {
                const style = document.createElement('style');
                style.id = 'mobile-content-style';
                style.textContent = `
                    .mobile-cta-section {
                        text-align: center;
                        padding: 2rem;
                        margin-top: 2rem;
                        background: rgba(255,255,255,0.02);
                        border-radius: 12px;
                        border: 1px solid rgba(255,255,255,0.05);
                    }
                    
                    .cta-text {
                        font-size: 1.3rem;
                        color: #777777ff;
                        margin-bottom: 1rem;
                        font-weight: 500;
                    }
                    
                    .cta-arrow {
                        font-size: 2rem;
                        color: #9c9b9bff;
                        animation: bounce 2s infinite;
                    }
                    
                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                        40% { transform: translateY(-10px); }
                        60% { transform: translateY(-5px); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Add a subtle animated background effect
            const backgroundEffect = document.createElement('div');
            backgroundEffect.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%);
                animation: shimmer 3s ease-in-out infinite;
                pointer-events: none;
            `;
            mobileContent.appendChild(backgroundEffect);
            
            // Add the shimmer animation
            if (!document.getElementById('mobile-shimmer-style')) {
                const style = document.createElement('style');
                style.id = 'mobile-shimmer-style';
                style.textContent = `
                    @keyframes shimmer {
                        0%, 100% { transform: translateX(-100%); }
                        50% { transform: translateX(100%); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Insert after the about-marquee section
            const marqueeSection = aboutSection.querySelector('.about-marquee');
            if (marqueeSection && marqueeSection.nextSibling) {
                aboutSection.insertBefore(mobileContent, marqueeSection.nextSibling);
            } else {
                aboutSection.appendChild(mobileContent);
            }
        }

        return {
            destroy() {
                // Remove mobile content when switching back to desktop
                const mobileContent = document.getElementById('mobile-marquee-content');
                if (mobileContent) {
                    mobileContent.remove();
                }
                // Remove the shimmer style as well
                const shimmerStyle = document.getElementById('mobile-shimmer-style');
                if (shimmerStyle) {
                    shimmerStyle.remove();
                }
            }
        };
    });

    // 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
    ScrollTrigger.create({
        trigger: ".about-horizontal-scroll",
        start: "top top",
        end: () => `+=${window.innerHeight * 5}`,
        scrub: 0,
        pin: true,
        invalidateOnRefresh: true,
        // Ensure pinned element receives GPU-acceleration and will-change while active
        onToggle: (self) => {
            const el = document.querySelector('.about-horizontal-scroll');
            if (el && self.isActive) {
                try { gsap.set(el, { force3D: true }); } catch (e) {}
                el.style.willChange = 'transform, top, left';
            } else if (el) {
                el.style.willChange = '';
            }
        }
    });

    // ScrollTrigger for marquee pinned clone moved inside desktop matchMedia above

    // Desktop-only Flip animation for pinned marquee clone
    let flipAnimation = null;
    marqueeMatchMedia.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
            trigger: ".about-horizontal-scroll",
            start: "top 50%",
            // 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
            end: () => `+=${window.innerHeight}`,
            invalidateOnRefresh: true,
            onEnter: () => {
                if (pinnedMarqueeImgClone && isImgCloneActive && !flipAnimation) {
                    const state = Flip.getState(pinnedMarqueeImgClone);
                    gsap.set(pinnedMarqueeImgClone, {
                        position: 'fixed',
                        left: '0px',
                        top: '0px',
                        width: "100%",
                        height: "calc(var(--vh) * 100)", // 🧩 Mobile Chrome viewport fix applied
                        transform: "rotate(0deg)",
                        transformOrigin: "center center",
                    });
                    flipAnimation = Flip.from(state, {
                        duration: 1,
                        ease: "none",
                        paused: true,
                    });
                }
            },
            onLeaveBack: () => {
                if (flipAnimation) {
                    flipAnimation.kill();
                    flipAnimation = null;
                }
                gsap.set(".about-section", { backgroundColor: lightColor });
                gsap.set(".about-horizontal-scroll-wrapper", { x: "0%" });
            },
        });

        ScrollTrigger.create({
            trigger: ".about-horizontal-scroll",
            start: "top 50%",
            // 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
            end: () => `+=${window.innerHeight * 5.5}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const progress = self.progress;
                if (progress <= 0.05) {
                    const bgColorProgress = Math.min(progress / 0.05, 1);
                    const newBgColor = interpolateColor(lightColor, darkColor, bgColorProgress);
                    gsap.set(".about-section", { backgroundColor: newBgColor });
                } else if (progress >= 0.95) {
                    gsap.set(".about-section", { backgroundColor: darkColor });
                }
                if (progress <= 0.2) {
                    const scaleProgress = progress / 0.2;
                    if (flipAnimation) flipAnimation.progress(scaleProgress);
                }
                if (progress > 0.2 && progress <= 0.95) {
                    if (flipAnimation) flipAnimation.progress(1);
                    const horizontalProgress = (progress - 0.2) / 0.75;
                    const wrapperTranslateX = -66.7 * horizontalProgress;
                    gsap.set(".about-horizontal-scroll-wrapper", { x: `${wrapperTranslateX}%` });
                    const slideMovement = (66.67 / 100) * 3 * horizontalProgress;
                    const imageTranslateX = -slideMovement * 100;
                    // Only animate clone if it exists (desktop only)
                    if (pinnedMarqueeImgClone) {
                        gsap.set(pinnedMarqueeImgClone, { x: `${imageTranslateX}%` });
                    }
                }
            },
        });
        
        return {
            destroy() {
                if (flipAnimation) {
                    flipAnimation.kill();
                    flipAnimation = null;
                }
            }
        };
    });

    // Mobile: Simplified horizontal scroll without complex image clone animations
    marqueeMatchMedia.add("(max-width: 1023px)", () => {
        ScrollTrigger.create({
            trigger: ".about-horizontal-scroll",
            start: "top 50%",
            // 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
            end: () => `+=${window.innerHeight * 5.5}`,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                const progress = self.progress;
                if (progress <= 0.05) {
                    const bgColorProgress = Math.min(progress / 0.05, 1);
                    const newBgColor = interpolateColor(lightColor, darkColor, bgColorProgress);
                    gsap.set(".about-section", { backgroundColor: newBgColor });
                } else if (progress >= 0.95) {
                    gsap.set(".about-section", { backgroundColor: darkColor });
                }
                if (progress > 0.2 && progress <= 0.95) {
                    const horizontalProgress = (progress - 0.2) / 0.75;
                    const wrapperTranslateX = -66.7 * horizontalProgress;
                    gsap.set(".about-horizontal-scroll-wrapper", { x: `${wrapperTranslateX}%` });
                    // On mobile, no complex clone animation - just horizontal scroll
                }
            },
        });
        
        return {
            destroy() {
                // Reset section background when leaving mobile mode
                gsap.set(".about-section", { backgroundColor: lightColor });
                gsap.set(".about-horizontal-scroll-wrapper", { x: "0%" });
            }
        };
    });
    /* --- End inlined About JS --- */

    /* --- Certificate showcase: work-item clip-path animations + responsive fallbacks --- */
    (function(){
        // responsive fallback paths (small screens) - assets live in the certificate showcase folder
        // Use local assets folder paths (relative to this HTML file)
        const fallbackPaths = [
            './assets/certificate1(p).webp',
            './assets/certificate2(p).webp',
            './assets/certificate3(p).webp',
            './assets/certificate4(p).webp',
            './assets/certificate5(p).webp',
        ];
        const selector = '.work-item-img img';

        function updateImages(useFallback){
            const imgs = Array.from(document.querySelectorAll(selector));
            imgs.forEach((img, idx) => {
                if (useFallback) {
                    if (!img.dataset.origSrc) img.dataset.origSrc = img.src;
                    const fallback = fallbackPaths[idx] || fallbackPaths[0];
                    img.src = fallback;
                } else {
                    if (img.dataset.origSrc) {
                        img.src = img.dataset.origSrc;
                        delete img.dataset.origSrc;
                    }
                }
            });
        }

        const mql = window.matchMedia('(max-width: 767px)');
        updateImages(mql.matches);
        if (typeof mql.addEventListener === 'function') {
            mql.addEventListener('change', (e) => updateImages(e.matches));
        } else if (typeof mql.addListener === 'function') {
            mql.addListener((e) => updateImages(e.matches));
        }

        // clip-path scroll animations for each work-item (same logic as certificate script)
        gsap.utils.toArray('.work-item').forEach((item) => { 
            const imgWrapper = item.querySelector('.work-item-img');

            ScrollTrigger.create({
                trigger: item,
                start: 'top bottom',
                end: 'top top',
                scrub:0.5,
                invalidateOnRefresh: true,
                refreshPriority: 0,
                animation:gsap.fromTo(
                    imgWrapper,
                    {
                        clipPath : "polygon(25% 25%,75% 40%,100% 100%,0% 100%)",
                    },
                    {
                        clipPath : "polygon(0% 0%,100% 0%,100% 100%,0% 100%)",
                        ease:"none",
                    }
                ),
            });

            ScrollTrigger.create({
                trigger: item,
                start: 'bottom bottom',
                end: 'bottom top',
                scrub:0.5,
                invalidateOnRefresh: true,
                refreshPriority: 0,
                animation:gsap.fromTo(
                    imgWrapper,
                    {
                        clipPath : "polygon(0% 0%,100% 0%,100% 100%,0% 100%)",
                    },
                    {
                        clipPath : "polygon(0% 0%,100% 0%,75% 60%,25% 75%)",
                        ease:"none",
                    }
                ),
            });

        });
    })();

    // Ensure ScrollTrigger.refresh() runs on common viewport events (debounced)
    (function addGlobalSTRefresh() {
        function debounce(fn, wait) {
            let t = null;
            return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
        }

        const refresh = debounce(() => {
            try { if (window.ScrollTrigger) ScrollTrigger.refresh(); } catch (e) { /* ignore */ }
        }, 120);

        window.addEventListener('resize', refresh, { passive: true });
        window.addEventListener('orientationchange', refresh, { passive: true });
        window.addEventListener('load', () => { refresh(); setTimeout(refresh, 500); }, { once: true });
    })();

    // Wait for fonts and images, then initialize SplitText animations for titles
    function waitForFontsAndImages(){
        const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        const imgs = Array.from(document.images || []);
        const imagePromises = imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((res) => {
                img.addEventListener('load', res, { once: true });
                img.addEventListener('error', res, { once: true });
            });
        });
        return Promise.all([fontsReady, Promise.all(imagePromises)]);
    }

    waitForFontsAndImages().then(() => {
        try {
            initSplitAnimations();
            ScrollTrigger.refresh();
        } catch (e) {
            console.error('initSplitAnimations error:', e);
        }
    });

    /* ===== PROJECTS SECTION LOGIC (updated from folio-master) ===== */
    // Projects functionality based on working implementation from folio-master
    (function initProjectsSection() {
        'use strict';

        // Constants (match React component behavior)
        const NO_MOTION_PREFERENCE_QUERY = '(prefers-reduced-motion: no-preference)';
        
        // Project gradients from constants.ts
        const PROJECT_GRADIENTS = [
            ['#262626', '#333333'], // FigGen
            ['#f5f5f5', '#eaeaea'], // myOKR
            ['#00c853', '#004741'], // DLT Labs
            ['#003052', '#167187'], // DL Unify
            ['#3A0000', '#771E1E'], // ngx-quill-upload
            ['#17007B', '#3A2C79']  // Huminos
        ];

        // State for projects section
        let projectsWillChange = false;
        let projectsHorizontalAnimationEnabled = false;
        let projectsTimeline = null;
        let projectsScrollTrigger = null;
        let projectsRevealTimeline = null;
        let projectsRevealScrollTrigger = null;

        // DOM elements
        const targetSectionRef = document.querySelector('.section-container.projects-section');
        const sectionTitleElementRef = targetSectionRef?.querySelector('.inner-container.title-block');
        const projectWrapper = targetSectionRef?.querySelector('.project-wrapper');

        if (!targetSectionRef) {
            console.warn('Projects script: .section-container.projects-section not found');
            return;
        }

        // Set will-change class for projects (exact match from folio-master)
        function setProjectsWillChange(active) {
            projectsWillChange = active;
            if (sectionTitleElementRef) {
                sectionTitleElementRef.classList.toggle('will-change-transform', active);
            }
            if (targetSectionRef) {
                targetSectionRef.classList.toggle('will-change-transform', active);
            }
        }

        // Initialize reveal animation for projects (exact match from folio-master)
        function initProjectsRevealAnimation() {
            if (projectsRevealScrollTrigger) {
                projectsRevealScrollTrigger.kill();
            }
            if (projectsRevealTimeline) {
                projectsRevealTimeline.progress(1);
            }

            projectsRevealTimeline = gsap.timeline({ defaults: { ease: 'none' } });
            const seqElements = targetSectionRef.querySelectorAll('.seq');
            
            projectsRevealTimeline.from(seqElements, {
                opacity: 0,
                duration: 0.5,
                stagger: 0.5
            });

            projectsRevealScrollTrigger = ScrollTrigger.create({
                trigger: targetSectionRef,
                start: 'top bottom',
                end: 'bottom bottom',
                scrub: 0,
                animation: projectsRevealTimeline
            });

            return [projectsRevealTimeline, projectsRevealScrollTrigger];
        }

        // Initialize projects horizontal animation (exact match from folio-master)
        function initProjectsAnimation() {
            if (projectsScrollTrigger) {
                projectsScrollTrigger.kill();
            }
            if (projectsTimeline) {
                projectsTimeline.kill();
            }

            const innerContainer = targetSectionRef.querySelector('.inner-container');
            if (!innerContainer || !projectWrapper) {
                console.warn('Required elements not found for projects animation');
                return;
            }

            // Precise calculation to align last project with right edge
            const timeline = gsap.timeline({ defaults: { ease: 'none' } });
            const sidePadding = document.body.clientWidth - innerContainer.clientWidth;
            
            // Get measurements
            const projectsWidth = projectWrapper.scrollWidth;
            const viewportWidth = window.innerWidth;
            const containerPadding = sidePadding / 2; // Padding on each side
            
            // Calculate exact move distance so last project right edge aligns with viewport right edge
            // Total content width that needs to scroll past the left edge
            const totalScrollDistance = projectsWidth - viewportWidth + containerPadding;
            
            const elementWidth = sidePadding + projectsWidth;
            targetSectionRef.style.width = `${elementWidth}px`;
            
            // Negative movement (scroll left)
            const width = -Math.max(0, totalScrollDistance);
            const duration = `${Math.max(totalScrollDistance / viewportWidth * 100, 100)}%`;
            
            timeline
                .to(targetSectionRef, { x: width })
                .to(sectionTitleElementRef, { x: -width }, '<');

            // Create ScrollTrigger with exact settings from folio-master
            // 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
            projectsScrollTrigger = ScrollTrigger.create({
                trigger: targetSectionRef,
                start: 'top top',
                end: duration,
                scrub: 0,
                pin: true,
                animation: timeline,
                pinSpacing: 'margin',
                invalidateOnRefresh: true,
                onToggle: (self) => {
                    setProjectsWillChange(self.isActive);
                    try {
                        if (targetSectionRef && self.isActive) {
                            gsap.set(targetSectionRef, { force3D: true });
                            targetSectionRef.style.willChange = 'transform, top, left';
                        } else if (targetSectionRef) {
                            targetSectionRef.style.willChange = '';
                        }
                    } catch (e) {}
                }
            });

            // Force a synchronous refresh so following ScrollTriggers recalculate
            // (helps downstream sections like the certificate showcase detect correct positions)
            ScrollTrigger.refresh();

            projectsTimeline = timeline;
            return [timeline, projectsScrollTrigger];
        }

        // Apply non-desktop fallback (exact match from folio-master)
        function applyProjectsNonDesktopFallback() {
            const parentPadding = window.getComputedStyle(targetSectionRef).paddingLeft;
            
            targetSectionRef.style.setProperty('width', '100%');
            
            if (projectWrapper) {
                projectWrapper.classList.add('overflow-x-auto');
                projectWrapper.style.setProperty('width', 'calc(100vw)');
                projectWrapper.style.setProperty('padding', `0 ${parentPadding}`);
                projectWrapper.style.setProperty('transform', `translateX(-${parentPadding})`);
            }
        }

        // Initialize VanillaTilt for project tiles
        function initProjectsVanillaTilt() {
            if (!window.VanillaTilt) return;
            
            const projectTiles = document.querySelectorAll('.project-tile');
            projectTiles.forEach(tile => {
                VanillaTilt.init(tile, {
                    max: 5,
                    speed: 400,
                    glare: true,
                    'max-glare': 0.2,
                    gyroscope: false
                });
            });
        }

        // Set project gradients
        function setProjectGradients() {
            const projectTiles = document.querySelectorAll('.project-tile');
            projectTiles.forEach((tile, index) => {
                if (PROJECT_GRADIENTS[index]) {
                    const [stop1, stop2] = PROJECT_GRADIENTS[index];
                    tile.style.background = `linear-gradient(90deg, ${stop1} 0%, ${stop2} 100%)`;
                    
                    // Set gradient overlays
                    const gradientTop = tile.querySelector('.gradient-top');
                    const gradientBottom = tile.querySelector('.gradient-bottom');
                    
                    if (gradientTop) {
                        gradientTop.style.background = `linear-gradient(180deg, ${stop1} 0%, rgba(0,0,0,0) 100%)`;
                    }
                    if (gradientBottom) {
                        gradientBottom.style.background = `linear-gradient(0deg, ${stop1} 10%, rgba(0,0,0,0) 100%)`;
                    }
                }
            });
        }

        // Fallback mode when libraries are not available
        function initProjectsFallbackMode() {
            // Make seq elements visible
            const seqElements = document.querySelectorAll('.seq');
            seqElements.forEach(el => {
                el.style.opacity = '1';
            });
            
            // Apply gradients and tilt
            setProjectGradients();
            initProjectsVanillaTilt();
            
            // Use overflow fallback
            applyProjectsNonDesktopFallback();
        }

        // Main initialization function (exact match from folio-master)
        function initProjectsSection() {
            // Kill existing animations
            if (projectsScrollTrigger) projectsScrollTrigger.kill();
            if (projectsTimeline) projectsTimeline.kill();
            if (projectsRevealScrollTrigger) projectsRevealScrollTrigger.kill();
            if (projectsRevealTimeline) projectsRevealTimeline.progress(1);

            // Reset styles
            if (projectWrapper) {
                projectWrapper.style.removeProperty('width');
                projectWrapper.style.removeProperty('padding');
                projectWrapper.style.removeProperty('transform');
                projectWrapper.classList.remove('overflow-x-auto');
            }
            targetSectionRef.style.removeProperty('width');
            targetSectionRef.classList.remove('will-change-transform');
            setProjectsWillChange(false);

            // Check preferences and device type (exact match from folio-master)
            const { matches } = window.matchMedia(NO_MOTION_PREFERENCE_QUERY);
            const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
            
            projectsHorizontalAnimationEnabled = isDesktop && matches;

            if (isDesktop && matches) {
                // Desktop with motion allowed - use horizontal animation
                initProjectsAnimation();
            } else {
                // Mobile or reduced motion - use fallback
                applyProjectsNonDesktopFallback();
            }

            // Always run reveal animation
            initProjectsRevealAnimation();
            
            // Set gradients and initialize tilt
            setProjectGradients();
            initProjectsVanillaTilt();

            // Refresh ScrollTrigger
            if (window.ScrollTrigger) {
                ScrollTrigger.refresh();
            }
        }

        // Debounced resize handler
        function projectsDebounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        const handleProjectsResize = projectsDebounce(() => {
            // Reset any accumulated styles
            if (projectWrapper) {
                projectWrapper.style.removeProperty('width');
                projectWrapper.style.removeProperty('padding');
                projectWrapper.style.removeProperty('transform');
                projectWrapper.classList.remove('overflow-x-auto');
            }
            targetSectionRef.style.removeProperty('width');
            targetSectionRef.classList.remove('will-change-transform');
            setProjectsWillChange(false);
            
            initProjectsSection();
        }, 160);

        // Event listeners
        window.addEventListener('resize', handleProjectsResize);
        window.addEventListener('orientationchange', handleProjectsResize);

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (projectsScrollTrigger) projectsScrollTrigger.kill();
            if (projectsTimeline) projectsTimeline.kill();
            if (projectsRevealScrollTrigger) projectsRevealScrollTrigger.kill();
            if (projectsRevealTimeline) projectsRevealTimeline.progress(1);
        });

        // Initialize projects when ready (exact timing from folio-master)
        setTimeout(() => {
            initProjectsSection();
        }, 100); // Small delay to ensure other components are initialized first
    })();

    /* ===== CONTACT SECTION ANIMATIONS ===== */
    function initContactAnimations() {
        const contactSection = document.querySelector('.contact-section');
        if (!contactSection) return;

        // Contact title animation
        const contactTitle = contactSection.querySelector('.contact-main-title');
        const contactSubtitle = contactSection.querySelector('.contact-subtitle');
        
        if (contactTitle) {
            // Split text for contact title
            const titleSplit = SplitText.create(contactTitle, { type: 'chars', charsClass: 'char' });
            
            // Set initial state
            titleSplit.chars.forEach((char, i) => {
                const charInitialY = i % 2 === 0 ? -100 : 100;
                gsap.set(char, { y: charInitialY, opacity: 0 });
            });

            // Animate title characters
            ScrollTrigger.create({
                trigger: contactTitle,
                start: 'top 80%',
                end: 'top 20%',
                scrub: 1,
                onUpdate: (self) => {
                    titleSplit.chars.forEach((char, i) => {
                        const charProgress = Math.min(1, Math.max(0, (self.progress - i * 0.02) * 2));
                        const charInitialY = i % 2 === 0 ? -100 : 100;
                        const charY = charInitialY - (charProgress * charInitialY);
                        gsap.set(char, { 
                            y: charY, 
                            opacity: charProgress
                        });
                    });
                },
            });
        }

        // Animate subtitle
        if (contactSubtitle) {
            gsap.fromTo(contactSubtitle, 
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: contactSubtitle,
                        start: 'top 80%',
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        // Animate contact cards
        const contactCards = contactSection.querySelectorAll('.contact-card');
        contactCards.forEach((card, index) => {
            gsap.fromTo(card,
                { opacity: 0, y: 50, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    delay: index * 0.15,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Animate form wrapper and its children using one timeline/ScrollTrigger
        const formWrapper = contactSection.querySelector('.contact-form-wrapper');
        if (formWrapper) {
            const formChildren = formWrapper.querySelectorAll('.form-group, .contact-submit-btn');

            const tlForm = gsap.timeline({
                scrollTrigger: {
                    trigger: formWrapper,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                    invalidateOnRefresh: true
                }
            });

            // Reveal wrapper and then animate children with a small overlap
            tlForm.fromTo(formWrapper,
                { opacity: 0, y: 50, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
            );

            tlForm.fromTo(formChildren,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' },
                '-=0.4'
            );
        }

        // Animate social section
        const socialSection = contactSection.querySelector('.contact-social');
        if (socialSection) {
            gsap.fromTo(socialSection,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: socialSection,
                        start: 'top 95%',
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        // Animate social links individually
        const socialLinks = contactSection.querySelectorAll('.social-link');
        socialLinks.forEach((link, index) => {
            gsap.fromTo(link,
                { opacity: 0, y: 20, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: socialSection,
                        start: 'top 97%',
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // Form submission animation
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Animate button
                gsap.to(submitBtn, {
                    scale: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.out"
                });

                // Simple success feedback
                setTimeout(() => {
                    submitBtn.innerHTML = '<span>Message Sent! ✓</span>';
                    gsap.to(submitBtn, {
                        backgroundColor: '#777777',
                        duration: 0.3
                    });
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        submitBtn.innerHTML = `
                            <span>Send Message</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                            </svg>
                        `;
                        gsap.to(submitBtn, {
                            background: 'linear-gradient(135deg, #444, #111)',
                            duration: 0.3
                        });
                        contactForm.reset();
                    }, 3000);
                }, 200);
            });
        }
    }

    // Apply the same character-split ScrollTrigger reveal used for the
    // contact title to all simple section headings wrapped with
    // `.portfolio-heading`. We skip elements that already use
    // `.contact-main-title` to avoid double-initialization.
    function initPortfolioHeadingAnimations() {
        const containers = gsap.utils.toArray('.portfolio-heading');
        if (!containers || containers.length === 0) return;

        containers.forEach((container) => {
            // Find a sensible heading inside the container
            const heading = container.querySelector('h1, h2, h3, [role="heading"]') || container;
            if (!heading) return;

            // Skip if this is the contact title (it's handled separately)
            if (heading.classList && heading.classList.contains('contact-main-title')) return;

            // Prevent double-init
            if (heading.dataset.portfolioAnimated) return;
            heading.dataset.portfolioAnimated = 'true';

            try {
                const titleSplit = SplitText.create(heading, { type: 'chars', charsClass: 'char' });

                // initial state for characters
                titleSplit.chars.forEach((char, i) => {
                    const charInitialY = i % 2 === 0 ? -100 : 100;
                    gsap.set(char, { y: charInitialY, opacity: 0 });
                });

                // Create a ScrollTrigger that reveals characters as the
                // heading scrolls into view. Settings mirror the contact title
                // animation for a consistent feel across heading types.
                ScrollTrigger.create({
                    trigger: heading,
                    start: 'top 85%',
                    end: 'top 20%',
                    scrub: 1,
                    onUpdate: function(self) {
                        titleSplit.chars.forEach((char, i) => {
                            const charProgress = Math.min(1, Math.max(0, (self.progress - i * 0.02) * 2));
                            const charInitialY = i % 2 === 0 ? -100 : 100;
                            const charY = charInitialY - (charProgress * charInitialY);
                            gsap.set(char, { y: charY, opacity: charProgress });
                        });
                    },
                });
            } catch (e) {
                // Fallback: simple slide/fade if SplitText fails
                gsap.fromTo(heading, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none reverse' } });
            }
        });

        // Ensure triggers recalculate after creation
        ScrollTrigger.refresh();
    }

    // Reveal animation for the About headings (word-by-word). Targets any
    // `.heading--large` inside the about section (e.g. about-hero and
    // about-outro) and applies a SplitText word reveal with ScrollTrigger.
    function initAboutReveal() {
        try {
            const headings = document.querySelectorAll('.about-section .heading--large');
            if (!headings || headings.length === 0) {
                console.warn('initAboutReveal: no headings found');
                return;
            }

            headings.forEach((heading) => {
                try {
                    const split = SplitText.create(heading, { type: 'words', wordsClass: 'word' });

                    // Prepare initial state for words
                    (split.words || []).forEach((w) => gsap.set(w, { y: 22, opacity: 0 }));

                    // Timeline that animates words into place with a slight stagger
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: heading,
                            start: 'top 92%',
                            end: 'top 50%',
                            toggleActions: 'play none none reverse',
                            invalidateOnRefresh: true
                        }
                    });

                    tl.to(split.words, {
                        y: 0,
                        opacity: 1,
                        duration: 0.9,
                        ease: 'power3.out',
                        stagger: 0.08
                    });
                } catch (e) {
                    // If SplitText isn't available or fails for this heading, fall back
                    // to a simple fade/slide with a ScrollTrigger.
                    gsap.fromTo(heading, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: heading, start: 'top 85%', toggleActions: 'play none none reverse' } });
                }
            });

            // Ensure ScrollTrigger recalculates after we've created triggers
            ScrollTrigger.refresh();
        } catch (err) {
            console.warn('initAboutReveal error:', err);
        }
    }

    // Initialize skills section animations: left-scroll, reveal, right-scroll
    function initSkillsSection() {
        try {
            const skillsSection = document.getElementById('skills');
            if (!skillsSection) return;
            const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

            // Center reveal (simple reveal of grid items)
            const revealItems = gsap.utils.toArray('.skills-reveal .skill-item');
            if (revealItems.length) {
                gsap.fromTo(revealItems, { y: 30, opacity: 0 }, {
                    y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out',
                    scrollTrigger: { trigger: '.skills-reveal', start: 'top 85%', toggleActions: 'play none none reverse' }
                });
            }

            // Horizontal scroll rows (desktop only): create a single pinned timeline
            // that moves the left track left and the right track right simultaneously.
            const leftRow = skillsSection.querySelector('.skills-left');
            const rightRow = skillsSection.querySelector('.skills-right');
            const leftTrack = leftRow ? leftRow.querySelector('.skills-track') : null;
            const rightTrack = rightRow ? rightRow.querySelector('.skills-track') : null;

            if (isDesktop && leftRow && rightRow && leftTrack && rightTrack) {
                // Reset transforms
                leftTrack.style.transform = '';
                rightTrack.style.transform = '';

                const leftVisible = leftRow.clientWidth;
                const leftWidth = leftTrack.scrollWidth;
                const leftOverflow = Math.max(0, leftWidth - leftVisible + 20);

                const rightVisible = rightRow.clientWidth;
                const rightWidth = rightTrack.scrollWidth;
                const rightOverflow = Math.max(0, rightWidth - rightVisible + 20);

                // If neither overflows, skip animation
                if (leftOverflow <= 2 && rightOverflow <= 2) {
                    // nothing to animate
                } else {
                    const totalDistance = Math.max(leftVisible + leftOverflow, rightVisible + rightOverflow);

                    // Cap the pinned scroll distance so the pinned animation only
                    // lasts a short time instead of running until the tracks fully
                    // traverse. Adjust `skillPinViewportFactor` to make the pin
                    // shorter or longer (1.0 = one viewport height).
                    // Reduce the factor to make the pin noticeably shorter.
                    // 0.4 = about 40% of viewport height; adjust if you want even shorter.
                    const skillPinViewportFactor = 0.6;
                    const maxPin = Math.max( Math.round(window.innerHeight * skillPinViewportFactor), 120 );
                    const endDistance = Math.min(totalDistance, maxPin);

                    // movementScale controls how much of the full overflow is moved
                    // during the pinned scroll. A smaller value makes the movement
                    // much slower/subtler. Increase toward 1 to use full overflow.
                    // Make movement much slower: reduce to ~30% of overflow
                    // and use stronger scrub smoothing.
                    const movementScale = 0.30; // ~30% of full overflow (very slow)

                    const tl = gsap.timeline();

                    // For the left track allow starting at a marked card (start-here-left)
                    // and animate only a fraction of the overflow to keep motion slow.
                    if (leftOverflow > 2) {
                        const startCardLeft = leftTrack.querySelector('.skill-card.start-here-left');
                        let initialOffsetLeft = 0;
                        if (startCardLeft) {
                            const cardLeft = startCardLeft.offsetLeft;
                            const cardWidth = startCardLeft.offsetWidth;
                            const centerTargetLeft = Math.max(0, (leftVisible / 2) - (cardWidth / 2));
                            initialOffsetLeft = Math.max(0, cardLeft - centerTargetLeft);
                        }

                        const scaledLeftTarget = -initialOffsetLeft - (leftOverflow * movementScale);

                        if (initialOffsetLeft > 0) {
                            tl.fromTo(leftTrack, { x: -initialOffsetLeft }, { x: scaledLeftTarget, ease: 'none' }, 0);
                        } else {
                            // fallback if no start card found
                            tl.to(leftTrack, { x: () => -leftOverflow * movementScale, ease: 'none' }, 0);
                        }
                    }

                    // For the right track, compute initial offset so the start-here
                    // card is visible, then animate only a fraction (movementScale)
                    // of the total rightOverflow to make the movement slow.
                    if (rightOverflow > 2) {
                        const startCard = rightTrack.querySelector('.skill-card.start-here');
                        let initialOffset = 0;
                        if (startCard) {
                            const cardLeft = startCard.offsetLeft;
                            const cardWidth = startCard.offsetWidth;
                            const centerTarget = Math.max(0, (rightVisible / 2) - (cardWidth / 2));
                            initialOffset = Math.max(0, cardLeft - centerTarget);
                        }

                        const scaledTarget = (rightOverflow * movementScale) - initialOffset;

                        tl.fromTo(rightTrack,
                            { x: -initialOffset },
                            { x: scaledTarget, ease: 'none' },
                            0
                        );
                    }

                    ScrollTrigger.create({
                        trigger: skillsSection,
                        start: 'top top',
                        end: () => `+=${endDistance}`,
                        // numeric scrub adds smoothing/inertia and makes the
                        // movement feel slower/softer compared to scrub: true
                        // increase scrub to make the motion even more gradual
                        scrub: 2.4,
                        pin: true,
                        animation: tl,
                        invalidateOnRefresh: true,
                        // 🧩 Mobile Chrome viewport fix applied for pinned skillsSection
                        onToggle: (self) => {
                            try {
                                if (skillsSection && self.isActive) {
                                    gsap.set(skillsSection, { force3D: true });
                                    skillsSection.style.willChange = 'transform, top, left';
                                } else if (skillsSection) {
                                    skillsSection.style.willChange = '';
                                }
                            } catch (e) {}
                        }
                    });
                }
            }

            // If we're not on desktop (no pinned GSAP animation), ensure
            // the tracks still start with the marked cards visible and
            // enable a lightweight infinite auto-scroll loop for mobile/tablet.
            if (!isDesktop) {
                try {
                    // Helper to stop any existing mobile loop on a track
                    function stopMobileLoop(track) {
                        if (!track) return;
                        const state = track.__mobileLoopState;
                        if (state) {
                            if (state.rafId) cancelAnimationFrame(state.rafId);
                            if (state.pauseTimeout) clearTimeout(state.pauseTimeout);
                            // remove clones we appended (only elements with our clone marker)
                            try {
                                const clones = Array.from(track.querySelectorAll('[data-mobile-clone]'));
                                clones.forEach((cl) => { try { cl.remove(); } catch (e) {} });
                            } catch (e) { /* ignore */ }
                            // restore inline styles set by the loop
                            track.style.transform = '';
                            track.style.width = state.prevWidth || '';
                            track.style.minWidth = state.prevMinWidth || '';
                            track.style.display = state.prevDisplay || '';
                            track.style.flexWrap = state.prevFlexWrap || '';
                            track.style.whiteSpace = state.prevWhiteSpace || '';
                            // remove event listeners added by the loop
                            try {
                                if (state.handlers && typeof state.handlers.pauseShortly === 'function') {
                                    track.removeEventListener('pointerenter', state.handlers.pauseShortly);
                                    track.removeEventListener('pointerdown', state.handlers.pauseShortly);
                                    track.removeEventListener('touchstart', state.handlers.pauseShortly);
                                }
                            } catch (e) { /* ignore */ }
                            // disconnect intersection observer
                            try { if (state.io && typeof state.io.disconnect === 'function') state.io.disconnect(); } catch (e) {}
                            // remove marker
                            try { track.removeAttribute('data-mobile-duplicated'); } catch (e) {}
                            delete track.__mobileLoopState;
                        }
                    }

                    // Start an infinite, seamless auto-scroll for a horizontal track.
                    // direction: 'left' moves content leftwards (translateX negative)
                    //            'right' moves content rightwards (translateX positive)
                    function startMobileLoop(track, direction = 'left', speedPxPerSec = 30, initialOffset = 0) {
                        if (!track) return;
                        // Ensure we stop any prior loop first
                        stopMobileLoop(track);

                        // Prepare singleWidth variable used by the RAF loop (ensure defined in either branch)
                        let singleWidth = 0;

                        // If we've already duplicated/cloned this track, don't duplicate again
                        if (track.getAttribute('data-mobile-duplicated') === 'true') {
                            // still compute singleWidth based on current layout
                            const curTotal = track.scrollWidth || 0;
                            const singleWidthCur = curTotal / 2 || 0;
                            singleWidth = singleWidthCur;
                            // store state minimally
                            track.__mobileLoopState = Object.assign({}, track.__mobileLoopState || {}, { singleWidth: singleWidthCur });
                        } else {
                            // Clone child nodes instead of using innerHTML to avoid destroying references
                            const children = Array.from(track.children);
                            const cloneCount = children.length;

                            // Save previous inline style values to restore later
                            const prevDisplay = track.style.display || '';
                            const prevFlexWrap = track.style.flexWrap || '';
                            const prevWhiteSpace = track.style.whiteSpace || '';
                            const prevWidth = track.style.width || '';
                            const prevMinWidth = track.style.minWidth || '';

                            // Append clones (mark each clone so cleanup removes only clones)
                            children.forEach((c) => {
                                try {
                                    const clone = c.cloneNode(true);
                                    try { clone.setAttribute('data-mobile-clone', 'true'); } catch (e) {}
                                    track.appendChild(clone);
                                } catch (e) { /* ignore */ }
                            });

                            // Ensure the track is not width-constrained by CSS on mobile
                            // (some responsive rules set width:100% which prevents duplication from extending)
                            track.style.display = track.style.display || 'inline-flex';
                            track.style.flexWrap = 'nowrap';
                            track.style.whiteSpace = 'nowrap';
                            track.style.willChange = 'transform';

                            // Measure total width after duplication and force it so transforms will translate the full content
                            const totalWidth = track.scrollWidth || 0;
                            singleWidth = totalWidth / 2 || 0;
                            if (totalWidth > 0) {
                                track.style.width = totalWidth + 'px';
                                // Also set minWidth to avoid shrinkage in flex contexts
                                track.style.minWidth = totalWidth + 'px';
                            }

                            // mark duplicated so we don't double-clone
                            try { track.setAttribute('data-mobile-duplicated', 'true'); } catch (e) {}

                            // store previous style and clone count for cleanup
                            track.__mobileLoopState = Object.assign({}, track.__mobileLoopState || {}, {
                                cloneCount,
                                prevDisplay,
                                prevFlexWrap,
                                prevWhiteSpace,
                                prevWidth,
                                prevMinWidth,
                                singleWidth
                            });
                        }

                        // Initialize pos so any pre-centering is preserved.
                        // initialOffset is expected to be a positive number indicating how many px
                        // the content was shifted to center the start card. We invert that here
                        // because translateX uses negative values to move content left.
                        let pos = 0; // current translateX in px
                        let last = performance.now();
                        let rafId = null;
                        let paused = false;

                        function step(now) {
                            if (!rafId) return; // stopped
                            const dt = Math.min(0.05, (now - last) / 1000); // clamp dt to avoid jumps
                            last = now;
                            if (!paused && singleWidth > 0) {
                                pos += (direction === 'left' ? -1 : 1) * (speedPxPerSec * dt);
                                if (pos <= -singleWidth) pos += singleWidth;
                                if (pos >= singleWidth) pos -= singleWidth;
                                track.style.transform = `translateX(${pos}px)`;
                            }
                            rafId = requestAnimationFrame(step);
                        }

                        // Pause briefly on user interaction (touch/hover) to avoid fighting touches
                        function pauseShortly() {
                            paused = true;
                            if (track.__mobileLoopState && track.__mobileLoopState.pauseTimeout) clearTimeout(track.__mobileLoopState.pauseTimeout);
                            track.__mobileLoopState.pauseTimeout = setTimeout(() => { paused = false; }, 900);
                        }

                        // IntersectionObserver to pause loop when the section isn't visible
                        let io = null;
                        try {
                            io = new IntersectionObserver((entries) => {
                                entries.forEach(en => {
                                    if (!en.isIntersecting) paused = true;
                                    else paused = false;
                                });
                            }, { threshold: 0 });
                            // observe nearest parent row so the loop pauses when offscreen
                            io.observe(track.parentElement || track);
                        } catch (e) {
                            io = null;
                        }

                        // Wire touch/pointer events to pause while user is interacting
                        track.addEventListener('pointerenter', pauseShortly, { passive: true });
                        track.addEventListener('pointerdown', pauseShortly, { passive: true });
                        track.addEventListener('touchstart', pauseShortly, { passive: true });

                        // If there's an initialOffset requested, initialize pos accordingly.
                        if (singleWidth > 0 && initialOffset) {
                            // clamp initialOffset to singleWidth range
                            let clamped = initialOffset % singleWidth;
                            // set pos so the visual centering matches the original offset
                            pos = -clamped;
                            track.style.transform = `translateX(${pos}px)`;
                        }

                        // Start RAF
                        rafId = requestAnimationFrame(step);

                        // ensure track.__mobileLoopState exists and update rafId/io and event handlers
                        track.__mobileLoopState = track.__mobileLoopState || {};
                        track.__mobileLoopState.rafId = rafId;
                        track.__mobileLoopState.io = io;
                        track.__mobileLoopState.stop = () => stopMobileLoop(track);
                        track.__mobileLoopState.handlers = { pauseShortly };
                    }

                    // Ensure previous loops are stopped (in case of re-init)
                    if (leftTrack) stopMobileLoop(leftTrack);
                    if (rightTrack) stopMobileLoop(rightTrack);

                    // Center the marked start cards for first paint
                    if (leftTrack) {
                        const startCardLeft = leftTrack.querySelector('.skill-card.start-here-left');
                        if (startCardLeft && leftRow) {
                            const cardLeft = startCardLeft.offsetLeft;
                            const cardWidth = startCardLeft.offsetWidth;
                            const centerTargetLeft = Math.max(0, (leftRow.clientWidth / 2) - (cardWidth / 2));
                            const initialOffsetLeft = Math.max(0, cardLeft - centerTargetLeft);
                            leftTrack.style.transform = `translateX(${-initialOffsetLeft}px)`;
                        }
                    }

                    if (rightTrack) {
                        const startCard = rightTrack.querySelector('.skill-card.start-here');
                        if (startCard && rightRow) {
                            const cardLeft = startCard.offsetLeft;
                            const cardWidth = startCard.offsetWidth;
                            const centerTarget = Math.max(0, (rightRow.clientWidth / 2) - (cardWidth / 2));
                            const initialOffset = Math.max(0, cardLeft - centerTarget);
                            rightTrack.style.transform = `translateX(${-initialOffset}px)`;
                        }
                    }

                    // Start the mobile auto-scroll loops with modest speeds (px/sec)
                    // left track moves leftwards visually, right track moves rightwards
                    // Compute initial offsets so the marked start cards appear centered
                    let initialOffsetLeft = 0;
                    let initialOffsetRight = 0;
                    try {
                        if (leftTrack) {
                            const startCardLeft = leftTrack.querySelector('.skill-card.start-here-left');
                            if (startCardLeft && leftRow) {
                                const cardLeft = startCardLeft.offsetLeft;
                                const cardWidth = startCardLeft.offsetWidth;
                                const centerTargetLeft = Math.max(0, (leftRow.clientWidth / 2) - (cardWidth / 2));
                                initialOffsetLeft = Math.max(0, cardLeft - centerTargetLeft);
                            }
                        }
                    } catch (e) { initialOffsetLeft = 0; }

                    try {
                        if (rightTrack) {
                            const startCard = rightTrack.querySelector('.skill-card.start-here');
                            if (startCard && rightRow) {
                                const cardLeft = startCard.offsetLeft;
                                const cardWidth = startCard.offsetWidth;
                                const centerTarget = Math.max(0, (rightRow.clientWidth / 2) - (cardWidth / 2));
                                initialOffsetRight = Math.max(0, cardLeft - centerTarget);
                            }
                        }
                    } catch (e) { initialOffsetRight = 0; }

                    if (leftTrack) startMobileLoop(leftTrack, 'left', 32, initialOffsetLeft);
                    if (rightTrack) startMobileLoop(rightTrack, 'right', 26, initialOffsetRight);

                    // Add a media query listener so loops start/stop when resizing
                    // across the desktop/mobile breakpoint (useful when testing in DevTools)
                    const mql = window.matchMedia('(max-width: 1023px)');
                    function mqHandler(e) {
                        if (e.matches) {
                            // entering mobile - recompute offsets then start
                            let iLeft = 0, iRight = 0;
                            try {
                                const sc = leftTrack && leftTrack.querySelector('.skill-card.start-here-left');
                                if (sc && leftRow) {
                                    iLeft = Math.max(0, sc.offsetLeft - Math.max(0, (leftRow.clientWidth / 2) - (sc.offsetWidth / 2)));
                                }
                            } catch (er) { iLeft = 0; }
                            try {
                                const sc2 = rightTrack && rightTrack.querySelector('.skill-card.start-here');
                                if (sc2 && rightRow) {
                                    iRight = Math.max(0, sc2.offsetLeft - Math.max(0, (rightRow.clientWidth / 2) - (sc2.offsetWidth / 2)));
                                }
                            } catch (er) { iRight = 0; }

                            if (leftTrack) startMobileLoop(leftTrack, 'left', 32, iLeft);
                            if (rightTrack) startMobileLoop(rightTrack, 'right', 26, iRight);
                        } else {
                            // leaving mobile
                            if (leftTrack) stopMobileLoop(leftTrack);
                            if (rightTrack) stopMobileLoop(rightTrack);
                        }
                    }
                    // Remove any previous mql listener stored on the section
                    if (skillsSection && skillsSection.__mobileMql) {
                        try {
                            const prev = skillsSection.__mobileMql;
                            if (typeof prev.remove === 'function') prev.remove();
                        } catch (e) {}
                        delete skillsSection.__mobileMql;
                    }

                    if (typeof mql.addEventListener === 'function') {
                        mql.addEventListener('change', mqHandler);
                        // store a removal helper
                        if (skillsSection) skillsSection.__mobileMql = { remove: () => mql.removeEventListener('change', mqHandler) };
                    } else if (typeof mql.addListener === 'function') {
                        mql.addListener(mqHandler);
                        if (skillsSection) skillsSection.__mobileMql = { remove: () => mql.removeListener(mqHandler) };
                    }

                    // Store cleanup hooks on the skillsSection so other code can stop loops
                    if (skillsSection) {
                        skillsSection.__stopMobileSkills = function() {
                            if (leftTrack) stopMobileLoop(leftTrack);
                            if (rightTrack) stopMobileLoop(rightTrack);
                            if (skillsSection.__mobileMql && typeof skillsSection.__mobileMql.remove === 'function') skillsSection.__mobileMql.remove();
                            delete skillsSection.__mobileMql;
                        };
                    }
                } catch (e) {
                    // non-fatal: if measurements fail (e.g. element not rendered)
                    // we simply skip the mobile loop.
                    console.warn('mobile skills auto-scroll failed', e);
                }
            }

            // refresh triggers
            ScrollTrigger.refresh();
        } catch (e) {
            console.warn('initSkillsSection error:', e);
        }
    }

    // Initialize the menu overlay behavior (GSAP timeline + event wiring)
    function initMenuOverlay() {
        const menuToggle = document.querySelector('.menu-toggle');
        const menuOverlay = document.getElementById('site-menu');
        if (!menuToggle || !menuOverlay) return;

    const menuLinks = menuOverlay.querySelectorAll('.menu-nav a');

        // Build a small timeline: overlay drops from top and menu items fade/slide in
        const menuTL = gsap.timeline({ paused: true })
            .set(menuOverlay, { autoAlpha: 0, y: '-100%' })
            .to(menuOverlay, { autoAlpha: 1, y: '0%', duration: 0.62, ease: 'power3.out' })
            .fromTo(menuLinks, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.36 }, '<0.08');

        function openMenu() {
            menuTL.play();
            menuToggle.setAttribute('aria-expanded', 'true');
            menuOverlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('menu-open');
            // Change the top-right toggle text to 'Close'
            menuToggle.textContent = 'Close';
            // Give focus inside the menu for accessibility
            const firstLink = menuOverlay.querySelector('.menu-nav a');
            if (firstLink) firstLink.focus();
        }

        function closeMenu() {
            menuTL.reverse();
            menuToggle.setAttribute('aria-expanded', 'false');
            menuOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('menu-open');
            // Restore toggle label to 'Menu'
            menuToggle.textContent = 'Menu';
            menuToggle.focus();
        }

        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
            if (expanded) closeMenu(); else openMenu();
        });

        // Clicking the backdrop (overlay) closes when clicking outside menu-inner
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) closeMenu();
        });

        // Links close the menu and perform normal anchor navigation.
        // We keep a small timeout so the overlay close animation can run
        // before the browser jumps to the anchor.
        menuLinks.forEach((a) => {
            a.addEventListener('click', (ev) => {
                // Don't prevent the link semantics entirely; close the menu then navigate.
                ev.preventDefault();
                const href = a.getAttribute('href');
                closeMenu();

                setTimeout(() => {
                    if (href && href.startsWith('#')) {
                        // Use location.href so the browser performs the anchor jump
                        // and adds a history entry like a normal link click.
                        try {
                            window.location.href = href;
                        } catch (e) {
                            // Fallback: set hash
                            window.location.hash = href;
                        }
                    } else if (href) {
                        window.location.href = href;
                    }
                }, 260);
            });
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
                closeMenu();
            }
        });

        // Handle logo navigation
        const logoLink = document.querySelector('.site-logo-link[href^="#"]');
        if (logoLink) {
            logoLink.addEventListener('click', (ev) => {
                ev.preventDefault();
                const href = logoLink.getAttribute('href');
                
                if (href === '#home') {
                    // Always scroll to top for home, regardless of screen size
                    window.scrollTo({ top: 0, behavior: 'auto' });
                    try { history.replaceState(null, '', href); } catch (e) {}
                    setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 100);
                }
            });
        }

        // Handle footer navigation with normal anchor behavior
        const footerLinks = document.querySelectorAll('.footer-nav a[href^="#"]');
        footerLinks.forEach((a) => {
            a.addEventListener('click', (ev) => {
                ev.preventDefault();
                const href = a.getAttribute('href');
                if (href && href.startsWith('#')) {
                    try {
                        window.location.href = href;
                    } catch (e) {
                        window.location.hash = href;
                    }
                } else if (href) {
                    window.location.href = href;
                }
            });
        });
    }

    // Initialize contact animations and menu after fonts/images are ready
    // so measurements and focus handling behave correctly
    waitForFontsAndImages().then(() => {
        try {
            initSplitAnimations();
            initAboutReveal();
            initContactAnimations(); // Add contact animations
            initPortfolioHeadingAnimations(); // Animate all .portfolio-heading headings (char reveal)
            initMenuOverlay(); // new: menu overlay wiring
            // Initialize landing animations (from merged Land script)
            try { initLandingAnimations(); } catch (e) { console.warn('initLandingAnimations error:', e); }
            // Initialize intro background dots animation
            try { initIntroBackgroundDots(); } catch (e) { console.warn('initIntroBackgroundDots error:', e); }
            // Initialize skills section animations
            try { initSkillsSection(); } catch (e) { console.warn('initSkillsSection error:', e); }
            // Animate landing intro on load/refresh
            try { animateLandingIntro(); } catch (e) { /* non-fatal */ }
            ScrollTrigger.refresh();
        } catch (e) {
            console.error('Animation initialization error:', e);
        }
    });

    // Ensure refresh/load doesn't auto-jump to anchors on reload.
    // If the page was loaded with a hash (e.g. #contact), force scroll to top
    // and remove the hash so the browser doesn't re-jump. Small timeout lets
    // the browser finish its default scroll then we override it.
    window.addEventListener('load', () => {
        if (window.location.hash) {
            setTimeout(() => {
                try {
                    window.scrollTo({ top: 0, behavior: 'auto' });
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                } catch (e) {
                    // ignore
                }
            }, 20);
        }
    });

    // Global debounced resize handler: ensure ScrollTrigger recalculates and
    // force a tiny reflow to avoid layout/blanking issues when toggling
    // device sizes (DevTools responsive mode, orientation changes, etc.).
    (function attachGlobalResizeHandler() {
        function debounce(fn, wait) {
            let t = null;
            return function(...args) {
                clearTimeout(t);
                t = setTimeout(() => fn.apply(this, args), wait);
            };
        }

        function handleResize() {
            try {
                // Refresh ScrollTrigger calculations
                if (window.ScrollTrigger) ScrollTrigger.refresh();
            } catch (e) {
                console.warn('global resize: ScrollTrigger.refresh failed', e);
            }

            // Force a tiny reflow / repaint to avoid certain browsers leaving
            // the document in a blank state after large layout changes
            // triggered by responsive emulation toggles.
            try {
                // Toggle a no-op style which triggers reflow but is harmless
                const body = document.body;
                if (body) {
                    body.style.willChange = 'transform';
                    // reading offsetHeight forces a reflow
                    void body.offsetHeight;
                    body.style.willChange = '';
                }
            } catch (e) {
                // non-fatal
            }

            // Recovery: if the document's height becomes unexpectedly small
            // (common when Lenis or pinned elements leave a transform that
            // collapses layout during DevTools responsive toggles), attempt
            // to remove Lenis artifacts and clear transforms so the page
            // regains normal flow.
            try {
                const docHeight = document.documentElement.scrollHeight || 0;
                if (docHeight < window.innerHeight * 0.6) {
                    console.warn('global resize: detected small document height, attempting recovery');

                    // Remove lenis classes if present (harmless if absent)
                    try {
                        document.documentElement.classList.remove('lenis', 'lenis-scrolling');
                        document.body.classList.remove('lenis', 'lenis-scrolling');
                    } catch (e) {}

                    // Clear transform/translate style on root elements which
                    // can leave the viewport blank if left as a large translate
                    try {
                        document.documentElement.style.transform = '';
                        document.body.style.transform = '';
                    } catch (e) {}

                    // If Lenis instance is available, attempt a graceful stop/destroy
                    try {
                        if (typeof lenis !== 'undefined' && lenis) {
                            if (typeof lenis.destroy === 'function') {
                                lenis.destroy();
                            } else if (typeof lenis.stop === 'function') {
                                lenis.stop();
                            }
                        }
                    } catch (e) {
                        // non-fatal
                    }

                    // Refresh ScrollTrigger again after clearing transforms
                    try { if (window.ScrollTrigger) ScrollTrigger.refresh(); } catch (e) {}

                    // Force another small reflow/read
                    try { void document.body.offsetHeight; } catch (e) {}
                }
            } catch (e) {
                // swallow
            }
        }

        const debounced = debounce(handleResize, 180);
        window.addEventListener('resize', debounced);
        window.addEventListener('orientationchange', debounced);
    })();

});

/* ===== Landing animations (merged from Land/script.js) ===== */
// Landing animation variables (reused inside DOMContentLoaded scope)
let _lp_cardContainer = null;
let _lp_stickyHeader = null;
let _lp_isGapAnimationCompleted = false;
let _lp_isFlipAnimationCompleted = false;
let _lp_resizeTimer = null;

function initLandingAnimations() {
    // Query elements lazily (DOM should be ready when this is called)
    _lp_cardContainer = document.querySelector('.lp-card-container');
    _lp_stickyHeader = document.querySelector('.lp-sticky-header .lp-heading');

    // Remove existing ScrollTriggers related to landing to avoid duplicates
    ScrollTrigger.getAll().forEach((t) => {
        // best-effort: kill any trigger that references .lp-sticky or .lp-card
        try {
            const trig = t.trigger;
            if (!trig) return;
            if (String(trig).includes('.lp-sticky') || String(trig).includes('.lp-card') || String(trig).includes('.lp-card-container')) {
                t.kill();
            }
        } catch (e) {}
    });

    const mm = gsap.matchMedia();

    // Mobile / small screens
    mm.add('(max-width: 999px)', () => {
        // Reset inline styles for simplified mobile layout
        document
            .querySelectorAll('.lp-card, .lp-card-container, .lp-sticky-header .lp-heading')
            .forEach((el) => { if (el) el.style = ''; });
        return {};
    });

    // Desktop / large screens
    mm.add('(min-width: 1000px)', () => {
        // 🧩 Mobile Chrome viewport fix applied (stable vh & invalidateOnRefresh)
        ScrollTrigger.create({
            trigger: '.lp-sticky',
            start: 'top top',
            end: `+=${window.innerHeight * 4}px`,
            scrub: 1,
            pin: true,
            pinSpacing: true,
            invalidateOnRefresh: true,
            onToggle: (self) => {
                try {
                    const el = document.querySelector('.lp-sticky');
                    if (el && self.isActive) {
                        gsap.set(el, { force3D: true });
                        el.style.willChange = 'transform, top, left';
                    } else if (el) {
                        el.style.willChange = '';
                    }
                } catch (e) {}
            },
            onUpdate: (self) => {
                const progress = self.progress;

                // Header reveal animation between 10% and 25% progress
                if (_lp_stickyHeader) {
                    if (progress >= 0.1 && progress <= 0.25) {
                        const headerProgress = gsap.utils.mapRange(0.1, 0.25, 0, 1, progress);
                        const yValue = gsap.utils.mapRange(0, 1, 40, 0, headerProgress);
                        const opacityValue = gsap.utils.mapRange(0, 1, 0, 1, headerProgress);
                        gsap.set(_lp_stickyHeader, { y: yValue, opacity: opacityValue });
                    } else if (progress < 0.1) {
                        gsap.set(_lp_stickyHeader, { y: 40, opacity: 0 });
                    } else if (progress > 0.25) {
                        gsap.set(_lp_stickyHeader, { y: 0, opacity: 1 });
                    }
                }

                // Card container width interpolation
                if (_lp_cardContainer) {
                    if (progress <= 0.25) {
                        const widthPercentage = gsap.utils.mapRange(0, 0.25, 75, 60, progress);
                        gsap.set(_lp_cardContainer, { width: `${widthPercentage}%` });
                    } else {
                        gsap.set(_lp_cardContainer, { width: '60%' });
                    }
                }

                // Gap and border radius animation triggered once
                if (progress >= 0.35 && !_lp_isGapAnimationCompleted) {
                    if (_lp_cardContainer) gsap.to(_lp_cardContainer, { gap: '20px', duration: 0.5, ease: 'power3.out' });
                    gsap.to(['#card-1', '#card-2', '#card-3'], { borderRadius: '20px', duration: 0.5, ease: 'power3.out' });
                    _lp_isGapAnimationCompleted = true;
                } else if (progress < 0.35 && _lp_isGapAnimationCompleted) {
                    if (_lp_cardContainer) gsap.to(_lp_cardContainer, { gap: '0px', duration: 0.5, ease: 'power3.out' });
                    gsap.to('#card-1', { borderRadius: '20px 0 0 20px', duration: 0.5, ease: 'power3.out' });
                    gsap.to('#card-2', { borderRadius: '0', duration: 0.5, ease: 'power3.out' });
                    gsap.to('#card-3', { borderRadius: '0 20px 20px 0', duration: 0.5, ease: 'power3.out' });
                    _lp_isGapAnimationCompleted = false;
                }

                if (progress >= 0.7 && !_lp_isFlipAnimationCompleted) {
                    gsap.to('.lp-card', { rotationY: 180, duration: 0.75, ease: 'power3.out', stagger: 0.1 });
                    gsap.to(['#card-1', '#card-3'], { y: 30, rotationZ: (i) => [-15, 15][i], duration: 0.75, ease: 'power3.inOut' });
                    _lp_isFlipAnimationCompleted = true;
                } else if (progress < 0.7 && _lp_isFlipAnimationCompleted) {
                    gsap.to('.lp-card', { rotationY: 0, duration: 0.75, ease: 'power3.inOut', stagger: -0.1 });
                    gsap.to(['#card-1', '#card-3'], { y: 0, rotationZ: 0, duration: 0.75, ease: 'power3.inOut' });
                    _lp_isFlipAnimationCompleted = false;
                }
            },
        });

        return {};
    });

    // Initialize and re-init on resize (debounced)
    if (_lp_resizeTimer) clearTimeout(_lp_resizeTimer);
    _lp_resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(_lp_resizeTimer);
        _lp_resizeTimer = setTimeout(() => initLandingAnimations(), 250);
    });

}

/* ===== End landing animations ===== */

/* Small intro animation to run on page load/refresh */
function animateLandingIntro(){
    try{
        const introHeading = document.querySelector('.lp-intro .lp-heading');
        const ctas = document.querySelectorAll('.lp-hero-cta a');
        const tl = gsap.timeline({defaults:{ease:'power3.out'}});
        tl.from(introHeading, {y: 28, opacity:0, duration:0.9})
          .from(ctas, {y: 3, opacity:0, stagger:0.12, duration:0.6}, '-=0.35');
    }catch(e){
        // silently ignore if elements missing
    }
}

// Intro section animated background: small non-circular dots falling top -> down
function initIntroBackgroundDots() {
    const section = document.querySelector('.lp-intro');
    if (!section) return;

    // Create canvas if not present
    let canvas = section.querySelector('.intro-bg-dots');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'intro-bg-dots';
        // insert as first child so content remains above
        section.insertBefore(canvas, section.firstChild);
    }

    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;
    let particles = [];
    let lastTime = performance.now();
    let rafId = null;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        width = Math.max(1, Math.floor(section.clientWidth * dpr));
        height = Math.max(1, Math.floor(section.clientHeight * dpr));
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = section.clientWidth + 'px';
        canvas.style.height = section.clientHeight + 'px';

        // Recreate particles based on area
        const area = (width / dpr) * (height / dpr);
        const targetCount = Math.max(24, Math.min(140, Math.round(area / 6000)));
        particles = [];
        for (let i = 0; i < targetCount; i++) particles.push(createParticle(true));
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function createParticle(initial) {
        const size = Math.max(1, Math.round(rand(2, 6)));
        return {
            x: rand(0, width) ,
            y: initial ? rand(-height, height) : rand(-20 * dpr, -1 * dpr),
            size: size * dpr,
            vy: rand(0.2, 1.0) * dpr,
            drift: rand(-0.2, 0.2) * dpr,
            phase: rand(0, Math.PI * 2),
            color: `rgba(${rand(60,120)},${rand(60,120)},${rand(60,120)},${rand(0.35,0.85)})` // grey-ish
        };
    }

    function drawRect(p) {
        // Draw a small circle-like shape (use arc for a round dot).
        // Position p.x/p.y are treated as the top-left origin for legacy reasons,
        // convert to a center for arc drawing.
        ctx.fillStyle = p.color;
        const centerX = p.x + p.size * 0.5;
        const centerY = p.y + (p.size * 0.35);
        const radius = Math.max(1, p.size * 0.45);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    function step(now) {
        const dt = Math.min(50, now - lastTime) / 16.67; // normalize to ~60fps
        lastTime = now;

        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.phase += 0.01 * dt;
            p.x += Math.sin(p.phase) * p.drift * dt;
            p.y += p.vy * (0.9 + 0.2 * Math.sin(p.phase)) * dt;

            drawRect(p);

            if (p.y > height + p.size) {
                // reset to top smoothly
                particles[i] = createParticle(false);
                particles[i].x = rand(0, width);
                particles[i].y = -rand(2, 40) * dpr;
            }
        }

        rafId = requestAnimationFrame(step);
    }

    // Start/stop based on visibility to save CPU when not visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!rafId) { lastTime = performance.now(); rafId = requestAnimationFrame(step); }
            } else {
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
            }
        });
    }, { threshold: 0 });

    resize();
    observer.observe(section);

    // Wire resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 120);
    });
}