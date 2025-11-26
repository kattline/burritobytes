import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const menuCol = collection(window.db, "menu");

// ADD ITEM
export function addMenuItem(item) {
  return addDoc(menuCol, item);
}

// DELETE ITEM
export function deleteItem(id) {
  return deleteDoc(doc(window.db, "menu", id));
}

// UPDATE ITEM
export function updateItem(id, data) {
  return updateDoc(doc(window.db, "menu", id), data);
}

// REAL-TIME LISTENER
export function listenMenu(callback) {
  return onSnapshot(menuCol, (snapshot) => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}
