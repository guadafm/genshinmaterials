// Global variables
let materialItems = [];
let currentFilter = 'all';
let draggedElement = null;
let editingItemId = null;
let currentMaterialCategory = 'weekly-boss';

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

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

  // Material management buttons
  document.getElementById('addMaterialButton').addEventListener('click', openCustomMaterialModal);
  document.getElementById('saveMaterialsButton').addEventListener('click', saveMaterials);

  // Item type change handler
  document.getElementById('itemType').addEventListener('change', handleTypeChange);

  // File upload previews
  document.getElementById('imageFile').addEventListener('change', handleFilePreview);
  document.getElementById('customMaterialImage').addEventListener('change', handleCustomMaterialFilePreview);

  // Category buttons
  document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', function() {
      setMaterialCategory(this.dataset.category);
    });
  });

  // Modal background click to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
}

// Material Category Management
function setMaterialCategory(category) {
  currentMaterialCategory = category;
  
  // Update active button
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-category="${category}"]`).classList.add('active');
  
  // Refresh materials list if editing
  if (editingItemId) {
    const item = materialItems.find(i => i.id === editingItemId);
    if (item) {
      renderCurrentMaterials(item.materials || []);
    }
  }
}

// Local Storage with error handling
function saveMaterialItems() {
  try {
    // Clean up images to save space
    const itemsToSave = materialItems.map(item => {
      const cleanItem = { ...item };
      
      // Compress or remove large images if needed
      if (cleanItem.image && cleanItem.image.length > 50000) { // If image is larger than ~50KB
        delete cleanItem.image; // Remove large images to save space
      }
      
      // Clean material images too
      if (cleanItem.materials) {
        cleanItem.materials = cleanItem.materials.map(material => {
          const cleanMaterial = { ...material };
          if (cleanMaterial.image && cleanMaterial.image.length > 50000) {
            delete cleanMaterial.image;
          }
          return cleanMaterial;
        });
      }
      
      return cleanItem;
    });
    
    localStorage.setItem('materialItems', JSON.stringify(itemsToSave));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // If quota exceeded, try to clean old data
      alert('Storage is full. Some images may not be saved. Consider removing some items or using smaller images.');
      
      // Try to save without any images
      const itemsWithoutImages = materialItems.map(item => {
        const cleanItem = { ...item };
        delete cleanItem.image;
        if (cleanItem.materials) {
          cleanItem.materials = cleanItem.materials.map(material => {
            const cleanMaterial = { ...material };
            delete cleanMaterial.image;
            return cleanMaterial;
          });
        }
        return cleanItem;
      });
      
      try {
        localStorage.setItem('materialItems', JSON.stringify(itemsWithoutImages));
      } catch (secondError) {
        alert('Unable to save data. Please try refreshing the page or removing some items.');
      }
    } else {
      console.error('Error saving to localStorage:', error);
    }
  }
}

function loadMaterialItems() {
  try {
    const stored = localStorage.getItem('materialItems');
    materialItems = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    materialItems = [];
  }
}

// Modal Management
function openAddModal() {
  document.getElementById('addModal').classList.add('show');
  document.getElementById('modalTitle').textContent = 'Add New Item';
  document.getElementById('addForm').reset();
  document.getElementById('filePreview').style.display = 'none';
  populateLevelSelectors();
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
  currentMaterialCategory = 'weekly-boss';
  
  // Reset category buttons
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector('[data-category="weekly-boss"]').classList.add('active');
  
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

// Material Functions
function renderCurrentMaterials(materials) {
  const container = document.getElementById('currentMaterialsList');
  if (!container) return;
  
  // Filter materials by current category
  const filteredMaterials = materials.filter(material => 
    material.category === currentMaterialCategory
  );
  
  container.innerHTML = '';
  
  if (filteredMaterials.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #999; padding: 2rem;">No materials in this category yet. Click "Add Custom Material" to get started.</p>`;
    return;
  }
  
  filteredMaterials.forEach(material => {
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

// Utility function to compress images
function compressImage(file, maxWidth = 400, quality = 0.7) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > height && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      } else if (height > maxWidth) {
        width = (width * maxWidth) / height;
        height = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    const reader = new FileReader();
    reader.onload = e => img.src = e.target.result;
    reader.readAsDataURL(file);
  });
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
    // Compress image before saving
    compressImage(imageFile).then(compressedImage => {
      item.image = compressedImage;
      saveItem(item);
    });
  } else {
    if (editingItemId) {
      const existingItem = materialItems.find(i => i.id === editingItemId);
      if (existingItem) {
        item.image = existingItem.image;
      }
    }
    saveItem(item);
  }
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
    category: currentMaterialCategory,
    image: null
  };

  if (imageFile && imageFile.size > 0) {
    // Compress image before saving
    compressImage(imageFile, 200, 0.6).then(compressedImage => {
      material.image = compressedImage;
      addMaterialToItem(material);
    });
  } else {
    addMaterialToItem(material);
  }
}

