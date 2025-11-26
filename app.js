// ---------------- FIREBASE ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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


// ---------------- ELEMENTS ----------------
const foodList = document.getElementById("food-list");

const crudModal = document.getElementById("crudModal");
const deleteModal = document.getElementById("deleteModal");

const modalTitle = document.getElementById("modalTitle");
const saveBtn = document.getElementById("saveBtn");

const nameInput = document.getElementById("food-name");
const priceInput = document.getElementById("food-price");
const categoryInput = document.getElementById("food-category");

let currentEditID = null;
let deleteID = null;


// ---------------- OPEN ADD MODAL ----------------
document.getElementById("openAddModal").onclick = () => {
    modalTitle.textContent = "Add Food Item";
    saveBtn.textContent = "Add";
    currentEditID = null;

    nameInput.value = "";
    priceInput.value = "";
    categoryInput.value = "";

    crudModal.classList.remove("hidden");
};


// ---------------- SAVE (ADD or UPDATE) ----------------
saveBtn.onclick = () => {
    const item = {
        name: nameInput.value,
        price: Number(priceInput.value),
        category: categoryInput.value,
    };

    if (!item.name || !item.price || !item.category) {
        alert("Fill all fields.");
        return;
    }

    if (currentEditID === null) {
        push(menuRef, item);  // ADD
    } else {
        update(ref(db, "menu/" + currentEditID), item); // UPDATE
    }

    crudModal.classList.add("hidden");
};


// ---------------- CANCEL CRUD MODAL ----------------
document.getElementById("closeCrudModal").onclick = () => {
    crudModal.classList.add("hidden");
};


// ---------------- OPEN DELETE MODAL ----------------
window.deleteItem = (id) => {
    deleteID = id;
    deleteModal.classList.remove("hidden");
};

document.getElementById("closeDeleteModal").onclick = () => {
    deleteModal.classList.add("hidden");
};

document.getElementById("confirmDelete").onclick = () => {
    remove(ref(db, "menu/" + deleteID));
    deleteModal.classList.add("hidden");
};


// ---------------- EDIT ----------------
window.editItem = (id, name, price, category) => {
    currentEditID = id;

    modalTitle.textContent = "Edit Food Item";
    saveBtn.textContent = "Update";

    nameInput.value = name;
    priceInput.value = price;
    categoryInput.value = category;

    crudModal.classList.remove("hidden");
};


// ---------------- DISPLAY REAL-TIME ----------------
onValue(menuRef, (snapshot) => {
    foodList.innerHTML = "";
    const data = snapshot.val();

    for (let id in data) {
        const item = data[id];

        foodList.innerHTML += `
            <div class="card">
                <h3>${item.name}</h3>
                <p>₱${item.price}</p>
                <small>${item.category}</small>
                <br><br>

                <button class="editBtn" onclick="editItem('${id}', '${item.name}', '${item.price}', '${item.category}')">Edit</button>
                <button class="delBtn" onclick="deleteItem('${id}')">Delete</button>
            </div>
        `;
    }
});


// ---------------- INSTALL BANNER ----------------
let deferredPrompt;
const banner = document.getElementById("install-banner");
const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    banner.classList.remove("hidden");
});

// install
installBtn.onclick = async () => {
    banner.classList.add("hidden");
    deferredPrompt.prompt();
};

// close banner
document.getElementById("closeBanner").onclick = () => {
    banner.classList.add("hidden");
};


// ---------------- SERVICE WORKER ----------------
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
