// ---------------- FIREBASE CONFIGURATION ----------------
const firebaseConfig = {
  apiKey: "AIzaSyCGg-TXDVDfMsQnypWvC8kKWWp85WPrUgg",
  authDomain: "burrito-bytes.firebaseapp.com",
  databaseURL: "https://burrito-bytes-default-rtdb.firebaseio.com",
  projectId: "burrito-bytes",
  storageBucket: "burrito-bytes.firebasestorage.app",
  messagingSenderId: "76748051170",
  appId: "1:76748051170:web:14405c2e873477b50384bb",
  measurementId: "G-3NSJ2FNC2F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ---------------- GLOBAL VARIABLES ----------------
let isEditMode = false;
let currentEditingItem = null;
let itemsToDelete = null;
let deferredPrompt;

// ---------------- DEFAULT MENU DATA ----------------
const defaultMenuData = {
  burrito: [
    { id: '1', name: "Chicken & Fries Burrito", price: 145 },
    { id: '2', name: "Sausage & Egg Burrito", price: 135 },
    { id: '3', name: "Beef Burrito", price: 155 },
    { id: '4', name: "Pork Burrito", price: 145 }
  ],
  birria: [
    { id: '5', name: "Beef Birria (1 piece)", price: 180 },
    { id: '6', name: "Beef Birria (2 pieces)", price: 260 },
    { id: '7', name: "Chicken Birria (1 piece)", price: 180 },
    { id: '8', name: "Chicken Birria (2 pieces)", price: 260 }
  ],
  quesadilla: [
    { id: '9', name: "Beef Quesadilla", price: 130 },
    { id: '10', name: "Chicken Quesadilla", price: 120 },
    { id: '11', name: "Cheesy Quesadilla", price: 100 },
    { id: '12', name: "Spinach Quesadilla", price: 140 }
  ]
};

// ---------------- LOAD MENU FROM FIREBASE ----------------
function loadMenu() {
  console.log("Loading menu from Firebase...");
  const menuRef = database.ref('menu');
  
  menuRef.on('value', (snapshot) => {
    const menuData = snapshot.val();
    console.log("Firebase data:", menuData);
    
    if (!menuData) {
      console.log("No data in Firebase, initializing default menu...");
      initializeDefaultMenu();
    } else {
      console.log("Displaying menu from Firebase");
      displayMenu(menuData);
    }
  }, (error) => {
    console.error("Firebase error:", error);
    // Fallback to default data if Firebase fails
    displayMenu(defaultMenuData);
  });
}

// ---------------- INITIALIZE DEFAULT MENU ----------------
function initializeDefaultMenu() {
  console.log("Initializing default menu in Firebase...");
  
  // Convert array to object format for Firebase
  const firebaseMenuData = {};
  
  Object.keys(defaultMenuData).forEach(category => {
    firebaseMenuData[category] = {};
    defaultMenuData[category].forEach((item, index) => {
      firebaseMenuData[category][`item${index + 1}`] = item;
    });
  });
  
  database.ref('menu').set(firebaseMenuData)
    .then(() => {
      console.log("Default menu saved to Firebase");
      displayMenu(firebaseMenuData);
    })
    .catch((error) => {
      console.error("Error saving to Firebase:", error);
      // Display default data even if Firebase fails
      displayMenu(defaultMenuData);
    });
}

// ---------------- DISPLAY MENU ----------------
function displayMenu(menuData) {
  const menuSection = document.getElementById("menu");
  console.log("Displaying menu:", menuData);

  let html = '';

  // Burrito Section
  html += `<h2>🌯 Burrito</h2><div class="grid">`;
  if (menuData.burrito) {
    const burritoItems = Array.isArray(menuData.burrito) ? 
      menuData.burrito : Object.values(menuData.burrito);
    html += burritoItems.map(item => createCardHTML(item, 'burrito')).join("");
  }
  html += `</div>`;

  // Birria Section
  html += `<h2>🌮 Birria Tacos</h2><div class="grid">`;
  if (menuData.birria) {
    const birriaItems = Array.isArray(menuData.birria) ? 
      menuData.birria : Object.values(menuData.birria);
    html += birriaItems.map(item => createCardHTML(item, 'birria')).join("");
  }
  html += `</div>`;

  // Quesadilla Section
  html += `<h2>🧀 Quesadilla</h2><div class="grid">`;
  if (menuData.quesadilla) {
    const quesadillaItems = Array.isArray(menuData.quesadilla) ? 
      menuData.quesadilla : Object.values(menuData.quesadilla);
    html += quesadillaItems.map(item => createCardHTML(item, 'quesadilla')).join("");
  }
  html += `</div>`;

  menuSection.innerHTML = html;
  
  // Add event listeners to action buttons if in edit mode
  if (isEditMode) {
    attachEditDeleteListeners();
  }
}

// ---------------- CREATE CARD HTML ----------------
function createCardHTML(item, category) {
  return `
    <div class="card" data-id="${item.id}" data-category="${category}">
      ${isEditMode ? `
        <div class="card-actions">
          <button class="edit-btn" title="Edit">✏️</button>
          <button class="delete-card-btn" title="Delete">🗑️</button>
        </div>
      ` : ''}
      <h3>${item.name}</h3>
      <p class="price">₱${item.price}</p>
    </div>
  `;
}

// ---------------- ATTACH EDIT/DELETE LISTENERS ----------------
function attachEditDeleteListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.card');
      const itemId = card.dataset.id;
      const category = card.dataset.category;
      editItem(itemId, category);
    });
  });
  
  document.querySelectorAll('.delete-card-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.card');
      const itemId = card.dataset.id;
      const category = card.dataset.category;
      const itemName = card.querySelector('h3').textContent;
      confirmDelete(itemId, category, itemName);
    });
  });
}

