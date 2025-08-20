// Global variables
let materialItems = [];
let currentFilter = 'all';
let draggedElement = null;
let editingItemId = null;

// Material catalog data - This will be expanded later
const materialCatalog = [
  {
    id: 'slime-condensate',
    name: 'Slime Condensate',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><circle fill="%2398FB98" cx="50" cy="50" r="30"/><text y="55" x="50" text-anchor="middle" fill="%23333" font-size="12">Slime</text></svg>',
    category: 'common'
  },
  {
    id: 'slime-secretions',
    name: 'Slime Secretions',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><circle fill="%2398FB98" cx="50" cy="50" r="25"/><text y="55" x="50" text-anchor="middle" fill="%23333" font-size="10">Secret</text></svg>',
    category: 'uncommon'
  },
  {
    id: 'slime-concentrate',
    name: 'Slime Concentrate',
    image: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><circle fill="%2398FB98" cx="50" cy="50" r="20"/><text y="55" x="50" text-anchor="middle" fill="%23333" font-size="8">Conc</text></svg>',
    category: 'rare'
  }
];

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

// Initialize application
function initializeApp() {
  loadMaterialItems();
  setupEventListeners();
  populateLevelSelectors();
  renderMaterialItems();
}

// Populate level selectors with values 1-90
function populateLevelSelectors() {
  const currentLevelSelect = document.getElementById('currentLevel');
  const targetLevelSelect = document.getElementById('targetLevel');
  
  if (currentLevelSelect && targetLevelSelect) {
    // Clear existing options
    currentLevelSelect.innerHTML = '';
    targetLevelSelect.innerHTML = '';
    
    // Add level options 1-90
    for (let i = 1; i <= 90; i++) {
      const currentOption = document.createElement('option');
      currentOption.value = i.toString();
      currentOption.textContent = i.toString();
      currentLevelSelect.appendChild(currentOption);
      
      const targetOption = document.createElement('option');
      targetOption.value = i.toString();
      targetOption.textContent = i.toString();
      targetLevelSelect.appendChild(targetOption);
    }
    
    // Set default values
    currentLevelSelect.value = '1';
    targetLevelSelect.value = '90';
  }
}

// Event Listeners
function setupEventListeners() {
  // Add button
  document.getElementById('addButton').addEventListener('click', openAddModal);

  // Filter buttons
  document.querySelectorAll('.btn-filter').forEach(button => {
    button.addEventListener('click', function() {
      setFilter(this.dataset.filter);
    });
  });

  // Form submissions
  document.getElementById('addForm').addEventListener('submit', handleAddItem);
  document.getElementById('customMaterialForm').addEventListener('submit', handleAddCustomMaterial);

  // Modal controls
  document.getElementById('cancelButton').addEventListener('click', closeModal);
  document.getElementById('cancelMaterialsButton').addEventListener('click', closeMaterialsModal);
  document.getElementById('cancelCustomMaterialButton').addEventListener('click', closeCustomMaterialModal);
  
  // Catalog controls
  const closeCatalogButton = document.getElementById('closeCatalogButton');
  if (closeCatalogButton) {
    closeCatalogButton.addEventListener('click', closeCatalogModal);
  }
  
  const addFromCatalogButton = document.getElementById('addFromCatalogButton');
  if (addFromCatalogButton) {
    addFromCatalogButton.addEventListener('click', openCatalogModal);
  }

  // Material management buttons
  document.getElementById('addMaterialButton').addEventListener('click', openCustomMaterialModal);
  document.getElementById('saveMaterialsButton').addEventListener('click', saveMaterials);

  // Item type change handler
  document.getElementById('itemType').addEventListener('change', handleTypeChange);

  // File upload previews
  document.getElementById('imageFile').addEventListener('change', handleFilePreview);
  document.getElementById('customMaterialImage').addEventListener('change', handleCustomMaterialFilePreview);

  // Modal background click to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
}

// Local Storage
function saveMaterialItems() {
  localStorage.setItem('materialItems', JSON.stringify(materialItems));
}

function loadMaterialItems() {
  const stored = localStorage.getItem('materialItems');
  materialItems = stored ? JSON.parse(stored) : [];
}

