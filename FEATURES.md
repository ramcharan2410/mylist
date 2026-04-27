### What's built

**Backend (API Routes)**
| Route | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account, sets httpOnly JWT cookie |
| `/api/auth/login` | POST | Sign in |
| `/api/auth/logout` | POST | Clear cookie |
| `/api/auth/me` | GET | Current user |
| `/api/lists` | GET/POST | Get all lists / create list |
| `/api/lists/[id]` | GET/PATCH/DELETE | Get with items / rename / delete (cascades items) |
| `/api/lists/[id]/duplicate` | POST | Clone list, reset all isChecked |
| `/api/lists/[id]/items` | POST | Add item (returns 409 + existingId if duplicate name) |
| `/api/items/[id]` | PATCH/DELETE | Toggle check / delete item |
| `/api/items/reorder` | PATCH | Persist new drag-sorted positions |

**Prisma Schema** — `User → List → Item` with `@@unique([listId, name])` enforcing no duplicate item names per list at DB level.

**Features implemented**
- Register / login — no email verification, password show/hide toggle
- JWT in httpOnly cookie (7-day), middleware protects `/dashboard` and `/lists/*`
- Anti-FOUC inline script — dark mode applied before React paint
- Dashboard: sort (newest/oldest/A–Z), progress bars on cards, action menu (rename/duplicate/delete with confirm modal)
- List detail: add item with unit + amount dropdowns, `Custom` amount option, duplicate-name detection → toast + smooth scroll + CSS flash highlight
- Check/uncheck items (optimistic update), strikethrough style on checked
- Filter tabs: All / Active / Checked with live counts
- Debounced search bar (200ms)
- "Clear checked" bulk action with confirm modal
- Drag-to-reorder with `@dnd-kit` (vertical axis, pointer + touch + keyboard sensors) — disabled when filter/search active with an explanatory hint

---

### To run locally

1. **Update .env** with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/mylist"
   ```
2. **Migrate DB:**
   ```bash
   cd mylist
   npx prisma migrate dev --name init
   ```
3. **Start dev server:**
   ```bash
   npm run dev
   ```
   → opens at `http://localhost:3000`

Made changes.