// Global variables
let materialItems = [];
let currentFilter = 'all';
let draggedElement = null;
let editingItemId = null;

// Default materials templates 
const DEFAULT_MATERIALS = {
  ascension: {
    character: {
      4: [
        { name: 'Character EXP Material', required: 171, image: '', obtained: 0 },
        { name: 'Elemental Gem', required: 46, image: '', obtained: 0 },
        { name: 'Local Specialty', required: 168, image: '', obtained: 0 },
        { name: 'Common Enemy Drop', required: 18, image: '', obtained: 0 }
      ],
      5: [
        { name: 'Character EXP Material', required: 171, image: '', obtained: 0 },
        { name: 'Elemental Gem', required: 46, image: '', obtained: 0 },
        { name: 'Local Specialty', required: 168, image: '', obtained: 0 },
        { name: 'Common Enemy Drop', required: 18, image: '', obtained: 0 },
        { name: 'Boss Material', required: 46, image: '', obtained: 0 }
      ]
    },
    weapon: {
      4: [
        { name: 'Weapon EXP Material', required: 605, image: '', obtained: 0 },
        { name: 'Weapon Ascension Material', required: 15, image: '', obtained: 0 },
        { name: 'Common Enemy Drop', required: 23, image: '', obtained: 0 }
      ],
      5: [
        { name: 'Weapon EXP Material', required: 605, image: '', obtained: 0 },
        { name: 'Weapon Ascension Material', required: 15, image: '', obtained: 0 },
        { name: 'Elite Enemy Drop', required: 23, image: '', obtained: 0 },
        { name: 'Weekly Boss Material', required: 6, image: '', obtained: 0 }
      ]
    }
  },
  talent: [
    { name: 'Talent Book', required: 114, image: '', obtained: 0 },
    { name: 'Common Enemy Drop', required: 18, image: '', obtained: 0 },
    { name: 'Weekly Boss Material', required: 18, image: '', obtained: 0 },
    { name: 'Crown of Insight', required: 3, image: '', obtained: 0 }
  ]
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

function initializeApp() {
  loadFromLocalStorage();
  renderMaterials();
  setupEventListeners();
  setupDragAndDrop();
  setupFileInput();
  updateItemCounts();
  console.log('App initialized successfully');
}

// Load and save data
function loadFromLocalStorage() {
  const saved = localStorage.getItem('materialItems');
  if (saved) {
    try {
      materialItems = JSON.parse(saved);
      console.log('Data loaded from localStorage');
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      materialItems = [];
    }
  } else {
    materialItems = [];
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('materialItems', JSON.stringify(materialItems));
    console.log('Data saved to localStorage');
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// File input setup
function setupFileInput() {
  const fileInput = document.getElementById('imageFile');
  const fileLabel = document.querySelector('.file-input-label');
  const filePreview = document.getElementById('filePreview');
  const previewImage = document.getElementById('previewImage');
  const fileName = document.getElementById('fileName');

  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file (JPG, PNG, SVG, etc.)');
          fileInput.value = '';
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert('Image size should be less than 5MB');
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          previewImage.src = e.target.result;
          fileName.textContent = file.name;
          filePreview.style.display = 'block';
          fileLabel.classList.add('has-file');
          fileLabel.innerHTML = '<span>📷 Change Image</span>';
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Event listeners
function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderMaterials();
    });
  });

  // Add button
  const addButton = document.getElementById('addButton');
  if (addButton) {
    addButton.addEventListener('click', function() {
      showAddModal();
    });
  }

  // Modal events
  setupModalEvents();

  // Type change event for showing/hiding element selector and material options
  const typeSelect = document.getElementById('itemType');
  const elementSelect = document.getElementById('itemElement');
  const levelSelector = document.getElementById('levelSelector');
  const talentMaterialsLabel = document.getElementById('talentMaterialsLabel');

  if (typeSelect) {
    typeSelect.addEventListener('change', function() {
      if (this.value === 'character') {
        elementSelect.style.display = 'block';
        elementSelect.required = true;
        levelSelector.style.display = 'block';
        talentMaterialsLabel.style.display = 'block';
      } else if (this.value === 'weapon') {
        elementSelect.style.display = 'none';
        elementSelect.required = false;
        levelSelector.style.display = 'block';
        talentMaterialsLabel.style.display = 'none';
        document.getElementById('talentMaterials').checked = false;
      } else {
        elementSelect.style.display = 'none';
        levelSelector.style.display = 'none';
        talentMaterialsLabel.style.display = 'none';
      }
    });
  }
}

