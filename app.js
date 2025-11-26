// ---------------- FIREBASE INIT ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, ref, push, onValue, update, remove 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const menuRef = ref(db, "menu");


// ---------------- PRELOADED MENU ----------------
const defaultMenu = [
  { name: "Chicken & Fries Burrito", price: 145, category: "burrito" },
  { name: "Sausage & Egg Burrito", price: 135, category: "burrito" },
  { name: "Beef Burrito", price: 155, category: "burrito" },
  { name: "Pork Burrito", price: 145, category: "burrito" },

  { name: "Beef Birria (1 piece)", price: 180, category: "birria" },
  { name: "Beef Birria (2 pieces)", price: 260, category: "birria" },
  { name: "Chicken Birria (1 piece)", price: 180, category: "birria" },
  { name: "Chicken Birria (2 pieces)", price: 260, category: "birria" },

  { name: "Beef Quesadilla", price: 130, category: "quesadilla" },
  { name: "Chicken Quesadilla", price: 120, category: "quesadilla" },
  { name: "Cheesy Quesadilla", price: 100, category: "quesadilla" },
  { name: "Spinach Quesadilla", price: 140, category: "quesadilla" }
];

// Insert default menu only if database is empty
onValue(menuRef, (snapshot) => {
  if (!snapshot.exists()) {
    defaultMenu.forEach(item => push(menuRef, item));
  }
});


// ---------------- FORM ELEMENTS ----------------
const nameInput = document.getElementById("food-name");
const priceInput = document.getElementById("food-price");
const categoryInput = document.getElementById("food-category");
const list = document.getElementById("food-list");
const addBtn = document.getElementById("addFoodBtn");

let editId = null;


// ---------------- ADD / UPDATE ITEM ----------------
addBtn.onclick = () => {
  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const category = categoryInput.value;

  if (!name || !price || !category) {
    alert("Please complete all fields");
    return;
  }

  if (editId === null) {
    push(menuRef, { name, price, category });
  } else {
    update(ref(db, "menu/" + editId), { name, price, category });
    editId = null;
    addBtn.textContent = "Add Item";
  }

  nameInput.value = "";
  priceInput.value = "";
  categoryInput.value = "";
};


// ---------------- REALTIME DISPLAY ----------------
onValue(menuRef, (snapshot) => {
  list.innerHTML = "";
  const data = snapshot.val();

  for (let id in data) {
    const item = data[id];

    list.innerHTML += `
      <div class="card">
        <h3>${item.name}</h3>
        <p class="price">₱${item.price}</p>
        <p>Category: ${item.category}</p>

        <button class="editBtn" onclick="editItem('${id}', '${item.name}', '${item.price}', '${item.category}')">Edit</button>
        <button class="delBtn" onclick="deleteItem('${id}')">Delete</button>
      </div>
    `;
  }
});


// ---------------- EDIT ----------------
window.editItem = (id, name, price, category) => {
  editId = id;
  nameInput.value = name;
  priceInput.value = price;
  categoryInput.value = category;
  addBtn.textContent = "Update Item";
};


// ---------------- DELETE ----------------
window.deleteItem = (id) => {
  if (!confirm("Delete this item?")) return;
  remove(ref(db, "menu/" + id));
};


// ---------------- PWA INSTALL BANNER ----------------
let deferredPrompt;
const banner = document.getElementById("app-notification-banner");
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  banner.classList.add("slide-in");
});

installBtn.onclick = async () => {
  banner.classList.remove("slide-in");
  deferredPrompt.prompt();
};


// ---------------- REGISTER SW ----------------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
