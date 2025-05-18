// Author's Atlas Main App (SPA)

import { renderDashboard } from './views/dashboard.js';
import { renderProjectWorkspace } from './views/projectWorkspace.js';
import { applyTheme, detectInitialTheme } from './ui/theme.js';

const AppState = {
  view: 'home',
  selectedProjectId: null,
  selectedProjectSection: null,
  projectsIndex: [],
  loadedProjects: {},
};

function route() {
  const hash = window.location.hash || '';
  // / = home
  if (!hash || hash === '#/') {
    AppState.view = 'home';
    AppState.selectedProjectId = null;
    AppState.selectedProjectSection = null;
    renderView();
    setActiveNav('home');
  } else if (hash.startsWith('#/project/')) {
    const parts = hash.split('/');
    const projectId = parts[2];
    const sectionId = parts[3] || 'snapshot';
    if (projectId) {
      AppState.view = 'project';
      AppState.selectedProjectId = projectId;
      AppState.selectedProjectSection = sectionId;
      renderView();
      setActiveNav('project');
    } else {
      window.location.hash = '#/';
    }
  } else {
    window.location.hash = '#/';
  }
}

function renderView() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (AppState.view === 'home') {
    renderDashboard(app, AppState);
  } else if (AppState.view === 'project' && AppState.selectedProjectId) {
    renderProjectWorkspace(app, AppState, AppState.selectedProjectId, AppState.selectedProjectSection);
  }
}

// LocalStorage/Project util functions unchanged
function getProjectsIndex() {
  try {
    const data = localStorage.getItem('authorsAtlas_index');
    if (data) {
      return JSON.parse(data);
    } 
  } catch (e) {
    console.error('Project index parse error', e);
  }
  return [];
}
function updateProjectsIndex(arr) {
  try {
    localStorage.setItem('authorsAtlas_index', JSON.stringify(arr));
    return true;
  } catch (e) {
    alert('Could not save to localStorage. Try clearing space or exporting data.');
    return false;
  }
}
function getProjectById(projectId) {
  try {
    const data = localStorage.getItem('authorsAtlas_project_' + projectId);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    alert('Failed to load project (might be corrupted or too large).');
    return null;
  }
}
function saveProjectData(projectId, projectObj) {
  try {
    // Ensure lastModified is updated
    projectObj.lastModified = Date.now();
    localStorage.setItem('authorsAtlas_project_' + projectId, JSON.stringify(projectObj));
    return true;
  } catch (e) {
    alert('Could not save project data (possible storage quota exceeded). Export your data and try clearing space.');
    return false;
  }
}
function exportProject(projectId) {
  const pdata = getProjectById(projectId);
  if (!pdata) {
    alert('Could not load project for export.');
    return;
  }
  const fileData = {
    "_meta": {
      "app": "authors-atlas",
      "format": "atlas",
      "version": "1.0.0",
      "exported": new Date().toISOString()
    },
    "project": pdata
  };
  const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: "application/json" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${pdata.title ? pdata.title.replace(/[^a-z0-9_\-]/gi, '_').slice(0,50) : 'authors_atlas_project'}.atlas`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, 150);
}
function importProject(file, cb) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !data.project || !data.project.id) {
        alert('Not a valid Atlas project file.');
        cb && cb(false);
        return;
      }
      let pid = data.project.id;
      let exists = !!getProjectById(pid);
      let newPid = pid;
      if (exists) {
        if (!confirm('A project with this ID already exists. Import as a copy?')) {
          cb && cb(false);
          return;
        }
        newPid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        data.project.id = newPid;
        data.project.title = `${data.project.title || 'Untitled'} (Copy)`;
      }
      localStorage.setItem('authorsAtlas_project_' + newPid, JSON.stringify(data.project));
      let idx = getProjectsIndex();
      if (!idx.includes(newPid)) { idx.push(newPid);}
      updateProjectsIndex(idx);
      cb && cb(true, newPid);
    } catch (e) {
      alert('Error importing file: ' + e);
      cb && cb(false);
    }
  };
  reader.onerror = () => {
    alert('Error reading project file.');
    cb && cb(false);
  };
  reader.readAsText(file);
}

// NAV bar active state
function setActiveNav(view) {
  document.querySelectorAll('.topnav__link').forEach(el => el.classList.remove('topnav__link--active'));
  if (view === "home") {
    document.getElementById('nav-home')?.classList.add('topnav__link--active');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  detectInitialTheme();
  document.getElementById('themeToggle').addEventListener('click', applyTheme);

  // Routing
  window.addEventListener('hashchange', route);
  AppState.projectsIndex = getProjectsIndex();
  route();

  // Accessibility: focus to main container after SPA navigation
  window.addEventListener('hashchange', () => {
    requestAnimationFrame(() => {
      document.getElementById('app').focus();
    });
  });
});

export {
  AppState,
  getProjectsIndex,
  updateProjectsIndex,
  getProjectById,
  renderView,
  saveProjectData,
  exportProject,
  importProject,
  setActiveNav
};