function addMaterialToItem(material) {
  const item = materialItems.find(i => i.id === editingItemId);
  if (!item) return;
  
  if (!item.materials) {
    item.materials = [];
  }
  
  item.materials.push(material);
  saveMaterialItems();
  renderCurrentMaterials(item.materials);
  closeCustomMaterialModal();
}

function saveItem(item) {
  if (editingItemId) {
    const index = materialItems.findIndex(i => i.id === editingItemId);
    if (index !== -1) {
      materialItems[index] = item;
    }
  } else {
    materialItems.push(item);
  }
  
  saveMaterialItems();
  renderMaterialItems();
  closeModal();
}

// Filter Management
function setFilter(filter) {
  currentFilter = filter;
  
  // Update active button
  document.querySelectorAll('.btn-filter').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  
  renderMaterialItems();
}

function filterItems(items, filter) {
  if (filter === 'all') {
    return items.filter(item => !item.completed);
  }
  
  if (filter === 'completed') {
    return items.filter(item => item.completed);
  }
  
  if (filter === 'in-progress') {
    return items.filter(item => !item.completed);
  }
  
  // Filter completed items from all other filters
  const activeItems = items.filter(item => !item.completed);
  
  if (filter === 'character-5') {
    return activeItems.filter(item => item.type === 'character' && item.rarity === '5');
  }
  
  if (filter === 'character-4') {
    return activeItems.filter(item => item.type === 'character' && item.rarity === '4');
  }
  
  if (filter === 'weapon-5') {
    return activeItems.filter(item => item.type === 'weapon' && item.rarity === '5');
  }
  
  if (filter === 'weapon-4') {
    return activeItems.filter(item => item.type === 'weapon' && item.rarity === '4');
  }
  
  if (['pyro', 'hydro', 'dendro', 'geo', 'cryo', 'anemo', 'electro'].includes(filter)) {
    return activeItems.filter(item => item.element === filter);
  }
  
  if (filter === 'ascension-materials') {
    return activeItems.filter(item => item.materialType === 'ascension');
  }
  
  if (filter === 'talent-materials') {
    return activeItems.filter(item => item.materialType === 'talent');
  }
  
  return activeItems;
}

