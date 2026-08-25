let jobsObj = [];

const TAB_COLOR_VAR = {
    restaurant: 'var(--tab-restaurant)',
    steuerberater: 'var(--tab-steuerberater)',
    anwalt: 'var(--tab-anwalt)',
    portfolio: 'var(--tab-portfolio)',
};

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const STATUS_LABEL = {
    offen: 'Offen',
    bearbeitet: 'Erledigt',
};

const GITHUB_CONFIG = {
    owner: 'DEIN_GITHUB_USERNAME',      // z.B. 'max-mustermann'
    repo: 'DEIN_REPO_NAME',             // z.B. 'website-uebersicht'
    branch: 'main',                     // z.B. 'main' oder 'gh-pages'
    path: 'PagePreview/data/jobData.json', // Pfad IM Repo (ohne führenden Slash)
};

function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

async function getData(filePath) {
    try {
        const response = await fetch(filePath);

        if (!response.ok) {
            throw new Error("Bad connection to server");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            console.log(`Data was empty, please check ${filePath}`);
            return [];
        }

        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

async function saveData() {
    const token = window.prompt(
        'Bitte GitHub Personal Access Token eingeben (wird nicht gespeichert):'
    );

    if (!token) {
        alert('Kein Token eingegeben – Speichern abgebrochen.');
        return false;
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

    try {
        // 1. Aktuelle Datei abrufen, um die SHA zu bekommen (zwingend nötig für Update)
        const getResponse = await fetch(`${apiUrl}?ref=${GITHUB_CONFIG.branch}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
            },
        });

        if (!getResponse.ok) {
            throw new Error(`Datei konnte nicht geladen werden (Status ${getResponse.status})`);
        }

        const fileData = await getResponse.json();
        const currentSha = fileData.sha;

        // 2. Neuen Inhalt vorbereiten
        const updatedContent = JSON.stringify(jobsObj, null, 2);
        const encodedContent = utf8ToBase64(updatedContent);

        // 3. Datei aktualisieren (commit)
        const putResponse = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Update jobData.json – ${new Date().toLocaleString('de-DE')}`,
                content: encodedContent,
                sha: currentSha,
                branch: GITHUB_CONFIG.branch,
            }),
        });

        if (!putResponse.ok) {
            const errorBody = await putResponse.json().catch(() => ({}));
            throw new Error(errorBody.message || `Commit fehlgeschlagen (Status ${putResponse.status})`);
        }

        console.log('jobData.json erfolgreich auf GitHub aktualisiert.');
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern auf GitHub:', error);
        alert(`Speichern fehlgeschlagen: ${error.message}`);
        return false;
    }
}

/* ---------- 2. UI Manager (Event Delegation für generische Action-Buttons) ---------- */
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

/* ---------- 3. Job-Liste rendern & Stats ---------- */
function renderJobs() {
    const jobDisplay = document.getElementById('jobDisplay');
    if (!jobDisplay) return;

    if (!jobsObj || jobsObj.length === 0) {
        jobDisplay.textContent = 'Keine Einträge';
        jobDisplay.classList.add("is-empty");
        return;
    }

    jobDisplay.classList.remove("is-empty");

    const jobList = jobDisplay.closest('.job-list');
    const isEditMode = jobList?.classList.contains('edit-mode') ?? false;
    const fragment = document.createDocumentFragment();

    jobsObj.forEach((job) => {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-list-item';
        jobCard.dataset.category = job.category;
        jobCard.dataset.status = job.status;
        jobCard.dataset.date = job.date;
        jobCard.dataset.id = job.id;
        jobCard.style.setProperty('--tab-color', TAB_COLOR_VAR[job.category] || '');

        const jobLink = document.createElement('a');
        jobLink.href = job.previewUrl || '#';
        if (!job.previewUrl) {
            jobLink.addEventListener('click', (event) => event.preventDefault());
        }

        const headlineContainer = document.createElement('div');
        headlineContainer.className = 'job-list-item-headline-contaienr';

        const h3 = document.createElement('h3');
        h3.className = 'job-list-item-headline';
        h3.textContent = job.title;

        if (job.description) {
            const description = document.createElement('p');
            description.className = 'job-list-item-description headline-subtext';
            description.textContent = job.description;
            headlineContainer.appendChild(description);
        }

        const spanDate = document.createElement('span');
        spanDate.className = 'headline-subtext';
        spanDate.textContent = dateFormatter.format(new Date(job.date));

        headlineContainer.appendChild(h3);
        headlineContainer.appendChild(spanDate);

        jobLink.appendChild(headlineContainer);
        jobCard.appendChild(jobLink);

        const controls = document.createElement('div');
        controls.className = 'job-card-controls';

        const statusLabel = document.createElement('span');
        statusLabel.className = 'job-status';
        statusLabel.dataset.status = job.status;
        statusLabel.textContent = STATUS_LABEL[job.status] || job.status;

        const checkboxWrapper = document.createElement('label');
        checkboxWrapper.className = 'job-card-checkbox';
        checkboxWrapper.setAttribute('for', `job-checkbox-${job.id}`);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `job-checkbox-${job.id}`;
        checkbox.dataset.jobId = job.id;
        checkbox.checked = job.status === 'bearbeitet';

        const checkboxText = document.createElement('span');
        checkboxText.textContent = 'Erledigt';

        checkboxWrapper.appendChild(checkbox);
        checkboxWrapper.appendChild(checkboxText);
        controls.appendChild(statusLabel);
        controls.appendChild(checkboxWrapper);
        jobCard.appendChild(controls);

        fragment.appendChild(jobCard);
    });

    jobDisplay.replaceChildren(fragment);
    if (isEditMode) {
        jobList?.classList.add('edit-mode');
    }
}

