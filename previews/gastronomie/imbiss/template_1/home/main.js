class ImageSlider {
    constructor(root, options = {}) {
        this.root = typeof root === 'string' ? document.querySelector(root) : root;
        if (!this.root) return;

        this.options = Object.assign({
            mode: 'translate',
            wrapperSelector: '.wrapper',
            itemSelector: '.img-slider-item',
            itemsContainer: null,
            dotSelector: '.img-slider-dot-index',
            dotsContainer: null,
            autoplay: true,
            interval: 5000,
            pauseOnHover: true,
            swipe: true
        }, options);

        if (this.options.mode === 'fade') {
            const itemsScope = this.options.itemsContainer
                ? (typeof this.options.itemsContainer === 'string'
                    ? document.querySelector(this.options.itemsContainer)
                    : this.options.itemsContainer)
                : this.root;
            this.wrapper = null;
            this.items = itemsScope ? Array.from(itemsScope.querySelectorAll(this.options.itemSelector)) : [];
        } else {
            this.wrapper = this.root.querySelector(this.options.wrapperSelector);
            this.items = this.wrapper ? Array.from(this.wrapper.querySelectorAll(this.options.itemSelector)) : [];
        }

        const dotsScope = this.options.dotsContainer
            ? (typeof this.options.dotsContainer === 'string'
                ? document.querySelector(this.options.dotsContainer)
                : this.options.dotsContainer)
            : this.root;
        this.dots = dotsScope ? Array.from(dotsScope.querySelectorAll(this.options.dotSelector)) : [];

        if ((this.options.mode !== 'fade' && !this.wrapper) || this.items.length === 0) return;

        this.current = 0;
        this.timer = null;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this.options.mode !== 'fade') {
            this.wrapper.style.transition = this.reducedMotion
                ? 'none'
                : 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
        }

        this._bindDots();
        if (this.options.swipe) this._bindSwipe();
        if (this.options.pauseOnHover) this._bindHoverPause();

        this.goTo(0);

        if (this.options.autoplay && !this.reducedMotion) this._startAutoplay();
    }

    goTo(index) {
        const total = this.items.length;
        this.current = (index + total) % total;

        if (this.options.mode === 'fade') {
            this.items.forEach((item, i) => item.classList.toggle('active', i === this.current));
        } else {
            this.wrapper.style.transform = `translateX(-${this.current * 100}%)`;
        }

        this.dots.forEach((dot, i) => dot.classList.toggle('active', i === this.current));
    }

    next() {
        this.goTo(this.current + 1);
    }

    prev() {
        this.goTo(this.current - 1);
    }

    _bindDots() {
        this.dots.forEach((dot, i) => {
            dot.style.cursor = 'pointer';
            dot.setAttribute('role', 'button');
            dot.setAttribute('tabindex', '0');
            dot.setAttribute('aria-label', `Slide ${i + 1} anzeigen`);

            dot.addEventListener('click', () => {
                this.goTo(i);
                this._restartAutoplay();
            });

            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.goTo(i);
                    this._restartAutoplay();
                }
            });
        });
    }

    _bindHoverPause() {
        this.root.addEventListener('mouseenter', () => this._stopAutoplay());
        this.root.addEventListener('mouseleave', () => {
            if (this.options.autoplay && !this.reducedMotion) this._startAutoplay();
        });
    }

    _bindSwipe() {
        const target = this.wrapper || this.root;
        let startX = 0;
        let dragging = false;
        const threshold = 40;

        target.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            dragging = true;
            this._stopAutoplay();
        }, { passive: true });

        target.addEventListener('touchend', (e) => {
            if (!dragging) return;
            dragging = false;
            const diff = startX - e.changedTouches[0].clientX;

            if (diff > threshold) this.next();
            else if (diff < -threshold) this.prev();

            this._restartAutoplay();
        });
    }

    _startAutoplay() {
        this._stopAutoplay();
        this.timer = setInterval(() => this.next(), this.options.interval);
    }

    _stopAutoplay() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    _restartAutoplay() {
        if (this.options.autoplay && !this.reducedMotion) this._startAutoplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ImageSlider('.hero-section', {
        mode: 'fade',
        itemSelector: '.hero-slide',
        itemsContainer: '.hero-slides',
        dotsContainer: '.header-dots',
        interval: 6000,
        pauseOnHover: false
    });

    new ImageSlider('.about-section .img-slider-container', {
        interval: 5000
    });
});