// ---------------- MODAL FUNCTIONS ----------------
function openModal() {
  document.getElementById('itemModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('itemModal').style.display = 'none';
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  currentEditingItem = null;
  document.getElementById('modalTitle').textContent = 'Add New Item';
  document.getElementById('category').disabled = false;
}

function openDeleteModal() {
  document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
  itemsToDelete = null;
}

// ---------------- CRUD OPERATIONS ----------------
function addItem(itemData) {
  const { category, name, price } = itemData;
  const newItem = {
    id: generateId(),
    name: name,
    price: parseInt(price)
  };
  
  const newItemKey = 'item' + Date.now();
  database.ref(`menu/${category}/${newItemKey}`).set(newItem)
    .then(() => {
      console.log("Item added successfully");
    })
    .catch((error) => {
      console.error("Error adding item:", error);
    });
}

function editItem(itemId, category) {
  const menuRef = database.ref('menu');
  
  menuRef.once('value').then((snapshot) => {
    const menuData = snapshot.val();
    const categoryItems = menuData[category];
    
    // Find the item by id
    let itemToEdit = null;
    let itemKey = null;
    
    Object.keys(categoryItems).forEach(key => {
      if (categoryItems[key].id === itemId) {
        itemToEdit = categoryItems[key];
        itemKey = key;
      }
    });
    
    if (itemToEdit) {
      currentEditingItem = { category, itemKey, itemId };
      document.getElementById('modalTitle').textContent = 'Edit Item';
      document.getElementById('itemId').value = itemId;
      document.getElementById('category').value = category;
      document.getElementById('name').value = itemToEdit.name;
      document.getElementById('price').value = itemToEdit.price;
      document.getElementById('category').disabled = true;
      openModal();
    }
  });
}

function updateItem(itemData) {
  const { category, name, price } = itemData;
  
  if (currentEditingItem) {
    const updatedItem = {
      id: currentEditingItem.itemId,
      name: name,
      price: parseInt(price)
    };
    
    database.ref(`menu/${category}/${currentEditingItem.itemKey}`).set(updatedItem)
      .then(() => {
        console.log("Item updated successfully");
      })
      .catch((error) => {
        console.error("Error updating item:", error);
      });
  }
}

function deleteItem(itemId, category) {
  const menuRef = database.ref('menu');
  
  menuRef.once('value').then((snapshot) => {
    const menuData = snapshot.val();
    const categoryItems = menuData[category];
    
    // Find the item key by id
    let itemKey = null;
    Object.keys(categoryItems).forEach(key => {
      if (categoryItems[key].id === itemId) {
        itemKey = key;
      }
    });
    
    if (itemKey) {
      database.ref(`menu/${category}/${itemKey}`).remove()
        .then(() => {
          console.log("Item deleted successfully");
        })
        .catch((error) => {
          console.error("Error deleting item:", error);
        });
    }
  });
}

function confirmDelete(itemId, category, itemName) {
  itemsToDelete = { itemId, category };
  document.getElementById('deleteItemName').textContent = itemName;
  openDeleteModal();
}

// ---------------- TOGGLE EDIT MODE ----------------
function toggleEditMode() {
  isEditMode = !isEditMode;
  const toggleBtn = document.getElementById('toggleEditBtn');
  
  if (isEditMode) {
    document.body.classList.add('edit-mode');
    toggleBtn.textContent = '❌ Exit Edit';
    toggleBtn.style.background = '#e74c3c';
    attachEditDeleteListeners();
  } else {
    document.body.classList.remove('edit-mode');
    toggleBtn.textContent = '✏️ Edit Mode';
    toggleBtn.style.background = '#ff8c42';
  }
}

// ---------------- UTILITY FUNCTIONS ----------------
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ---------------- PWA INSTALLATION ----------------
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install banner
  const banner = document.getElementById('app-notification-banner');
  banner.classList.add('slide-in');
  
  // Remove the banner after 10 seconds if not clicked
  setTimeout(() => {
    if (banner.classList.contains('slide-in')) {
      banner.classList.remove('slide-in');
    }
  }, 10000);
});