function setupModalEvents() {
  const modal = document.getElementById('addModal');
  const form = document.getElementById('addForm');
  const cancelBtn = document.getElementById('cancelButton');
  const editMaterialsModal = document.getElementById('editMaterialsModal');
  const saveMaterialsBtn = document.getElementById('saveMaterialsButton');
  const cancelMaterialsBtn = document.getElementById('cancelMaterialsButton');

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideAddModal);
  }

  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideAddModal();
      }
    });
  }

  if (editMaterialsModal) {
    editMaterialsModal.addEventListener('click', function(e) {
      if (e.target === editMaterialsModal) {
        hideEditMaterialsModal();
      }
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const fileInput = document.getElementById('imageFile');
      const previewImage = document.getElementById('previewImage');
      
      const itemData = {
        name: formData.get('name').trim(),
        type: formData.get('type'),
        rarity: parseInt(formData.get('rarity')),
        element: formData.get('element') || null,
        imageUrl: fileInput.files[0] ? previewImage.src : getDefaultImage(formData.get('type')),
        notes: formData.get('notes').trim(),
        currentLevel: formData.get('currentLevel') ? parseInt(formData.get('currentLevel')) : 1,
        targetLevel: formData.get('targetLevel') ? parseInt(formData.get('targetLevel')) : 90,
        includeAscension: formData.get('ascensionMaterials') === 'on',
        includeTalent: formData.get('talentMaterials') === 'on'
      };
      
      if (itemData.name && itemData.type && itemData.rarity) {
        if (editingItemId) {
          updateItem(itemData);
        } else {
          addItem(itemData);
        }
        hideAddModal();
        resetForm();
      } else {
        alert('Please fill in all required fields (Name, Type, Rarity)');
      }
    });
  }

  // Materials editor events
  if (saveMaterialsBtn) {
    saveMaterialsBtn.addEventListener('click', saveMaterialsChanges);
  }

  if (cancelMaterialsBtn) {
    cancelMaterialsBtn.addEventListener('click', hideEditMaterialsModal);
  }
}

function getDefaultImage(type) {
  if (type === 'character') {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="%23e5a6b2" cx="50" cy="50" r="40"/><text y="60" x="50" text-anchor="middle" fill="white" font-size="30">👤</text></svg>';
  } else {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5a6b2" width="100" height="100" rx="10"/><text y="60" x="50" text-anchor="middle" fill="white" font-size="30">⚔️</text></svg>';
  }
}

// Modal functions
function showAddModal(itemId = null) {
  const modal = document.getElementById('addModal');
  const modalTitle = document.getElementById('modalTitle');
  const submitButton = document.getElementById('submitButton');

  if (itemId) {
    editingItemId = itemId;
    const item = materialItems.find(item => item.id === itemId);
    if (item) {
      modalTitle.textContent = 'Edit Item';
      submitButton.textContent = 'Update Item';
      populateForm(item);
    }
  } else {
    editingItemId = null;
    modalTitle.textContent = 'Add New Item';
    submitButton.textContent = 'Add Item';
    resetForm();
  }

  modal.classList.add('show');
}

function hideAddModal() {
  const modal = document.getElementById('addModal');
  modal.classList.remove('show');
  editingItemId = null;
}

