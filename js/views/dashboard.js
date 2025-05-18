// Home View: Project List and Add Project

import { getProjectsIndex, getProjectById, updateProjectsIndex, renderView, saveProjectData, importProject, exportProject } from '../app.js';

function wordCount(str) {
  if (!str) return 0;
  return (str.match(/\b\w+\b/g) || []).length;
}

function renderDashboard(app, AppState) {
  app.innerHTML = `
    <div class="main-content-wrapper dashboard__main paradise-bg">
      <section class="dashboard__intro print-theme-box">
        <h1 class="dashboard__title">Author's Atlas</h1>
        <p class="dashboard__lead">Your serene workspace for managing all your stories, worlds, and characters.</p>
        <p class="dashboard__lead-2">
          Keep track of multiple stories, assign characters, and export your whole project as a <code>.atlas</code> file anytime. 
          All work is stored privately in your browser.
        </p>
      </section>
      <section class="dashboard__projects">
        <div class="dashboard__projects-header">
          <h2 class="dashboard__projects-title">Your Projects</h2>
          <div style="display:flex;gap:1em;">
            <button class="btn btn--primary" id="newProjectBtn">+ New Project</button>
            <button class="btn btn--neutral" id="atlasImportBtnHome">Import Project</button>
            <input type="file" id="atlasImportFileHome" style="display:none" accept=".atlas,.json,application/json"/>
          </div>
        </div>
        <ul class="dashboard__projects-list" id="projectsList"></ul>
        <div class="dashboard__no-projects" id="noProjects" hidden>
          <p><em>You have no projects yet. Start by creating one!</em></p>
        </div>
      </section>
      <dialog class="modal" id="newProjectModal">
        <form id="newProjectForm" class="modal__form print-theme-box">
          <h3>Create New Project</h3>
          <label>
            Title
            <input name="title" type="text" required maxlength="80" autofocus autocomplete="off"/>
          </label>
          <div class="modal__actions">
            <button class="btn btn--primary" type="submit">Create</button>
            <button class="btn btn--neutral" type="button" id="cancelNewProject">Cancel</button>
          </div>
        </form>
      </dialog>
    </div>
  `;
  // Project List
  const projectsList = document.getElementById('projectsList');
  const noProjects = document.getElementById('noProjects');
  const index = getProjectsIndex();
  if (!index.length) {
    noProjects.hidden = false;
  } else {
    noProjects.hidden = true;
    index.forEach(pid => {
      const pdata = getProjectById(pid);
      if (!pdata) return;
      const numStories = pdata.stories ? pdata.stories.length : 0;
      let totalWords = 0;
      let avgWords = 0;
      if (Array.isArray(pdata.stories) && pdata.stories.length) {
        totalWords = pdata.stories.reduce((sum, s) => sum + wordCount(s.manuscript), 0);
        avgWords = Math.round(totalWords / pdata.stories.length);
      }
      const li = document.createElement('li');
      li.className = 'dashboard__project-card print-theme-box';
      li.innerHTML = `
        <div class="dashboard__project-main">
          <h3 class="dashboard__project-title">${escapeHTML(pdata.title)}</h3>
        </div>
        <div class="dashboard__project-meta">
          <span class="dashboard__meta-stories">
            <svg width="14" height="14" style="vertical-align:middle;margin-right:3px;" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="var(--color-primary)" stroke-width="2"/></svg>
            ${numStories} stor${numStories === 1 ? 'y' : 'ies'}
          </span>
          <span class="dashboard__meta-totalwords">
            <svg width="14" height="14" style="vertical-align:middle;margin-right:3px;" viewBox="0 0 16 16"><path d="M4 4h8M4 8h8M4 12h3" stroke="var(--color-primary-accent)" stroke-width="1.1"/></svg>
            ${totalWords} words
          </span>
          <span class="dashboard__meta-avgwords">
            <svg width="14" height="14" style="vertical-align:middle;margin-right:3px;" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="var(--color-border)" stroke-width="2"/></svg>
            ~${avgWords} avg/story
          </span>
        </div>
        <div class="dashboard__project-actions">
          <button class="btn btn--neutral dashboard__project-export" data-id="${pid}" title="Export project .atlas" aria-label="Export Project">
            <svg width="18" height="18" viewBox="0 0 18 18" style="vertical-align:-2px;">
              <g stroke="var(--color-primary)" stroke-width="2" fill="none"><circle cx="9" cy="9" r="7"></circle><path d="M9 5v6M6.5 8.5L9 11l2.5-2.5"></path></g>
            </svg>
            Export
          </button>
          <button class="btn btn--danger dashboard__project-delete" data-id="${pid}" title="Delete project" aria-label="Delete Project">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="var(--color-warning)" stroke-width="2" stroke-linecap="round"/></svg>
            <span class="sr-only">Delete</span>
          </button>
        </div>
      `;
      li.addEventListener('click', (e) => {
        if (e.target.closest('.dashboard__project-delete') || e.target.closest('.dashboard__project-export')) return;
        window.location.hash = `#/project/${pid}`;
      });
      projectsList.appendChild(li);
    });

    // Attach per-project export
    app.querySelectorAll('.dashboard__project-export').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.dataset.id;
        if (!pid) return;
        exportProject(pid);
      });
    });

    // Delete
    app.querySelectorAll('.dashboard__project-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = btn.dataset.id;
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
          try {
            localStorage.removeItem('authorsAtlas_project_' + pid);
            const idx = getProjectsIndex().filter(id => id !== pid);
            updateProjectsIndex(idx);
            renderView();
          } catch(err){}
        }
      });
    });
  }

  // New Project Modal Handling
  const newProjectModal = document.getElementById('newProjectModal');
  document.getElementById('newProjectBtn').onclick = () => {
    newProjectModal.showModal();
    newProjectModal.querySelector('input[name="title"]').focus();
  };
  document.getElementById('cancelNewProject').onclick = () => {
    newProjectModal.close();
  };
  document.getElementById('newProjectForm').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title').trim();
    if (!title) return;
    const pid = makeId();
    const now = Date.now();
    const pdata = {
      id: pid,
      title,
      createdAt: now,
      lastModified: now,
      stories: [],
    };
    try {
      localStorage.setItem('authorsAtlas_project_' + pid, JSON.stringify(pdata));
      const idx = getProjectsIndex();
      idx.push(pid);
      updateProjectsIndex(idx);
      newProjectModal.close();
      window.location.hash = `#/project/${pid}`;
    } catch (err) {
      alert('Failed to save new project (storage quota?)');
    }
  };

  // Import .atlas
  document.getElementById('atlasImportBtnHome').onclick = () => {
    document.getElementById('atlasImportFileHome').click();
  };
  document.getElementById('atlasImportFileHome').onchange = function(ev) {
    if (!this.files.length) return;
    importProject(this.files[0], (success, newPid) => {
      if (success) {
        renderView();
        alert('Import successful!');
      } else {
        alert('Import failed.');
      }
      this.value = '';
    });
  }
}

// Helper
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[<>&"']/g, c => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
}
function makeId() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export { renderDashboard };