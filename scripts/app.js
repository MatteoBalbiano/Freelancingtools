let currentPreviewUrl = '';
const previewOverlay = document.getElementById('previewOverlay');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const openInNewTabBtn = document.getElementById('openInNewTabBtn');
const previewTitle = document.getElementById('previewTitle');
const previewDescription = document.getElementById('previewDescription');

function showPreviewOverlay(job) {
    if (!previewOverlay) return;

    currentPreviewUrl = job.previewUrl;
    previewOverlay.classList.remove('hidden');
    document.documentElement.classList.add('preview-open');

    const iframe = document.getElementById('previewIframe');
    if (iframe) {
        iframe.src = job.previewUrl;
    }

    if (previewTitle) {
        previewTitle.textContent = job.title || 'Website Vorschau';
    }

    if (previewDescription) {
        previewDescription.textContent = job.description || '';
    }

    if (openInNewTabBtn) {
        openInNewTabBtn.disabled = false;
    }
}

function hidePreviewOverlay() {
    if (!previewOverlay) return;

    previewOverlay.classList.add('hidden');
    document.documentElement.classList.remove('preview-open');

    const iframe = document.getElementById('previewIframe');
    if (iframe) {
        iframe.src = '';
    }

    currentPreviewUrl = '';
    if (openInNewTabBtn) {
        openInNewTabBtn.disabled = true;
    }
}

function loadJobPreview(jobId) {
    const job = jobsObj.find((entry) => entry.id === jobId);

    if (job && job.previewUrl) {
        showPreviewOverlay(job);
    } else {
        console.warn(`Keine Vorschau-URL für Job-ID "${jobId}" hinterlegt.`);
    }
}

const jobDisplay = document.getElementById('jobDisplay');

if (jobDisplay) {
    jobDisplay.addEventListener('click', (event) => {
        const item = event.target.closest('.job-list-item');
        if (!item) return;

        event.preventDefault();

        const jobList = jobDisplay.closest('.job-list');
        if (jobList?.classList.contains('edit-mode')) {
            return;
        }

        const jobId = item.dataset.id;
        if (jobId) {
            loadJobPreview(jobId);
        }
    });
}

if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', hidePreviewOverlay);
}

if (openInNewTabBtn) {
    openInNewTabBtn.addEventListener('click', () => {
        if (currentPreviewUrl) {
            window.open(currentPreviewUrl, '_blank');
        }
    });
}