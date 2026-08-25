document.getElementById("currentDate").textContent = new Date().getFullYear();

class UIManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('click', (event) => this.handleClick(event));
    }

    handleClick(event) {
        const actionElement = event.target.closest('[data-action]');
        if (!actionElement) return;

        const action = actionElement.dataset.action;
        const className = actionElement.dataset.class || 'is-collapsed';

        const targetEls = actionElement.dataset.target
            ? document.querySelectorAll(actionElement.dataset.target)
            : [actionElement];

        if (!targetEls.length) return;

        if (action === 'toggle-class') {
            const shouldAdd = !targetEls[0].classList.contains(className);
            targetEls.forEach((el) => el.classList.toggle(className, shouldAdd));
            this.updateAriaExpanded(actionElement, shouldAdd);
        }
        else if (action === 'add-class') {
            targetEls.forEach((el) => el.classList.add(className));
            this.updateAriaExpandedTarget(actionElement.dataset.target, false);
        }
        else if (action === 'remove-class') {
            targetEls.forEach((el) => el.classList.remove(className));
            this.updateAriaExpandedTarget(actionElement.dataset.target, true);
        }
    }

    updateAriaExpanded(element, isExpanded) {
        if (element && element.hasAttribute('aria-expanded')) {
            element.setAttribute('aria-expanded', String(isExpanded));
        }
    }

    updateAriaExpandedTarget(targetSelector, isExpanded) {
        const triggerBtns = document.querySelectorAll(`[data-target="${targetSelector}"]`);
        triggerBtns.forEach((btn) => this.updateAriaExpanded(btn, isExpanded));
    }
}

new UIManager()

/**
 * Erstellt einen IntersectionObserver für ein beliebiges Target-Element
 * und schaltet eine Klasse auf einem Ziel-Element (z.B. Navbar).
 * @param {HTMLElement} targetElement - Das Element, das beobachtet wird
 * @param {HTMLElement} toggleElement - Das Element, das angepasst wird
 * @param {string} className - Die CSS-Klasse, die geschaltet wird (Standard: "hidden")
 * @param {object} options - Optionale Observer-Optionen
 */
function createVisibilityObserver(targetElement, toggleElement, className = "is-hidden", options = { threshold: 0 }) {
    if (!targetElement || !toggleElement) {
        console.error("Target- oder Toggle-Element wurde nicht gefunden!");
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                toggleElement.classList.remove(className);
            } else {
                toggleElement.classList.add(className);
            }
        });
    }, options);

    observer.observe(targetElement);
    return observer;
}

document.addEventListener("DOMContentLoaded", () => {
    const toggleTargets = document.querySelectorAll("[data-toggle]");

    toggleTargets.forEach(targetElement => {
        const toggleSelector = targetElement.dataset.toggle;
        const toggleElement = document.querySelector(toggleSelector);

        if (toggleElement) {
            createVisibilityObserver(targetElement, toggleElement, "is-hidden", {
                threshold: 0,
                rootMargin: "-50px 0px 0px 0px"
            });
        }
    });
});