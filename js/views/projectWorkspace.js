// Project Workspace View - Project Stories (Manuscripts) Card View

import { getProjectById, saveProjectData, renderView } from '../app.js';

// Declare Quill instance variable outside functions to manage its lifecycle
let quillEditorInstance = null;
let storyQuillInstance = null; // Add instance for story editor

function renderProjectWorkspace(app, AppState, projectId) {
  const pdata = getProjectById(projectId);
  if (!pdata) {
    app.innerHTML = `<div class="alert alert--error">Could not load this project.</div>`;
    return;
  }
  // Ensure stories array exists
  if (!Array.isArray(pdata.stories)) pdata.stories = [];
  // Ensure characters array exists at the project level
  if (!Array.isArray(pdata.characters)) pdata.characters = [];
  // Ensure primer field exists
  if (typeof pdata.primer === 'undefined') pdata.primer = '';

  // --- Project-level stats ---
  const totalWords = pdata.stories.reduce((sum, s) => sum + wordCount(s.manuscript), 0);
  const numStories = pdata.stories.length;
  const avgWords = numStories ? Math.round(totalWords / numStories) : 0;

  app.innerHTML = `
    <div class="projectstories__wrapper main-content-wrapper">
      <div class="projectstories__header">
        <div class="projectstories__header-main">
          <h1 class="projectstories__title">
            ${escapeHTML(pdata.title)}
          </h1>
          <div class="projectstats-row">
              <span style="color:var(--color-text-muted);font-size:1em;"><svg width="16" height="16" style="vertical-align:middle;margin-bottom:2px;margin-right:2px;" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="var(--color-primary-accent)" stroke-width="2"/><text x="8" y="12" text-anchor="middle" font-size="8" fill="var(--color-primary-accent)" font-family="monospace">${numStories}</text></svg> <b>${numStories}</b> stor${numStories === 1 ? 'y' : 'ies'}</span>
              <span style="color:var(--color-primary);font-size:1em;"><svg width="16" height="16" style="vertical-align:middle;margin-bottom:2px;margin-right:2px;" viewBox="0 0 16 16" fill="none"><path d="M2 12.5v-9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" stroke="var(--color-primary)" stroke-width="1.7" fill="none"/><path d="M4 4h8M4 8h8M4 12h3" stroke="var(--color-primary-accent)" stroke-width="1.3"/></svg> <b>${totalWords}</b> total words</span>
              <span style="color:var(--color-primary-accent);font-size:1em;"><svg width="16" height="16" style="vertical-align:middle;margin-bottom:2px;margin-right:2px;" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="var(--color-border)" stroke-width="2"/><text x="8" y="12" text-anchor="middle" font-size="8" fill="var(--color-primary-accent)" font-family="monospace">${avgWords}</text></svg> ~<b>${avgWords}</b> avg/story</span>
          </div>
        </div>
        <div class="projectstories__header-actions">
           <button class="btn btn--neutral" id="projectPrimerBtn" title="View/Edit Project Primer">
             <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:4px;"><path d="M4 2C4 1.44772 4.44772 1 5 1H11C11.5523 1 12 1.44772 12 2V14C12 14.5523 11.5523 15 11 15H5C4.44772 15 4 14.5523 4 14V2Z" stroke="var(--color-primary)" stroke-width="1.5"/><path d="M7 4H9" stroke="var(--color-primary-accent)" stroke-width="1.5" stroke-linecap="round"/><path d="M6 7H10" stroke="var(--color-primary-accent)" stroke-width="1.5" stroke-linecap="round"/><path d="M6 10H10" stroke="var(--color-primary-accent)" stroke-width="1.5" stroke-linecap="round"/></svg>
            Project Primer
          </button>
          <div>
            <button class="btn btn--primary" id="addStoryBtn" style="font-size:1em;">+ Add New Story</button>
            <button class="btn btn--neutral" id="editProjectCharsBtn" title="Edit Characters for Project" style="font-size:1em;">
              <svg width="15" height="15" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="6" stroke="var(--color-primary)" stroke-width="1.4" fill="none"/><path d="M10 10l2.5 2.5" stroke="var(--color-primary-accent)" stroke-width="1.2"/></svg>
              Edit Project Characters
            </button>
           </div>
        </div>
      </div>
      <section class="projectstories__cards-section">
        <h2 class="projectstories__subtitle" style="margin:0 0 1em 0;">Stories</h2>
        <ul class="projectstories__list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:2em 1.1em;list-style:none;padding:0;margin:0;" id="projectStoriesList">
          ${
            pdata.stories.length === 0
            ? `<li class="projectstories__empty" style="color:var(--color-text-muted);font-size:1.14em;padding:1.5em 0;"><em>No stories yet. Click "Add New Story" to begin.</em></li>`
            : pdata.stories.map(story => {
              const wc = wordCount(story.manuscript || '');
              return `
              <li class="projectstories__card" data-story-id="${story.id}" tabindex="0" style="background:var(--color-surface);border:1.5px solid var(--color-border);border-radius:15px;padding:2em 1.1em 1.1em 1.1em;box-shadow:0 1px 10px 0 rgba(60,80,150,0.05);position:relative;transition:.13s box-shadow,.13s border-color;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.8em;gap:1em;">
                  <div>
                    <h3 class="projectstories__card-title" style="margin:0 0 0.18em 0;font-size:1.19em;color:var(--color-primary);font-weight:650;">${escapeHTML(story.title || '(Untitled Story)')}</h3>
                    <div style="display:flex;align-items:center;gap:1.4em;color:var(--color-text-muted);margin-bottom:0.16em;font-size:.99em;flex-wrap:wrap;">
                      <span><svg width="14" height="14" style="vertical-align:middle;margin-right:2px;" viewBox="0 0 16 16"><path d="M4 4h8M4 8h8M4 12h3" stroke="var(--color-primary-accent)" stroke-width="1.1" /></svg> <b>${wc}</b> words</span>
                    </div>
                    <div class="projectstories__desc" style="font-size:1em;color:var(--color-text-muted);margin-bottom:0.15em;">
                      ${story.description ? escapeHTML(story.description) : '<i>No description</i>'}
                    </div>
                  </div>
                  <span>
                    <button class="btn btn--transparent btn--sm projectstories__card-edit" title="Edit Story Details" aria-label="Edit Story Details">
                      <svg width="20" height="20" viewBox="0 0 16 16"><path d="M3 12.7V13h.3l8.1-8.1-1.4-1.4L3 12.7zm9.4-7.4c.2-.2.2-.5 0-.7l-1-1a.5.5 0 0 0-.7 0l-1 1 1.7 1.7 1-1z" fill="var(--color-primary-accent)"/></svg>
                    </button>
                    <button class="btn btn--danger btn--icon btn--sm projectstories__card-delete" title="Delete Story" aria-label="Delete Story">
                      <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="var(--color-warning)" stroke-width="2" stroke-linecap="round"/></svg>
                    </button>
                  </span>
                </div>
                <div class="projectstories__card-chars" style="margin-top:0.55em;">
                  <span style="color:var(--color-primary);font-weight:520;">${(story.characterIds?.length || 0)} character${(story.characterIds?.length||0)==1?'':'s'}</span>
                  <button class="btn btn--neutral btn--sm projectstories__card-charsedit" title="Edit Characters for Story" aria-label="Edit Characters" style="margin-left:.6em;">
                    <svg width="15" height="15" viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="6" stroke="var(--color-primary)" stroke-width="1.4" fill="none"/><path d="M10 10l2.5 2.5" stroke="var(--color-primary-accent)" stroke-width="1.2"/></svg>
                    <span style="font-size:0.93em">Edit Characters</span>
                  </button>
                </div>
                <div class="projectstories__card-view" style="margin-top:1.1em;">
                  <button class="btn btn--primary btn--sm projectstories__card-viewbtn" title="View Manuscript" aria-label="View Manuscript" style="min-width:110px;">View Manuscript</button>
                </div>
              </li>
              `}).join('')
          }
        </ul>
      </section>
      <dialog class="modal" id="storyModal"></dialog>
      <dialog class="modal" id="charactersModal"></dialog>
      <dialog class="modal" id="viewManuscriptModal" style="max-width:900px;"></dialog>
      <dialog class="modal" id="projectPrimerModal"></dialog>
    </div>
  `;

  // --- Modals ---
  const storyModal = app.querySelector('#storyModal');
  const charactersModal = app.querySelector('#charactersModal');
  const viewManuscriptModal = app.querySelector('#viewManuscriptModal');
  const projectPrimerModal = app.querySelector('#projectPrimerModal');

  // --- Add Story ---
  app.querySelector('#addStoryBtn').onclick = () => {
    showStoryEditModal({title: 'Add New Story', story: null, onSave: (story) => {
      story.id = makeId();
      story.characterIds = [];
      pdata.stories.push(story);
      saveProjectData(projectId, pdata);
      storyModal.close();
      renderView(); // Re-render to show the new card
    }});
  };

  // --- Edit Project Characters ---
  app.querySelector('#editProjectCharsBtn').onclick = () => {
    showProjectCharactersModal();
  };

  // --- Project Primer ---
  app.querySelector('#projectPrimerBtn').onclick = () => {
    showProjectPrimerModal();
  };

  // --- Edit/Delete/View handlers for Cards ---
  app.querySelectorAll('.projectstories__card').forEach(card => {
    const storyId = card.getAttribute('data-story-id');

    // Edit Story Details (Title/Desc/Manuscript)
    card.querySelector('.projectstories__card-edit').onclick = (e) => {
      e.stopPropagation();
      const story = pdata.stories.find(s => s.id === storyId);
      showStoryEditModal({title: 'Edit Story Details', story, onSave: (updated) => {
        Object.assign(story, updated);
        saveProjectData(projectId, pdata);
        storyModal.close();
        renderView(); // Re-render card with updates
      }});
    };

    // Delete Story
    card.querySelector('.projectstories__card-delete').onclick = (e) => {
      e.stopPropagation();
      if (!confirm('Delete this story? This cannot be undone.')) return;
      pdata.stories = pdata.stories.filter(s => s.id !== storyId);
      saveProjectData(projectId, pdata);
      renderView(); // Re-render without deleted card
    };

    // View Manuscript
    card.querySelector('.projectstories__card-viewbtn').onclick = (e) => {
      e.stopPropagation();
      const story = pdata.stories.find(s => s.id === storyId);
      showManuscriptReadView(story);
    };

    // Characters for Story (characterIds array)
    card.querySelector('.projectstories__card-charsedit').onclick = (e) => {
      e.stopPropagation();
      const story = pdata.stories.find(s => s.id === storyId);
      showCharactersForStoryModal(story);
    };

    // Card click navigates to view (unless button pressed)
    card.onclick = (e) => {
      if (e.target.closest('button')) return;
      const story = pdata.stories.find(s => s.id === storyId);
      showManuscriptReadView(story);
    };
    card.onkeydown = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === card) {
        const story = pdata.stories.find(s => s.id === storyId);
        showManuscriptReadView(story);
      }
    };
  });

  // --- Modals: story edit (Title/Desc/Manuscript) ---
  function showStoryEditModal({title, story, onSave}) {
    storyModal.innerHTML = `
      <form class="modal__form" id="storyForm">
        <button type="button" class="dialog__backdrop-close" aria-label="Close" title="Close">&times;</button>
        <h3>${escapeHTML(title)}</h3>
        <label>
          Title <input name="title" type="text" required maxlength="120" value="${story ? escapeHTMLValue(story.title) : ''}" autofocus autocomplete="off"/>
        </label>
        <label>
          Description
          <textarea name="description" maxlength="300" rows="3" style="resize:vertical;width:100%">${story ? escapeHTMLValue(story.description) : ''}</textarea>
        </label>
        <label>
          Manuscript
        </label>
        <div id="manuscriptEditor" class="manuscript-editor-container"></div>
        <div class="modal__actions">
          <button class="btn btn--primary" type="submit">Save</button>
          <button class="btn btn--neutral" type="button" id="storyCancelBtn">Cancel</button>
        </div>
      </form>
    `;
    storyModal.showModal();
    // Initialize Quill for Manuscript
    storyQuillInstance = new Quill('#manuscriptEditor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'script': 'sub'}, { 'script': 'super' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'color': [] }, { 'background': [] }],
          ['link'],
          ['clean']
        ]
      }
    });
    if (story?.manuscript) {
      storyQuillInstance.clipboard.dangerouslyPasteHTML(0, story.manuscript);
    }
    const form = storyModal.querySelector('#storyForm');
    storyModal.querySelector('#storyCancelBtn').onclick = () => storyModal.close();
    storyModal.querySelector('.dialog__backdrop-close').onclick = () => storyModal.close();
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      onSave({
        ...(story || {}),
        title: fd.get('title').trim(),
        description: fd.get('description').trim(),
        manuscript: storyQuillInstance.root.innerHTML, // Get HTML content
      });
    };

    // Cleanup Quill on close
    storyModal.addEventListener('close', () => {
      storyQuillInstance = null;
      // Optional: Clear the modal's innerHTML to prevent ID conflicts if re-opened quickly
      // storyModal.innerHTML = '';
    }, { once: true });
  }

  // --- Project Primer Modal ---
  function showProjectPrimerModal(editMode = false) {
    const primerContent = pdata.primer || '';

    projectPrimerModal.innerHTML = `
      <div class="modal__form" id="primerViewContainer">
        <button type="button" class="dialog__backdrop-close" aria-label="Close" title="Close">&times;</button>
        <h3>Project Primer: ${escapeHTML(pdata.title)}</h3>

        <div id="primerContentArea" style="margin-bottom:1em;">
          ${ editMode ? `
            <div id="primerEditor" class="primer-editor-container"></div>
          ` : `
            <div class="primer-view-content">
              ${primerContent ? primerContent : '<em>No primer content yet. Click Edit to add some.</em>'}
            </div>
          `}
        </div>

        <div class="modal__actions">
          ${ editMode ? `
            <button class="btn btn--primary" id="savePrimerBtn">Save Primer</button>
            <button class="btn btn--neutral" id="cancelPrimerEditBtn">Cancel Edit</button>
          ` : `
            <button class="btn btn--primary" id="editPrimerBtn">Edit Primer</button>
            <button class="btn btn--neutral" id="copyPrimerBtn" ${!primerContent ? 'disabled' : ''}>Copy Primer</button>
            <button class="btn btn--neutral" type="button" id="closePrimerBtn">Close</button>
          `}
        </div>
      </div>
    `;

    projectPrimerModal.querySelector('.dialog__backdrop-close').onclick = () => projectPrimerModal.close();

    if (editMode) {
      // Initialize Quill
      quillEditorInstance = new Quill('#primerEditor', {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean']
          ]
        }
      });
      if (primerContent) {
        // Attempt to set contents, assuming HTML format for simplicity
        quillEditorInstance.clipboard.dangerouslyPasteHTML(0, primerContent);
      }

      projectPrimerModal.querySelector('#savePrimerBtn').onclick = () => {
        pdata.primer = quillEditorInstance.root.innerHTML; // Get HTML content
        saveProjectData(projectId, pdata);
        quillEditorInstance = null; // Clean up instance
        showProjectPrimerModal(false); // Switch back to view mode
      };
      projectPrimerModal.querySelector('#cancelPrimerEditBtn').onclick = () => {
        quillEditorInstance = null; // Clean up instance
        showProjectPrimerModal(false); // Switch back to view mode without saving
      };

    } else {
      // Primer View Mode handlers
      projectPrimerModal.querySelector('#editPrimerBtn').onclick = () => {
         showProjectPrimerModal(true); // Re-render modal in edit mode
      };
      projectPrimerModal.querySelector('#copyPrimerBtn').onclick = () => {
        // Create a temporary element to get text content
        const tempEl = document.createElement('div');
        tempEl.innerHTML = pdata.primer || '';
        navigator.clipboard.writeText(tempEl.textContent || '').then(() => {
           alert('Primer content copied to clipboard!');
        }).catch(err => {
           console.error('Failed to copy primer text:', err);
           alert('Could not copy text.');
        });
      };
      projectPrimerModal.querySelector('#closePrimerBtn').onclick = () => projectPrimerModal.close();
    }

    // Ensure focus management works
    projectPrimerModal.addEventListener('keydown', trapFocus);
    projectPrimerModal.showModal();
    // Set initial focus
    if (editMode && quillEditorInstance) {
       quillEditorInstance.focus();
    } else if (!editMode) {
       projectPrimerModal.querySelector('#editPrimerBtn')?.focus();
    }
  }

  // --- Project Characters Modal (edit project-wide pool) ---
  function showProjectCharactersModal() {
    charactersModal.innerHTML = `
      <div class="modal__form">
         <button type="button" class="dialog__backdrop-close" aria-label="Close" title="Close">&times;</button>
        <h3>Edit Project Characters (${pdata.characters?.length || 0})</h3>
        <div style="margin-bottom:1em;">
          <button class="btn btn--primary" type="button" id="addCharBtn">+ Add Character</button>
        </div>
        <ul class="characters-list" style="list-style:none;padding:0;margin:0;max-height:220px;overflow-y:auto; border: 1px solid var(--color-border); border-radius:var(--border-radius-base); padding: var(--space-s);">
          ${
            pdata.characters?.length
              ? pdata.characters.map((c, idx) => `
                <li style="margin-bottom:.6em;padding:.3em .4em;border-radius:8px;background:var(--color-bg-alt);display:flex;align-items:flex-start;justify-content:space-between; cursor:pointer;" data-idx="${idx}">
                  <div>
                    <b>${escapeHTML(c.name || '(No Name)')}</b>
                    <div style="font-size:0.98em;color:var(--color-text-muted);">${escapeHTML(c.role || '')}</div>
                  </div>
                  <button class="btn btn--danger btn--icon btn--sm delCharBtn" data-idx="${idx}" title="Delete Character"><svg width="14" height="14" viewBox="0 0 16 16"><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="var(--color-warning)" stroke-width="2" stroke-linecap="round"/></svg></button>
                </li>
              `).join('')
              : `<li style="color:var(--color-text-muted);"><em>No characters yet.</em></li>`
          }
        </ul>
        <div class="modal__actions" style="margin-top:1em;"><button class="btn btn--neutral" type="button" id="closeCharsBtn">Close</button></div>
      </div>
    `;
    charactersModal.showModal();
    charactersModal.querySelector('#closeCharsBtn').onclick = () => charactersModal.close();
    charactersModal.querySelector('.dialog__backdrop-close').onclick = () => charactersModal.close();

    // Add Character
    charactersModal.querySelector('#addCharBtn').onclick = () => {
      showProjectCharacterEditDialog(null, () => showProjectCharactersModal());
    };
    // Delete
    charactersModal.querySelectorAll('.delCharBtn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation(); // Prevent li click event
        const idx = +btn.getAttribute('data-idx');
        // Check whether this character is used in any story, and warn
        let characterId = pdata.characters[idx]?.id;
        let usedInStories = [];
        if (characterId) {
          pdata.stories.forEach(s => {
            if (Array.isArray(s.characterIds) && s.characterIds.includes(characterId)) {
              usedInStories.push(s.title || '(Untitled Story)');
            }
          });
        }

        let confirmMsg = 'Are you sure you want to delete this character?';
        if (usedInStories.length > 0) {
          confirmMsg += `\n\nWarning: This character is assigned to the following stor${usedInStories.length > 1 ? 'ies' : 'y'}:\n- ${usedInStories.join('\n- ')}\n\nDeleting the character will remove them from these stories. This cannot be undone.`;
        }

        if (!confirm(confirmMsg)) return;

        pdata.characters.splice(idx,1);
        // Remove from stories' characterIds
        if (characterId) {
          for (const s of pdata.stories) {
            if (Array.isArray(s.characterIds)) {
              s.characterIds = s.characterIds.filter(cid => cid !== characterId);
            }
          }
        }
        saveProjectData(projectId, pdata);
        showProjectCharactersModal(); // Refresh the list
        renderView(); // Refresh underlying view to update story cards if needed
      };
    });
    // Edit (click on character list item)
    charactersModal.querySelectorAll('li[data-idx]').forEach(li => {
      li.onclick = (e) => {
        if (e.target.closest('.delCharBtn')) return;
        const idx = +li.getAttribute('data-idx');
        if (!pdata.characters[idx]) return;
        showProjectCharacterEditDialog(idx, () => showProjectCharactersModal());
      };
    });
  }

  // Project Character Edit/Add Modal
  function showProjectCharacterEditDialog(charIdx, onDone) {
    const char = charIdx !== null && charIdx !== undefined ? pdata.characters[charIdx] : null;
    charactersModal.innerHTML = `
      <form class="modal__form" id="editCharForm">
        <h3>${char ? 'Edit' : 'Add'} Project Character</h3>
        <label>Name <input name="name" type="text" maxlength="80" required value="${char ? escapeHTMLValue(char.name) : ''}" autofocus autocomplete="off"/></label>
        <label>Role <input name="role" type="text" maxlength="60" value="${char ? escapeHTMLValue(char.role) : ''}" autocomplete="off" /></label>
        <label>Notes <textarea name="notes" maxlength="220" rows="2" style="resize:vertical;width:100%">${char ? escapeHTMLValue(char.notes) : ''}</textarea></label>
        <div class="modal__actions">
          <button class="btn btn--primary" type="submit">Save</button>
          <button class="btn btn--neutral" type="button" id="editCharCancelBtn">Cancel</button>
        </div>
      </form>
    `;
    const form = charactersModal.querySelector('#editCharForm');
    charactersModal.querySelector('#editCharCancelBtn').onclick = () => showProjectCharactersModal();
    form.onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(form);
      const updated = {
        id: char ? char.id : makeId(),
        name: fd.get('name').trim(),
        role: fd.get('role').trim(),
        notes: fd.get('notes').trim(),
      };
      if (char) {
        Object.assign(char, updated);
      } else {
        (pdata.characters ||= []).push(updated);
      }
      saveProjectData(projectId, pdata);
      onDone && onDone();
    };
    charactersModal.showModal();
  }

  // --- Characters for Story: From Pool ---
  function showCharactersForStoryModal(story) {
    // Array of {id, name,...} in pdata.characters
    // story.characterIds is an array of character ids assigned to this story
    const charIds = Array.isArray(story.characterIds) ? story.characterIds : [];
    charactersModal.innerHTML = `
      <form class="modal__form" id="assignCharsForm">
        <h3>Assign Characters to <span style="font-weight:bold">${escapeHTML(story.title||'Story')}</span></h3>
        <div style="margin-bottom:1.2em;">Select from all project characters:</div>
        <ul class="characters-list" style="list-style:none;padding:0;margin:0;max-height:220px;overflow-y:auto;">
          ${
            pdata.characters.length
              ? pdata.characters.map((c, idx) => `
                <li style="display:flex;align-items:center;margin-bottom:.65em;">
                  <label style="display:flex;align-items:center;cursor:pointer;gap:.7em;flex:1;">
                    <input type="checkbox" name="charId" value="${c.id}" ${charIds.includes(c.id) ? 'checked' : ''} style="margin-right:.7em"/>
                    <b>${escapeHTML(c.name || '(No Name)')}</b>
                    <span style="color:var(--color-text-muted);font-size:0.97em;padding-left:.4em">${escapeHTML(c.role || '')}</span>
                  </label>
                </li>
              `).join('')
              : `<li style="color:var(--color-text-muted);"><em>No project characters yet. Add some first!</em></li>`
          }
        </ul>
        <div class="modal__actions" style="margin-top:1em;"><button type="submit" class="btn btn--primary">Save</button>
        <button class="btn btn--neutral" type="button" id="closeCharModalBtn">Cancel</button></div>
      </form>
    `;
    charactersModal.showModal();
    charactersModal.querySelector('#closeCharModalBtn').onclick = () => charactersModal.close();
    charactersModal.querySelector('#assignCharsForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const selected = fd.getAll('charId');
      story.characterIds = selected;
      saveProjectData(projectId, pdata);
      charactersModal.close();
      renderView();
    }
  }

  // --- Simple Manuscript Text View/Modal (Read Only) ---
  function showManuscriptReadView(story) {
    // We want to show character names for this story using characterIds lookup
    let assignedNames =
      (story.characterIds || [])
        .map(charId => {
          let c = pdata.characters.find(character => character.id === charId);
          return c ? escapeHTML(c.name) : "";
        })
        .filter(Boolean)
        .join(', ');
    assignedNames = assignedNames || '—';

    viewManuscriptModal.innerHTML = `
      <div class="manuscript-view__modal-content">
        <button class="dialog__backdrop-close" aria-label="Close" title="Close">&times;</button>
        <header class="manuscript-view__header">
          <h2 class="manuscript-view__title">${escapeHTML(story.title || '(Untitled Story)')}</h2>
          <p class="manuscript-view__description">${escapeHTML(story.description || '')}</p>
          <div class="manuscript-view__meta">
            <span><b>Word Count:</b> ${wordCount(story.manuscript || '')}</span>
            <span><b>Characters:</b> ${assignedNames}</span>
          </div>
        </header>
        <hr class="manuscript-view__separator">
        <div class="manuscript-view__text-container" tabindex="0">
          <div class="manuscript-view__text">
            ${story.manuscript || '<p><em>(No manuscript text)</em></p>'}
          </div>
        </div>
        <footer class="manuscript-view__footer">
          <button class="btn btn--primary" type="button" id="closeManuscriptModal">Close</button>
        </footer>
      </div>
    `;
    let closeModal = () => viewManuscriptModal.close();
    viewManuscriptModal.querySelector('#closeManuscriptModal').onclick = closeModal;
    viewManuscriptModal.querySelector('.dialog__backdrop-close').onclick = closeModal;

    // Allow escape and click outside modal to close
    viewManuscriptModal.addEventListener('cancel', closeModal, { once: true });
    viewManuscriptModal.addEventListener('click', function(e) {
      if (e.target === viewManuscriptModal) closeModal();
    });
    // Escape key
    viewManuscriptModal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });

    // Ensure focus is trapped within the modal and set initial focus
    viewManuscriptModal.addEventListener('keydown', trapFocus);
    viewManuscriptModal.showModal();
    // Focus the text container initially for scrolling
    viewManuscriptModal.querySelector('.manuscript-view__text-container').focus();
  }

  // Focus trapping function for modals
  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const modal = event.currentTarget; // The dialog element

    const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
    const focusableContent = modal.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    if (event.shiftKey) { // if shift + tab
      if (document.activeElement === firstFocusableElement) {
        lastFocusableElement.focus();
        event.preventDefault();
      }
    } else { // if tab
      if (document.activeElement === lastFocusableElement) {
        firstFocusableElement.focus();
        event.preventDefault();
      }
    }
  }
}

// --- Utils ---
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
function escapeHTMLValue(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/[<>&']/g, c => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&#39;'
  })[c]);
}
function wordCount(htmlString) {
  if (!htmlString) return 0;
  // Create a temporary element to extract text
  const tempEl = document.createElement('div');
  tempEl.innerHTML = htmlString; // Insert the HTML
  const text = tempEl.textContent || tempEl.innerText || ''; // Extract text content
  return (text.match(/\b\w+\b/g) || []).length; // Count words in the extracted text
}
function makeId() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export { renderProjectWorkspace };