function renderCurrentMaterials(materials) {
  const container = document.getElementById('currentMaterialsList');
  if (!container) return;
  
  // Filter materials by current category
  const filteredMaterials = materials.filter(material => 
    material.category === currentMaterialCategory
  );
  
  container.innerHTML = '';
  
  if (filteredMaterials.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #999; padding: 2rem;">No materials in this category yet. Click "Add Custom Material" to get started.</p>`;
    return;
  }
  
  // Default image for materials
  const defaultMaterialImage = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><text y="55" x="50" text-anchor="middle" fill="%23999" font-size="30">?</text></svg>';
  
  filteredMaterials.forEach(material => {
    const div = document.createElement('div');
    div.className = 'current-material-item';
    
    // Fix the image source
    const materialImage = material.image && material.image !== 'null' && material.image !== null && material.image.trim() !== '' ? material.image : defaultMaterialImage;
    
    div.innerHTML = `
      <img src="${materialImage}" alt="${material.name}" class="material-image" onerror="this.src='${defaultMaterialImage}'" />
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

function renderItemsInContainer(items, container) {
  if (items.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No items to display</p>';
    return;
  }
  
  items.forEach(item => {
    const itemElement = createItemElement(item);
    container.appendChild(itemElement);
  });
}

function generateLevelOptions(selectedLevel) {
  let options = '';
  for (let i = 1; i <= 90; i++) {
    options += `<option value="${i}" ${i == selectedLevel ? 'selected' : ''}>${i}</option>`;
  }
  return options;
}

function createItemElement(item) {
  const div = document.createElement('div');
  div.className = `material-item ${item.completed ? 'completed' : ''}`;
  div.draggable = true;
  div.dataset.itemId = item.id;
  
  // Calculate materials progress
  let totalRequired = 0;
  let totalObtained = 0;
  
  if (item.materials && item.materials.length > 0) {
    item.materials.forEach(material => {
      totalRequired += material.required;
      totalObtained += material.obtained;
    });
  }
  
  const progressText = item.materials && item.materials.length > 0 
    ? `${totalObtained}/${totalRequired} materials` 
    : 'No materials added';
  
  // Default image for materials
  const defaultMaterialImage = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><text y="55" x="50" text-anchor="middle" fill="%23999" font-size="30">?</text></svg>';
  
  div.innerHTML = `
    <div class="drag-handle">⋮⋮</div>
    <img src="${item.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23ddd" width="100" height="100" rx="10"/><text y="55" x="50" text-anchor="middle" fill="%23999" font-size="30">?</text></svg>'}" alt="${item.name}" class="item-image" />
    
    <div class="item-content">
      <div class="item-header">
        <div class="item-title">
          <h3 class="item-name ${item.completed ? 'completed' : ''}">${item.name}</h3>
          ${(item.type === 'character' || item.type === 'weapon') ? 
            `<div class="level-selectors">
              <span>Lv.</span>
              <select class="level-select" ${item.completed ? 'disabled' : ''} onchange="updateItemLevel('${item.id}', 'currentLevel', this.value)">
                ${generateLevelOptions(item.currentLevel)}
              </select>
              <span class="level-arrow">→</span>
              <select class="level-select" ${item.completed ? 'disabled' : ''} onchange="updateItemLevel('${item.id}', 'targetLevel', this.value)">
                ${generateLevelOptions(item.targetLevel)}
              </select>
            </div>` : ''
          }
        </div>
        
        <div class="item-meta">
          <span class="item-rarity">${item.rarity}★</span>
          <span class="item-tag">${item.type}</span>
          ${item.element ? `<span class="item-element">${item.element}</span>` : ''}
          <span class="item-material-type">${item.materialType}</span>
        </div>
      </div>

      <div class="materials-grid">
        ${item.materials && item.materials.length > 0 ? 
          item.materials.slice(0, 8).map(material => {
            const materialImage = material.image && material.image !== 'null' && material.image !== null ? material.image : defaultMaterialImage;
            return `
              <div class="material-slot">
                <img src="${materialImage}" alt="${material.name}" class="material-image" onerror="this.src='${defaultMaterialImage}'" />
                <div class="material-name">${material.name}</div>
                <div class="material-count ${material.obtained >= material.required ? 'complete' : 'incomplete'}">
                  ${material.obtained}/${material.required}
                </div>
              </div>
            `;
          }).join('') : 
          '<div style="text-align: center; color: #999; padding: 1rem; width: 100%;">No materials added</div>'
        }
      </div>

      ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}

      <div class="item-actions">
        <div class="completion-controls">
          <label class="checkbox-label">
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleItemCompletion('${item.id}', this.checked)" />
            Mark as completed
          </label>
          <span class="progress-text">${progressText}</span>
        </div>
        
        <div class="item-buttons">
          <button class="btn-secondary" onclick="openMaterialsModal('${item.id}')">Materials</button>
          <button class="btn-secondary" onclick="editItem('${item.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteItem('${item.id}')">×</button>
        </div>
      </div>
    </div>
  `;
  
  return div;
}
// Item Actions
function updateItemLevel(itemId, levelType, value) {
  const item = materialItems.find(i => i.id === itemId);
  if (item) {
    item[levelType] = value;
    saveMaterialItems();
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
  
  // Fill form with item data
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemType').value = item.type;
  document.getElementById('itemRarity').value = item.rarity;
  document.getElementById('itemElement').value = item.element || '';
  document.getElementById('materialType').value = item.materialType;
  document.getElementById('itemNotes').value = item.notes || '';
  
  // Handle level selectors
  if (item.type === 'character' || item.type === 'weapon') {
    populateLevelSelectors();
    document.getElementById('currentLevel').value = item.currentLevel || '1';
    document.getElementById('targetLevel').value = item.targetLevel || '90';
  }
  
  // Handle type-specific display
  handleTypeChange();
  
  // Show preview if item has image
  const preview = document.getElementById('filePreview');
  const image = document.getElementById('previewImage');
  const fileName = document.getElementById('fileName');
  
  if (item.image) {
    image.src = item.image;
    fileName.textContent = 'Current image';
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  
  document.getElementById('addModal').classList.add('show');
}

function deleteItem(itemId) {
  if (confirm('Are you sure you want to delete this item?')) {
    materialItems = materialItems.filter(item => item.id !== itemId);
    saveMaterialItems();
    renderMaterialItems();
  }
}