// Install button click handler
document.getElementById('installBtn').addEventListener('click', async () => {
  console.log('Install button clicked');
  const banner = document.getElementById('app-notification-banner');
  
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Hide the install banner
    banner.classList.remove('slide-in');
    
    // We've used the prompt, and can't use it again, throw it away
    deferredPrompt = null;
  }
});

// Close banner button
document.querySelector('.close-banner-btn').addEventListener('click', () => {
  const banner = document.getElementById('app-notification-banner');
  banner.classList.remove('slide-in');
});

// ---------------- EVENT LISTENERS ----------------
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing app...");
  
  // Load menu
  loadMenu();
  
  // Admin controls
  document.getElementById('addItemBtn').addEventListener('click', () => {
    document.getElementById('category').disabled = false;
    openModal();
  });
  
  document.getElementById('toggleEditBtn').addEventListener('click', toggleEditMode);
  
  // Modal events
  document.getElementById('itemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const itemData = {
      category: document.getElementById('category').value,
      name: document.getElementById('name').value,
      price: document.getElementById('price').value
    };
    
    if (currentEditingItem) {
      updateItem(itemData);
    } else {
      addItem(itemData);
    }
    
    closeModal();
  });
  
  document.querySelector('.close').addEventListener('click', closeModal);
  document.querySelector('.cancel-btn').addEventListener('click', closeModal);
  
  // Delete modal events
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (itemsToDelete) {
      deleteItem(itemsToDelete.itemId, itemsToDelete.category);
      closeDeleteModal();
    }
  });
  
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  
  // Close modals when clicking outside
  window.addEventListener('click', function(e) {
    const itemModal = document.getElementById('itemModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (e.target === itemModal) closeModal();
    if (e.target === deleteModal) closeDeleteModal();
  });
});

// ---------------- SERVICE WORKER ----------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js')
      .then(function(registration) {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}