function populateForm(item) {
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemType').value = item.type;
  document.getElementById('itemRarity').value = item.rarity;
  document.getElementById('itemElement').value = item.element || '';
  document.getElementById('itemNotes').value = item.notes || '';
  document.getElementById('currentLevel').value = item.currentLevel || 1;
  document.getElementById('targetLevel').value = item.targetLevel || 90;
  document.getElementById('ascensionMaterials').checked = item.includeAscension !== false;
  document.getElementById('talentMaterials').checked = item.includeTalent || false;

  // Trigger type change event to show/hide fields
  const typeEvent = new Event('change');
  document.getElementById('itemType').dispatchEvent(typeEvent);

  // Handle image
  if (item.imageUrl && !item.imageUrl.startsWith('data:image/svg+xml')) {
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const filePreview = document.getElementById('filePreview');
    const fileLabel = document.querySelector('.file-input-label');

    previewImage.src = item.imageUrl;
    fileName.textContent = 'Current image';
    filePreview.style.display = 'block';
    fileLabel.classList.add('has-file');
    fileLabel.innerHTML = '<span>📷 Change Image</span>';
  }
}

function resetForm() {
  const form = document.getElementById('addForm');
  const fileInput = document.getElementById('imageFile');
  const fileLabel = document.querySelector('.file-input-label');
  const filePreview = document.getElementById('filePreview');

  form.reset();
  if (fileInput) fileInput.value = '';
  if (filePreview) filePreview.style.display = 'none';
  if (fileLabel) {
    fileLabel.classList.remove('has-file');
    fileLabel.innerHTML = '<span>📷 Choose Image (JPG, PNG, SVG...)</span>';
  }

  // Hide optional fields
  document.getElementById('itemElement').style.display = 'none';
  document.getElementById('levelSelector').style.display = 'none';
  document.getElementById('talentMaterialsLabel').style.display = 'none';
}

// Materials editor modal
function showEditMaterialsModal(itemId) {
  const modal = document.getElementById('editMaterialsModal');
  const item = materialItems.find(item => item.id === itemId);
  
  if (!item) return;

  editingItemId = itemId;
  renderMaterialsEditor(item);
  modal.classList.add('show');
}

function hideEditMaterialsModal() {
  const modal = document.getElementById('editMaterialsModal');
  modal.classList.remove('show');
  editingItemId = null;
}

