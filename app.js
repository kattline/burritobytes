// Firebase Configuration
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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let isEditMode = false;
let currentEditingItem = null;
let itemsToDelete = null;

// Load Menu from Firebase
function loadMenu() {
  const menuRef = database.ref('menu');
  
  menuRef.on('value', (snapshot) => {
    const menuData = snapshot.val();
    
    if (!menuData) {
      initializeDefaultMenu();
      return;
    }
    
    displayMenu(menuData);
  });
}

function initializeDefaultMenu() {
  const defaultMenu = {
    burrito: [
      { id: generateId(), name: "Chicken & Fries Burrito", price: 145 },
      { id: generateId(), name: "Sausage & Egg Burrito", price: 135 },
      { id: generateId(), name: "Beef Burrito", price: 155 },
      { id: generateId(), name: "Pork Burrito", price: 145 }
    ],
    birria: [
      { id: generateId(), name: "Beef Birria (1 piece)", price: 180 },
      { id: generateId(), name: "Beef Birria (2 pieces)", price: 260 },
      { id: generateId(), name: "Chicken Birria (1 piece)", price: 180 },
      { id: generateId(), name: "Chicken Birria (2 pieces)", price: 260 }
    ],
    quesadilla: [
      { id: generateId(), name: "Beef Quesadilla", price: 130 },
      { id: generateId(), name: "Chicken Quesadilla", price: 120 },
      { id: generateId(), name: "Cheesy Quesadilla", price: 100 },
      { id: generateId(), name: "Spinach Quesadilla", price: 140 }
    ]
  };
  
  database.ref('menu').set(defaultMenu);
}

function displayMenu(menuData) {
  const menuSection = document.getElementById("menu");

  const html = `
    <h2>🌯 Burrito</h2>
    <div class="grid">
      ${(menuData.burrito || []).map(item => createCardHTML(item, 'burrito')).join("")}
    </div>

    <h2>🌮 Birria Tacos</h2>
    <div class="grid">
      ${(menuData.birria || []).map(item => createCardHTML(item, 'birria')).join("")}
    </div>

    <h2>🧀 Quesadilla</h2>
    <div class="grid">
      ${(menuData.quesadilla || []).map(item => createCardHTML(item, 'quesadilla')).join("")}
    </div>
  `;

  menuSection.innerHTML = html;
  
  if (isEditMode) {
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.closest('.card').dataset.id;
        const category = btn.closest('.card').dataset.category;
        editItem(itemId, category);
      });
    });
    
    document.querySelectorAll('.delete-card-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const itemId = btn.closest('.card').dataset.id;
        const category = btn.closest('.card').dataset.category;
        const itemName = btn.closest('.card').querySelector('h3').textContent;
        confirmDelete(itemId, category, itemName);
      });
    });
  }
}

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

// Modal Functions
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

// CRUD Operations
function addItem(itemData) {
  const { category, name, price } = itemData;
  const newItem = {
    id: generateId(),
    name: name,
    price: parseInt(price)
  };
  
  database.ref(`menu/${category}`).push(newItem);
}

function editItem(itemId, category) {
  const menuRef = database.ref('menu');
  
  menuRef.once('value').then((snapshot) => {
    const menuData = snapshot.val();
    const categoryItems = menuData[category];
    
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
    
    database.ref(`menu/${category}/${currentEditingItem.itemKey}`).set(updatedItem);
  }
}

function deleteItem(itemId, category) {
  const menuRef = database.ref('menu');
  
  menuRef.once('value').then((snapshot) => {
    const menuData = snapshot.val();
    const categoryItems = menuData[category];
    
    let itemKey = null;
    Object.keys(categoryItems).forEach(key => {
      if (categoryItems[key].id === itemId) {
        itemKey = key;
      }
    });
    
    if (itemKey) {
      database.ref(`menu/${category}/${itemKey}`).remove();
    }
  });
}

function confirmDelete(itemId, category, itemName) {
  itemsToDelete = { itemId, category };
  document.getElementById('deleteItemName').textContent = itemName;
  openDeleteModal();
}

function toggleEditMode() {
  isEditMode = !isEditMode;
  const toggleBtn = document.getElementById('toggleEditBtn');
  
  if (isEditMode) {
    document.body.classList.add('edit-mode');
    toggleBtn.textContent = '❌ Exit Edit';
    toggleBtn.style.background = '#e74c3c';
  } else {
    document.body.classList.remove('edit-mode');
    toggleBtn.textContent = '✏️ Edit Mode';
    toggleBtn.style.background = '#ff8c42';
  }
  
  const menuRef = database.ref('menu');
  menuRef.once('value').then((snapshot) => {
    displayMenu(snapshot.val());
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  loadMenu();
  
  document.getElementById('addItemBtn').addEventListener('click', openModal);
  document.getElementById('toggleEditBtn').addEventListener('click', toggleEditMode);
  
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
  document.querySelector('#cancelBtn').addEventListener('click', closeModal);
  
  document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (itemsToDelete) {
      deleteItem(itemsToDelete.itemId, itemsToDelete.category);
      closeDeleteModal();
    }
  });
  
  document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
  
  window.addEventListener('click', function(e) {
    const itemModal = document.getElementById('itemModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (e.target === itemModal) closeModal();
    if (e.target === deleteModal) closeDeleteModal();
  });
});

// PWA Installation (Original Code)
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const banner = document.getElementById("app-notification-banner");
  banner.classList.add("slide-in");

  const installBtn = document.getElementById("installBtn");

  installBtn.addEventListener("click", async () => {
    banner.classList.remove("slide-in");
    banner.style.transform = "translateX(-50%) translateY(120%)";

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    deferredPrompt = null;
  });
});

document.querySelector(".close-banner-btn").addEventListener("click", () => {
  const banner = document.getElementById("app-notification-banner");
  banner.style.transform = "translateX(-50%) translateY(120%)";
  banner.style.opacity = "0";
  setTimeout(() => banner.remove(), 400);
});

setTimeout(() => {
  const banner = document.getElementById("app-notification-banner");
  if (banner) banner.classList.add("slide-in");
}, 1000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}