function updateStats() {
    const total = jobsObj.length;
    const open = jobsObj.filter((job) => job.status === 'offen').length;
    const closed = jobsObj.filter((job) => job.status === 'bearbeitet').length;

    const totalEl = document.getElementById('statsCardJobCounters');
    const openEl = document.getElementById('statsCardOpenJobCounters');
    const closedEl = document.getElementById('statsClosedOpenJobCounters');

    if (totalEl) totalEl.textContent = String(total);
    if (openEl) openEl.textContent = String(open);
    if (closedEl) closedEl.textContent = String(closed);
}

function refreshData() {
    renderJobs();
    updateStats();
}

/* ---------- 4. Edit-Modus ---------- */
function setEditMode(isEdit) {
    const jobList = document.querySelector('.job-list');
    const editButton = document.querySelector('.content-rigth > .list-btn.event-btn');
    const saveButton = document.querySelector('.save-btn');
    const closeButton = document.querySelector('.close-btn');

    if (!jobList || !editButton || !saveButton || !closeButton) return;

    jobList.classList.toggle('edit-mode', isEdit);
    editButton.classList.toggle('is-disabled', isEdit);
    editButton.setAttribute('aria-disabled', String(isEdit));
    saveButton.hidden = !isEdit;
    closeButton.hidden = !isEdit;

    if (!isEdit) {
        const checkboxes = jobList.querySelectorAll('.job-card-checkbox input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            const job = jobsObj.find((entry) => entry.id === checkbox.dataset.jobId);
            if (job) {
                checkbox.checked = job.status === 'bearbeitet';
            }
        });
    }
}

function initEditButtons() {
    const editButton = document.querySelector('.content-rigth > .list-btn.event-btn');
    const saveButton = document.querySelector('.save-btn');
    const closeButton = document.querySelector('.close-btn');

    if (!editButton || !saveButton || !closeButton) return;

    editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (editButton.classList.contains('is-disabled')) return;
        setEditMode(true);
    });

    closeButton.addEventListener('click', () => {
        setEditMode(false);
        refreshData();
    });

    saveButton.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.job-card-checkbox input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
            const job = jobsObj.find((entry) => entry.id === checkbox.dataset.jobId);
            if (job) {
                job.status = checkbox.checked ? 'bearbeitet' : 'offen';
            }
        });
        refreshData();
        setEditMode(false);
    });

    setEditMode(false);
}

/* ---------- 5. Filter-Dropdown ---------- */
function initFilterDropdown() {
    const wrapper = document.querySelector('.filter-btn-contaienr');
    if (!wrapper) return;

    const trigger = wrapper.querySelector('.list-btn');
    const dropdown = wrapper.querySelector('.filter-dropdown');
    const items = wrapper.querySelectorAll('.dropdown-item');

    if (!trigger || !dropdown) return;

    const closeDropdown = () => {
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
    };

    trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = wrapper.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', String(isOpen));
    });

    items.forEach((item) => {
        item.addEventListener('click', () => {
            items.forEach((el) => el.classList.remove('is-active'));
            item.classList.add('is-active');
            applyJobFilter(item.textContent.trim());
            closeDropdown();
        });
    });

    document.addEventListener('click', (event) => {
        if (!wrapper.contains(event.target)) closeDropdown();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeDropdown();
    });
}

/* ---------- 6. Filtern & Sortieren ---------- */
function applyJobFilter(option) {
    const list = document.getElementById('jobDisplay');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('.job-list-item'));

    switch (option) {
        case 'Nicht Bearbeitet':
            items.forEach((item) => {
                item.classList.toggle('is-filtered-out', item.dataset.status !== 'offen');
            });
            break;

        case 'Neuste':
            items
                .sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date))
                .forEach((item) => {
                    item.classList.remove('is-filtered-out');
                    list.appendChild(item);
                });
            break;

        case 'Älteste':
            items
                .sort((a, b) => new Date(a.dataset.date) - new Date(b.dataset.date))
                .forEach((item) => {
                    item.classList.remove('is-filtered-out');
                    list.appendChild(item);
                });
            break;

        default:
            items.forEach((item) => item.classList.remove('is-filtered-out'));
    }
}

/* ---------- 7. Zähler-Animation ---------- */
function animateStatCounters() {
    const counters = document.querySelectorAll(
        '#statsCardJobCounters, #statsCardOpenJobCounters, #statsClosedOpenJobCounters'
    );

    counters.forEach((counter) => {
        const target = parseInt(counter.textContent.trim(), 10);
        if (Number.isNaN(target)) return;

        const duration = 500;
        const start = performance.now();

        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.round(eased * target);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                counter.textContent = target;
            }
        };

        requestAnimationFrame(step);
    });
}

/* ---------- 8. Skript-Start ---------- */
async function initApp() {
    new UIManager();
    
    // Daten aus der JSON-Datei abrufen
    jobsObj = await getData('/PagePreview/data/jobData.json');
    
    refreshData();
    initEditButtons();
    initFilterDropdown();
    animateStatCounters();
}

initApp();