function renderMaterialsEditor(item) {
  const container = document.getElementById('materialsEditor');
  container.innerHTML = '';

  const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];

  allMaterials.forEach((material, index) => {
    const div = document.createElement('div');
    div.className = 'material-editor-item';
    
    div.innerHTML = `
      <div class="material-editor-image-container">
        <img src="${material.image || getDefaultMaterialImage()}" alt="${material.name}" class="material-editor-image" />
        <input type="file" id="matImg_${index}" accept="image/*" style="display: none;" onchange="updateMaterialImage('${item.id}', ${index}, this)" />
        <button type="button" class="btn-change-image" onclick="document.getElementById('matImg_${index}').click()">📷</button>
      </div>
      <div class="material-editor-info">
        <input type="text" value="${material.name}" class="material-editor-name-input" 
               onchange="updateMaterialName('${item.id}', ${index}, this.value)" placeholder="Material name" />
        <div class="material-editor-controls">
          <div class="material-counter">
            <button type="button" class="counter-btn" onclick="updateMaterialCount('${item.id}', ${index}, -1)">-</button>
            <input type="number" value="${material.obtained || 0}" min="0" max="9999" class="counter-input" 
                   onchange="setMaterialCount('${item.id}', ${index}, this.value)" />
            <button type="button" class="counter-btn" onclick="updateMaterialCount('${item.id}', ${index}, 1)">+</button>
          </div>
          <span class="required-amount">/ ${material.required}</span>
          <input type="number" value="${material.required}" min="1" max="9999" class="required-input" 
                 onchange="updateMaterialRequired('${item.id}', ${index}, this.value)" placeholder="Required" />
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

function getDefaultMaterialImage() {
  return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><text y="60" x="50" text-anchor="middle" fill="%23666" font-size="16">MAT</text></svg>';
}

function updateMaterialImage(itemId, materialIndex, input) {
  if (!input.files[0]) return;
  
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    alert('Please select a valid image file');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const item = materialItems.find(item => item.id === itemId);
    if (!item) return;

    const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];
    if (materialIndex >= 0 && materialIndex < allMaterials.length) {
      allMaterials[materialIndex].image = e.target.result;
      renderMaterialsEditor(item);
    }
  };
  reader.readAsDataURL(file);
}

function updateMaterialName(itemId, materialIndex, name) {
  const item = materialItems.find(item => item.id === itemId);
  if (!item) return;

  const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];
  if (materialIndex >= 0 && materialIndex < allMaterials.length) {
    allMaterials[materialIndex].name = name;
  }
}

function updateMaterialRequired(itemId, materialIndex, required) {
  const item = materialItems.find(item => item.id === itemId);
  if (!item) return;

  const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];
  if (materialIndex >= 0 && materialIndex < allMaterials.length) {
    allMaterials[materialIndex].required = Math.max(1, parseInt(required) || 1);
  }
}

function updateMaterialCount(itemId, materialIndex, change) {
  const item = materialItems.find(item => item.id === itemId);
  if (!item) return;

  const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];
  if (materialIndex >= 0 && materialIndex < allMaterials.length) {
    const material = allMaterials[materialIndex];
    const newValue = Math.max(0, Math.min(9999, (material.obtained || 0) + change));
    material.obtained = newValue;
    
    renderMaterialsEditor(item);
  }
}

function setMaterialCount(itemId, materialIndex, value) {
  const item = materialItems.find(item => item.id === itemId);
  if (!item) return;

  const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];
  if (materialIndex >= 0 && materialIndex < allMaterials.length) {
    const material = allMaterials[materialIndex];
    material.obtained = Math.max(0, Math.min(9999, parseInt(value) || 0));
  }
}

function saveMaterialsChanges() {
  saveToLocalStorage();
  renderMaterials();
  hideEditMaterialsModal();
}

// CRUD operations
function addItem(itemData) {
  const newItem = {
    id: Date.now().toString(),
    ...itemData,
    completed: false,
    priority: materialItems.filter(item => !item.completed).length + 1,
    ascensionMaterials: itemData.includeAscension ? generateMaterials('ascension', itemData.type, itemData.rarity) : [],
    talentMaterials: itemData.includeTalent && itemData.type === 'character' ? generateMaterials('talent') : []
  };
  
  materialItems.push(newItem);
  renderMaterials();
  updateItemCounts();
  saveToLocalStorage();
}

function updateItem(itemData) {
  const item = materialItems.find(item => item.id === editingItemId);
  if (item) {
    Object.assign(item, itemData);
    
    // Regenerate materials if type or rarity changed
    if (itemData.includeAscension) {
      item.ascensionMaterials = generateMaterials('ascension', itemData.type, itemData.rarity);
    } else {
      item.ascensionMaterials = [];
    }
    
    if (itemData.includeTalent && itemData.type === 'character') {
      item.talentMaterials = generateMaterials('talent');
    } else {
      item.talentMaterials = [];
    }
    
    renderMaterials();
    updateItemCounts();
    saveToLocalStorage();
  }
}

function generateMaterials(type, itemType = null, rarity = null) {
  if (type === 'ascension' && itemType && rarity) {
    return DEFAULT_MATERIALS.ascension[itemType][rarity].map(mat => ({...mat}));
  } else if (type === 'talent') {
    return DEFAULT_MATERIALS.talent.map(mat => ({...mat}));
  }
  return [];
}

function deleteItem(id) {
  const item = materialItems.find(item => item.id === id);
  const itemName = item ? item.name : 'this item';
  
  if (confirm(`Are you sure you want to delete "${itemName}"?`)) {
    materialItems = materialItems.filter(item => item.id !== id);
    // Reorder priorities
    const inProgressItems = materialItems.filter(item => !item.completed);
    const completedItems = materialItems.filter(item => item.completed);
    
    inProgressItems.forEach((item, index) => {
      item.priority = index + 1;
    });
    
    completedItems.forEach((item, index) => {
      item.priority = index + 1;
    });
    
    renderMaterials();
    updateItemCounts();
    saveToLocalStorage();
  }
}

function toggleCompleted(id, completed) {
  const item = materialItems.find(item => item.id === id);
  if (item) {
    item.completed = completed;
    
    // Reorder priorities
    const inProgressItems = materialItems.filter(item => !item.completed);
    const completedItems = materialItems.filter(item => item.completed);
    
    if (completed) {
      item.priority = completedItems.length;
    } else {
      item.priority = inProgressItems.length + 1;
    }
    
    inProgressItems.forEach((item, index) => {
      item.priority = index + 1;
    });
    
    completedItems.forEach((item, index) => {
      item.priority = index + 1;
    });
    
    renderMaterials();
    updateItemCounts();
    saveToLocalStorage();
  }
}

// Rendering functions
function renderMaterials() {
  const inProgressContainer = document.getElementById('inProgressContainer');
  const completedContainer = document.getElementById('completedContainer');
  
  const filteredItems = getFilteredItems();
  const inProgressItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);
  
  renderSection(inProgressContainer, inProgressItems, 'in-progress');
  renderSection(completedContainer, completedItems, 'completed');
  
  updateItemCounts();
}

function renderSection(container, items, sectionType) {
  if (!container) return;
  
  container.innerHTML = '';
  
  if (items.length === 0) {
    const message = sectionType === 'in-progress' ? 
      'No items in progress' : 'No completed items';
    const subMessage = sectionType === 'in-progress' ? 
      'Add your first character or weapon to get started!' : 
      'Mark items as completed to see them here.';
    
    container.innerHTML = `
      <div class="empty-state">
        <h3>${message}</h3>
        <p>${subMessage}</p>
        ${sectionType === 'in-progress' && currentFilter === 'all' ? 
          '<button class="btn-primary" onclick="showAddModal()">Add your first item</button>' : ''}
      </div>
    `;
    return;
  }
  
  items.forEach(item => {
    const itemElement = createMaterialItemElement(item);
    container.appendChild(itemElement);
  });
}

function getFilteredItems() {
  return materialItems.filter(item => {
    switch (currentFilter) {
      case 'character-4':
        return item.type === 'character' && item.rarity === 4;
      case 'character-5':
        return item.type === 'character' && item.rarity === 5;
      case 'weapon-4':
        return item.type === 'weapon' && item.rarity === 4;
      case 'weapon-5':
        return item.type === 'weapon' && item.rarity === 5;
      case 'pyro':
      case 'hydro':
      case 'dendro':
      case 'geo':
      case 'cryo':
      case 'anemo':
      case 'electro':
        return item.element === currentFilter;
      case 'in-progress':
        return !item.completed;
      case 'completed':
        return item.completed;
      default:
        return true;
    }
  }).sort((a, b) => a.priority - b.priority);
}

function createMaterialItemElement(item) {
  const div = document.createElement('div');
  div.className = `material-item${item.completed ? ' completed' : ''}`;
  div.draggable = true;
  div.dataset.id = item.id;
  
  const stars = '★'.repeat(item.rarity);
  const typeIcon = item.type === 'character' ? '' : '';
  
  const imageHtml = item.imageUrl ? 
    `<img src="${item.imageUrl}" alt="${item.name}" class="item-image" onerror="this.style.display='none'" />` : 
    `<div class="item-image" style="display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">${typeIcon}</div>`;
  
  const elementHtml = item.element ? 
    `<span class="item-element ${item.element}">${getElementEmoji(item.element)} ${item.element.charAt(0).toUpperCase() + item.element.slice(1)}</span>` : '';
  
  const levelHtml = item.type && (item.ascensionMaterials?.length > 0 || item.talentMaterials?.length > 0) ? 
    `<div class="level-selectors">
      <select class="level-select" onchange="updateItemLevel('${item.id}', 'currentLevel', this.value)">
        ${[1, 20, 40, 50, 60, 70, 80, 90].map(level => 
          `<option value="${level}" ${level === (item.currentLevel || 1) ? 'selected' : ''}>${level}</option>`
        ).join('')}
      </select>
      <span class="level-arrow">→</span>
      <select class="level-select" onchange="updateItemLevel('${item.id}', 'targetLevel', this.value)">
        ${[20, 40, 50, 60, 70, 80, 90].map(level => 
          `<option value="${level}" ${level === (item.targetLevel || 90) ? 'selected' : ''}>${level}</option>`
        ).join('')}
      </select>
    </div>` : '';
  
  const allMaterials = [...(item.ascensionMaterials || []), ...(item.talentMaterials || [])];
  const materialsHtml = allMaterials.length > 0 ? allMaterials.map(material => {
    const progress = material.obtained || 0;
    const total = material.required || 1;
    const isComplete = progress >= total;
    
    return `
      <div class="material-slot">
        <img src="${material.image || getDefaultMaterialImage()}" alt="${material.name}" class="material-image" />
        <div class="material-name">${material.name || 'Material'}</div>
        <div class="material-count ${isComplete ? 'complete' : 'incomplete'}">${progress}/${total}</div>
      </div>
    `;
  }).join('') : '<div class="material-slot"><div class="material-name">No materials added</div></div>';
  
  div.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    ${imageHtml}
    <div class="item-content">
      <div class="item-header">
        <div class="item-title">
          <h3 class="item-name${item.completed ? ' completed' : ''}">${item.name}</h3>
          ${levelHtml}
        </div>
        <div class="item-meta">
          <div class="item-rarity">${stars}</div>
          <span class="item-tag">${typeIcon} ${item.type}</span>
          ${elementHtml}
          ${item.ascensionMaterials?.length > 0 ? '<span class="item-tag">Ascension Materials</span>' : ''}
          ${item.talentMaterials?.length > 0 ? '<span class="item-tag">Talent Materials</span>' : ''}
        </div>
      </div>
      <div class="materials-grid">
        ${materialsHtml}
      </div>
      <div class="item-actions">
        <div class="completion-controls">
          <label class="checkbox-label">
            <input type="checkbox" ${item.completed ? 'checked' : ''} 
                   onchange="toggleCompleted('${item.id}', this.checked)" />
            Completed
          </label>
          <button class="btn-edit" onclick="showAddModal('${item.id}')">Edit Item</button>
          <button class="btn-edit-materials" onclick="showEditMaterialsModal('${item.id}')">Edit Materials</button>
        </div>
        <button class="btn-delete" onclick="deleteItem('${item.id}')" title="Delete item">⌫</button>
      </div>
    </div>
  `;
  
  return div;
}

function updateItemLevel(itemId, levelType, value) {
  const item = materialItems.find(item => item.id === itemId);
  if (item) {
    item[levelType] = parseInt(value);
    saveToLocalStorage();
  }
}

function getElementEmoji(element) {
  const emojis = {
    pyro: '',
    hydro: '',
    dendro: '',
    geo: '',
    cryo: '',
    anemo: '',
    electro: ''
  };
  return emojis[element] || '';
}

function updateItemCounts() {
  const inProgressCount = materialItems.filter(item => !item.completed).length;
  const completedCount = materialItems.filter(item => item.completed).length;
  
  const inProgressCountElement = document.getElementById('inProgressCount');
  const completedCountElement = document.getElementById('completedCount');
  
  if (inProgressCountElement) {
    inProgressCountElement.textContent = `${inProgressCount} item${inProgressCount !== 1 ? 's' : ''}`;
  }
  
  if (completedCountElement) {
    completedCountElement.textContent = `${completedCount} item${completedCount !== 1 ? 's' : ''}`;
  }
}

// Drag and Drop functionality
function setupDragAndDrop() {
  document.addEventListener('dragstart', handleDragStart);
  document.addEventListener('dragend', handleDragEnd);
  document.addEventListener('dragover', handleDragOver);
  document.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
  if (e.target.classList.contains('material-item')) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }
}

function handleDragEnd(e) {
  if (e.target.classList.contains('material-item')) {
    e.target.classList.remove('dragging');
    draggedElement = null;
  }
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
  e.preventDefault();
  
  const item = e.target.closest('.material-item');
  if (item && draggedElement && item !== draggedElement) {
    const draggedId = draggedElement.dataset.id;
    const targetId = item.dataset.id;
    reorderItems(draggedId, targetId);
    saveToLocalStorage();
  }
}

function reorderItems(draggedId, targetId) {
  const draggedIndex = materialItems.findIndex(item => item.id === draggedId);
  const targetIndex = materialItems.findIndex(item => item.id === targetId);
  
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  // Move the element
  const [movedItem] = materialItems.splice(draggedIndex, 1);
  materialItems.splice(targetIndex, 0, movedItem);
  
  // Update priorities
  materialItems.forEach((item, index) => {
    item.priority = index + 1;
  });
  
  renderMaterials();
}