// Modal Management
function openAddModal() {
  document.getElementById('addModal').classList.add('show');
  document.getElementById('modalTitle').textContent = 'Add New Item';
  document.getElementById('addForm').reset();
  document.getElementById('filePreview').style.display = 'none';
  populateLevelSelectors(); // Repopulate on each open
  editingItemId = null;
}

function closeModal() {
  document.getElementById('addModal').classList.remove('show');
}

function openMaterialsModal(itemId) {
  editingItemId = itemId;
  const item = materialItems.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('editMaterialsModal').classList.add('show');
  renderCurrentMaterials(item.materials || []);
}

function closeMaterialsModal() {
  document.getElementById('editMaterialsModal').classList.remove('show');
  editingItemId = null;
}

function openCustomMaterialModal() {
  document.getElementById('addCustomMaterialModal').classList.add('show');
  document.getElementById('customMaterialForm').reset();
  document.getElementById('customMaterialPreview').style.display = 'none';
}

function closeCustomMaterialModal() {
  document.getElementById('addCustomMaterialModal').classList.remove('show');
}

function openCatalogModal() {
  document.getElementById('materialCatalogModal').classList.add('show');
  renderCatalog();
}

function closeCatalogModal() {
  document.getElementById('materialCatalogModal').classList.remove('show');
}

// Catalog Functions
function renderCatalog() {
  const catalogGrid = document.getElementById('catalogGrid');
  if (!catalogGrid) return;
  
  catalogGrid.innerHTML = '';
  
  if (materialCatalog.length === 0) {
    catalogGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem; grid-column: 1 / -1;">Catalog is being updated. More materials coming soon!</p>';
    return;
  }
  
  materialCatalog.forEach(material => {
    const div = document.createElement('div');
    div.className = 'catalog-item';
    div.innerHTML = `
      <img src="${material.image}" alt="${material.name}" class="catalog-image" />
      <div class="catalog-name">${material.name}</div>
      <button class="btn-catalog-add" onclick="addMaterialFromCatalog('${material.id}')">Add</button>
    `;
    catalogGrid.appendChild(div);
  });
}

function addMaterialFromCatalog(materialId) {
  if (!editingItemId) return;
  
  const catalogMaterial = materialCatalog.find(m => m.id === materialId);
  if (!catalogMaterial) return;
  
  const material = {
    id: Date.now().toString(),
    name: catalogMaterial.name,
    required: 1,
    obtained: 0,
    image: catalogMaterial.image
  };
  
  addMaterialToItem(material);
  closeCatalogModal();
}

// Material Functions
function renderCurrentMaterials(materials) {
  const container = document.getElementById('currentMaterialsList');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (materials.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No materials added yet. Click "Add Custom Material" or "Add from Catalog" to get started.</p>';
    return;
  }
  
  materials.forEach(material => {
    const div = document.createElement('div');
    div.className = 'current-material-item';
    div.innerHTML = `
      <img src="${material.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><text y="55" x="50" text-anchor="middle" fill="%23999" font-size="30">?</text></svg>'}" alt="${material.name}" class="material-image" />
      <div class="material-details">
        <div class="material-name">${material.name}</div>
        <div class="material-inputs">
          <input type="number" value="${material.obtained}" onchange="updateMaterialProgress('${material.id}', 'obtained', this.value)" min="0" />
          /
          <input type="number" value="${material.required}" onchange="updateMaterialProgress('${material.id}', 'required', this.value)" min="1" />
        </div>
      </div>
      <button class="btn-delete" onclick="removeMaterial('${material.id}')">×</button>
    `;
    container.appendChild(div);
  });
}

function updateMaterialProgress(materialId, field, value) {
  if (!editingItemId) return;
  
  const item = materialItems.find(i => i.id === editingItemId);
  if (!item || !item.materials) return;
  
  const material = item.materials.find(m => m.id === materialId);
  if (material) {
    material[field] = parseInt(value) || 0;
    saveMaterialItems();
    renderMaterialItems();
  }
}

function removeMaterial(materialId) {
  if (!editingItemId) return;
  
  const item = materialItems.find(i => i.id === editingItemId);
  if (!item || !item.materials) return;
  
  item.materials = item.materials.filter(m => m.id !== materialId);
  saveMaterialItems();
  renderCurrentMaterials(item.materials);
}

