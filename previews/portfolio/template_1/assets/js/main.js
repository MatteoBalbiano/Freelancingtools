/**
 * UI Controller: Reads data from CONFIG and manages interface interactions
 */
const UIController = {
    observer: new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                UIController.observer.unobserve(entry.target);
            }
        });
    }),

    init() {
        this.renderStaticContent();
        this.renderWordSlider();
        this.renderSkills();

        document.querySelectorAll(".fade").forEach(el => this.observer.observe(el));
    },

    renderStaticContent() {
        const nameEl = document.querySelector(".main-headline");
        const roleEl = document.querySelector(".sub-headline");

        if (nameEl) nameEl.textContent = CONFIG.name;
        if (roleEl) roleEl.innerHTML = CONFIG.role;

        const mailLink = document.getElementById("email-link");
        const linkedinLink = document.getElementById("linkedin-link");
        const githubLink = document.getElementById("github-link");

        if (mailLink) mailLink.href = `mailto:${CONFIG.email}`;
        if (linkedinLink) linkedinLink.href = CONFIG.linkedin;
        if (githubLink) githubLink.href = CONFIG.github;
    },

    renderWordSlider() {
        const sliderContainer = document.querySelector(".word-slider");
        if (!sliderContainer) return;

        sliderContainer.innerHTML = "";
        const fragment = document.createDocumentFragment();

        CONFIG.sliderWords.forEach((word, index) => {
            const div = document.createElement("div");
            div.className = `word-slider-item grey-text ${index === 0 ? 'active' : ''}`;
            div.textContent = word;
            fragment.appendChild(div);
        });

        sliderContainer.appendChild(fragment);
        this.startSliderLogic();
    },

    renderSkills() {
        const skillList = document.querySelector(".skill-list");
        if (!skillList) return;

        skillList.innerHTML = "";
        const fragment = document.createDocumentFragment();

        CONFIG.skills.forEach((skill, index) => {
            const span = document.createElement("span");
            const isHidden = index >= 5;
            span.className = `skill-item grey-text icon-text ${isHidden ? 'hidden' : ''}`;
            span.innerHTML = `<i class="${skill.icon}"></i> <span>${skill.name}</span>`;
            fragment.appendChild(span);
        });

        const btn = document.createElement("span");
        btn.id = "showMoreBtn";
        btn.className = "skill-item grey-text icon-text";
        btn.textContent = "...";
        btn.style.backgroundColor = "rgb(81, 81, 165)";
        btn.onclick = () => this.toggleAndAnimateAll(btn, "show", "hidden");
        fragment.appendChild(btn);

        skillList.appendChild(fragment);
    },

    toggleAndAnimateAll(btnEl, showCl, hideCl) {
        const allSkills = document.querySelectorAll(".skill-item");
        const isExpanding = (btnEl.textContent.trim() === "...");
        const toReAnimate = [];

        allSkills.forEach((el) => {
            if (el.classList.contains(hideCl)) {
                if (isExpanding) {
                    el.classList.add(showCl);
                    if (el.classList.contains('fade')) this.observer.observe(el);
                } else {
                    el.classList.remove(showCl);
                }
            }
            el.classList.remove("animate-flicker");
            toReAnimate.push(el);
        });

        void document.body.offsetWidth;

        toReAnimate.forEach(el => el.classList.add("animate-flicker"));

        btnEl.textContent = isExpanding ? "See less" : "...";
    },

    startSliderLogic() {
        const slides = document.querySelectorAll(".word-slider-item");
        let i = 0;

        if (slides.length > 0) {
            setInterval(() => {
                slides[i].classList.remove("active");
                i = (i + 1) % slides.length;
                slides[i].classList.add("active");
            }, 4000);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => UIController.init());

/**
 * Random Orb Movement: moves the background glow (body::before) to
 * random positions with random size and random transition duration
 */
(function randomOrbMovement() {
    function setRandomOrbPosition() {
        const x = (Math.random() * 60 - 40).toFixed(1) + "%"; // -40% bis 20%
        const y = (Math.random() * 60 - 40).toFixed(1) + "%"; // -40% bis 20%
        const scale = (0.9 + Math.random() * 0.4).toFixed(2); // 0.9 bis 1.3
        const durationSec = 6 + Math.random() * 8; // 6s - 14s

        document.body.style.setProperty("--orb-x", x);
        document.body.style.setProperty("--orb-y", y);
        document.body.style.setProperty("--orb-scale", scale);
        document.body.style.setProperty("transition-duration", durationSec.toFixed(1) + "s");

        // nächste zufällige Bewegung planen, sobald die aktuelle Transition fertig ist
        setTimeout(setRandomOrbPosition, durationSec * 1000);
    }

    document.addEventListener("DOMContentLoaded", setRandomOrbPosition);
})();