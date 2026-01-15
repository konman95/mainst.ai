export type Contact = { id: string; name?: string; email?: string };

const seed: Contact[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Lee", email: "bob@example.com" }
];

let store: Contact[] | null = null;

function ensureStore() {
  if (!store) store = seed.map(contact => ({ ...contact }));
  return store;
}

export function getContacts() {
  return ensureStore();
}

export function addContact(body: Partial<Contact>) {
  const contact: Contact = { id: String(Date.now()), ...body };
  ensureStore().push(contact);
  return contact;
}

export function updateContact(id: string, body: Partial<Contact>) {
  const data = ensureStore();
  const idx = data.findIndex(contact => contact.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...body };
  return data[idx];
}

export function removeContact(id: string) {
  const data = ensureStore();
  const idx = data.findIndex(contact => contact.id === id);
  if (idx === -1) return false;
  data.splice(idx, 1);
  return true;
}