function saveMaterials() {
  saveMaterialItems();
  renderMaterialItems();
  closeMaterialsModal();
}

// Form Handlers
function handleTypeChange() {
  const type = document.getElementById('itemType').value;
  const elementSelect = document.getElementById('itemElement');
  const levelSelector = document.getElementById('levelSelector');
  
  if (type === 'character') {
    elementSelect.style.display = 'block';
    elementSelect.required = true;
    levelSelector.style.display = 'block';
  } else {
    elementSelect.style.display = 'none';
    elementSelect.required = false;
    levelSelector.style.display = type === 'weapon' ? 'block' : 'none';
  }
}

function handleFilePreview() {
  const file = this.files[0];
  const preview = document.getElementById('filePreview');
  const image = document.getElementById('previewImage');
  const fileName = document.getElementById('fileName');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      image.src = e.target.result;
      fileName.textContent = file.name;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
  }
}

function handleCustomMaterialFilePreview() {
  const file = this.files[0];
  const preview = document.getElementById('customMaterialPreview');
  const image = document.getElementById('customPreviewImage');
  const fileName = document.getElementById('customFileName');

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      image.src = e.target.result;
      fileName.textContent = file.name;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = 'none';
  }
}

function handleAddItem(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const imageFile = formData.get('imageFile');
  
  const item = {
    id: editingItemId || Date.now().toString(),
    name: formData.get('name'),
    type: formData.get('type'),
    rarity: formData.get('rarity'),
    element: formData.get('element') || null,
    materialType: formData.get('materialType'),
    currentLevel: formData.get('currentLevel') || '1',
    targetLevel: formData.get('targetLevel') || '90',
    notes: formData.get('notes'),
    completed: false,
    materials: editingItemId ? materialItems.find(i => i.id === editingItemId)?.materials || [] : [],
    image: null
  };

  if (imageFile && imageFile.size > 0) {
    const reader = new FileReader();
    reader.onload = function(e) {
      item.image = e.target.result;
      saveItem(item);
    };
    reader.readAsDataURL(imageFile);
  } else {
    // Si estamos editando, mantener la imagen anterior
    if (editingItemId) {
      const existingItem = materialItems.find(i => i.id === editingItemId);
      if (existingItem) {
        item.image = existingItem.image;
      }
    }
    saveItem(item);
  }
}

function saveItem(item) {
  if (editingItemId) {
    const index = materialItems.findIndex(i => i.id === editingItemId);
    if (index !== -1) {
      materialItems[index] = { ...materialItems[index], ...item };
    }
  } else {
    materialItems.push(item);
  }
  
  saveMaterialItems();
  renderMaterialItems();
  closeModal();
}

function handleAddCustomMaterial(e) {
  e.preventDefault();
  
  if (!editingItemId) return;
  
  const formData = new FormData(e.target);
  const imageFile = formData.get('customMaterialImage');
  
  const material = {
    id: Date.now().toString(),
    name: formData.get('customMaterialName'),
    required: parseInt(formData.get('customMaterialRequired')) || 1,
    obtained: parseInt(formData.get('customMaterialObtained')) || 0,
    image: null
  };

  if (imageFile && imageFile.size > 0) {
    const reader = new FileReader();
    reader.onload = function(e) {
      material.image = e.target.result;
      addMaterialToItem(material);
    };
    reader.readAsDataURL(imageFile);
  } else {
    addMaterialToItem(material);
  }
}

function addMaterialToItem(material) {
  const item = materialItems.find(i => i.id === editingItemId);
  if (item) {
    if (!item.materials) item.materials = [];
    item.materials.push(material);
    saveMaterialItems();
    renderCurrentMaterials(item.materials);
  }
  
  closeCustomMaterialModal();
}

// Utility function to capitalize text
function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

// Filter Management
function setFilter(filter) {
  currentFilter = filter;
  
  // Update active button
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeButton = document.querySelector(`[data-filter="${filter}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  renderMaterialItems();
}

function filterItems(items) {
  return items.filter(item => {
    if (currentFilter === 'all') {
      return !item.completed;
    }
    if (currentFilter === 'in-progress') return !item.completed;
    if (currentFilter === 'completed') return item.completed;
    if (currentFilter === 'character-5') return item.type === 'character' && item.rarity === '5' && !item.completed;
    if (currentFilter === 'character-4') return item.type === 'character' && item.rarity === '4' && !item.completed;
    if (currentFilter === 'weapon-5') return item.type === 'weapon' && item.rarity === '5' && !item.completed;
    if (currentFilter === 'weapon-4') return item.type === 'weapon' && item.rarity === '4' && !item.completed;
    if (currentFilter === 'ascension-materials') return item.materialType === 'ascension' && !item.completed;
    if (currentFilter === 'talent-materials') return item.materialType === 'talent' && !item.completed;
    if (['pyro', 'hydro', 'dendro', 'geo', 'cryo', 'anemo', 'electro'].includes(currentFilter)) {
      return item.element === currentFilter && !item.completed;
    }
    
    return true;
  });
}

// Render Functions
function renderMaterialItems() {
  const inProgressContainer = document.getElementById('inProgressContainer');
  const completedContainer = document.getElementById('completedContainer');
  
  if (!inProgressContainer || !completedContainer) return;
  
  inProgressContainer.innerHTML = '';
  completedContainer.innerHTML = '';
  
  // Solo mostrar items según el filtro actual
  if (currentFilter === 'completed') {
    // Si el filtro es "completed", solo mostrar la sección de completed
    const completedItems = materialItems.filter(item => item.completed);
    completedItems.forEach(item => {
      completedContainer.appendChild(createMaterialItem(item));
    });
    document.getElementById('completedCount').textContent = `${completedItems.length} item${completedItems.length !== 1 ? 's' : ''}`;
    document.getElementById('inProgressCount').textContent = '0 items';
    
    // Hide in progress section when showing completed
    document.getElementById('inProgressSection').style.display = 'none';
    document.getElementById('completedSection').style.display = 'block';
  } else {
    // Para cualquier otro filtro, mostrar items filtrados en "In Progress"
    const filteredItems = filterItems(materialItems);
    filteredItems.forEach(item => {
      inProgressContainer.appendChild(createMaterialItem(item));
    });
    document.getElementById('inProgressCount').textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`;
    
    // También mostrar items completados en la sección de completed (pero sin filtros)
    const completedItems = materialItems.filter(item => item.completed);
    completedItems.forEach(item => {
      completedContainer.appendChild(createMaterialItem(item));
    });
    document.getElementById('completedCount').textContent = `${completedItems.length} item${completedItems.length !== 1 ? 's' : ''}`;
    
    // Show both sections for non-completed filters
    document.getElementById('inProgressSection').style.display = 'block';
    document.getElementById('completedSection').style.display = 'block';
  }
}

function createMaterialItem(item) {
  const div = document.createElement('div');
  div.className = `material-item ${item.completed ? 'completed' : ''}`;
  div.dataset.itemId = item.id;
  
  // Calculate materials progress
  const materialsProgress = calculateMaterialsProgress(item.materials || []);
  
  div.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    <img src="${item.image || generateDefaultImage(item)}" alt="${item.name}" class="item-image" />
    <div class="item-content">
      <div class="item-header">
        <div class="item-title">
          <h3 class="item-name ${item.completed ? 'completed' : ''}">${item.name}</h3>
          <div class="level-selectors">
            <select class="level-select" onchange="updateItemLevel('${item.id}', 'currentLevel', this.value)" ${item.completed ? 'disabled' : ''}>
              ${generateLevelOptions(item.currentLevel)}
            </select>
            <span class="level-arrow">→</span>
            <select class="level-select" onchange="updateItemLevel('${item.id}', 'targetLevel', this.value)" ${item.completed ? 'disabled' : ''}>
              ${generateLevelOptions(item.targetLevel)}
            </select>
          </div>
        </div>
        <div class="item-meta">
          <span class="item-rarity">${'★'.repeat(parseInt(item.rarity))}</span>
          <span class="item-tag">${capitalizeWords(item.type)}</span>
          ${item.element ? `<span class="item-element">${capitalizeWords(item.element)}</span>` : ''}
          <span class="item-material-type">${capitalizeWords(item.materialType)} Materials</span>
        </div>
      </div>
      
      <div class="materials-grid">
        ${(item.materials || []).map(material => `
          <div class="material-slot">
            <img src="${material.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><text y="55" x="50" text-anchor="middle" fill="%23999" font-size="30">?</text></svg>'}" alt="${material.name}" class="material-image" />
            <div class="material-name">${material.name}</div>
            <div class="material-count ${material.obtained >= material.required ? 'complete' : 'incomplete'}">
              ${material.obtained}/${material.required}
            </div>
          </div>
        `).join('')}
      </div>
      
      ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
      
      <div class="item-actions">
        <div class="completion-controls">
          <label class="checkbox-label">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleItemCompletion('${item.id}', this.checked)">
            <span>Materials: ${materialsProgress.completed}/${materialsProgress.total}</span>
          </label>
        </div>
        <div class="item-buttons">
          <button class="btn-edit-materials" onclick="openMaterialsModal('${item.id}')" ${item.completed ? 'disabled' : ''}>Edit Materials</button>
          <button class="btn-edit" onclick="editItem('${item.id}')" ${item.completed ? 'disabled' : ''}>Edit</button>
          <button class="btn-delete" onclick="deleteItem('${item.id}')">×</button>
        </div>
      </div>
    </div>
  `;
  
  return div;
}

function generateLevelOptions(selectedLevel) {
  let options = '';
  for (let i = 1; i <= 90; i++) {
    options += `<option value="${i}" ${i.toString() === selectedLevel ? 'selected' : ''}>${i}</option>`;
  }
  return options;
}

function generateDefaultImage(item) {
  const colors = {
    'pyro': '#FF6B6B',
    'hydro': '#4ECDC4',
    'dendro': '#95E1D3',
    'geo': '#F38BA8',
    'cryo': '#A8E6CF',
    'anemo': '#88D8B0',
    'electro': '#C77DFF',
    'character': '#b38478',
    'weapon': '#8b5a3c'
  };
  
  const color = colors[item.element] || colors[item.type] || '#b38478';
  const symbol = item.type === 'character' ? '♦' : '⚔';
  
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="${encodeURIComponent(color)}" width="100" height="100" rx="15"/><text y="60" x="50" text-anchor="middle" fill="white" font-size="35">${symbol}</text></svg>`;
}

function calculateMaterialsProgress(materials) {
  const total = materials.length;
  const completed = materials.filter(m => m.obtained >= m.required).length;
  return { completed, total };
}

function updateItemLevel(itemId, levelType, value) {
  const item = materialItems.find(i => i.id === itemId);
  if (item) {
    item[levelType] = value;
    saveMaterialItems();
    renderMaterialItems();
  }
}

function toggleItemCompletion(itemId, completed) {
  const item = materialItems.find(i => i.id === itemId);
  if (item) {
    item.completed = completed;
    saveMaterialItems();
    renderMaterialItems();
  }
}

function editItem(itemId) {
  const item = materialItems.find(i => i.id === itemId);
  if (!item) return;
  
  editingItemId = itemId;
  document.getElementById('modalTitle').textContent = 'Edit Item';
  
  // Populate form with existing data
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemType').value = item.type;
  document.getElementById('itemRarity').value = item.rarity;
  document.getElementById('itemElement').value = item.element || '';
  document.getElementById('materialType').value = item.materialType;
  document.getElementById('itemNotes').value = item.notes || '';
  
  // Populate and show level selectors
  populateLevelSelectors();
  document.getElementById('currentLevel').value = item.currentLevel;
  document.getElementById('targetLevel').value = item.targetLevel;
  
  // Handle element field visibility
  handleTypeChange();
  
  document.getElementById('submitButton').textContent = 'Update Item';
  document.getElementById('addModal').classList.add('show');
}

function deleteItem(itemId) {
  if (confirm('Are you sure you want to delete this item?')) {
    materialItems = materialItems.filter(item => item.id !== itemId);
    saveMaterialItems();
    renderMaterialItems();
  }
}
