import { trpc } from "@/providers/trpc";
import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Leaf,
  Beef,
  Coffee,
  Cookie,
  CakeSlice,
  X,
} from "lucide-react";
import { toast } from "sonner";

const categories = [
  { key: "all", label: "All" },
  { key: "veg", label: "Veg", icon: Leaf },
  { key: "non_veg", label: "Non-Veg", icon: Beef },
  { key: "beverage", label: "Beverage", icon: Coffee },
  { key: "snack", label: "Snack", icon: Cookie },
  { key: "dessert", label: "Dessert", icon: CakeSlice },
];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  servingTime: "",
  category: "veg" as "veg" | "non_veg" | "beverage" | "snack" | "dessert",
  imageUrl: "",
  isAvailable: true,
};

export default function AdminMenu() {
  const utils = trpc.useUtils();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: foodItems, isLoading } = trpc.food.list.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchQuery || undefined,
  });

  const createFood = trpc.food.create.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      setShowModal(false);
      setForm(emptyForm);
      toast.success("Food item added!");
    },
  });

  const updateFood = trpc.food.update.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Food item updated!");
    },
  });

  const deleteFood = trpc.food.delete.useMutation({
    onSuccess: () => {
      utils.food.list.invalidate();
      toast.success("Food item deleted!");
    },
  });

  const openEditModal = (item: {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    servingTime: string | null;
    category: string;
    imageUrl: string | null;
    isAvailable: boolean | number;
  }) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: String(item.price),
      stock: String(item.stock),
      servingTime: item.servingTime || "",
      category: item.category as "veg" | "non_veg" | "beverage" | "snack" | "dessert",
      imageUrl: item.imageUrl || "",
      isAvailable: Boolean(item.isAvailable),
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    const stock = parseInt(form.stock, 10);
    if (isNaN(price) || price <= 0) {
      toast.error("Price must be a positive number");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error("Stock must be a non-negative number");
      return;
    }
    const data = {
      name: form.name,
      description: form.description,
      price,
      stock,
      servingTime: form.servingTime,
      category: form.category,
      imageUrl: form.imageUrl,
      isAvailable: form.isAvailable,
    };

    if (editingId) {
      updateFood.mutate({ id: editingId, ...data });
    } else {
      createFood.mutate(data);
    }
  };

  const toggleAvailability = (item: { id: number; isAvailable: boolean | number }) => {
    updateFood.mutate({ id: item.id, isAvailable: !Boolean(item.isAvailable) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.key
                ? "bg-green-600 text-white"
                : "bg-card text-muted-foreground border border-border"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : foodItems?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {foodItems?.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="h-32 bg-muted relative">
                <img
                  src={item.imageUrl || "/placeholder-food.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 bg-card rounded-lg shadow-sm hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this item?")) {
                        deleteFood.mutate({ id: item.id });
                      }
                    }}
                    className="p-1.5 bg-card rounded-lg shadow-sm hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                  <span className="text-green-600 font-bold text-sm">₹{item.price}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Stock: {item.stock}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        item.category === "veg"
                          ? "bg-green-100 text-green-700"
                          : item.category === "non_veg"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      item.isAvailable ? "bg-green-500" : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-card rounded-full shadow transition-transform ${
                        item.isAvailable ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                {editingId ? "Edit Item" : "Add New Item"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-accent rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Stock *</label>
                  <input
                    type="number"
                    required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as typeof form.category })}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="veg">Veg</option>
                    <option value="non_veg">Non-Veg</option>
                    <option value="beverage">Beverage</option>
                    <option value="snack">Snack</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Serving Time</label>
                  <input
                    type="text"
                    value={form.servingTime}
                    onChange={(e) => setForm({ ...form, servingTime: e.target.value })}
                    placeholder="e.g., All Day"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Image</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className={`px-3 py-1 text-xs rounded-lg font-medium ${form.imageUrl ? "bg-muted text-muted-foreground" : "bg-green-600 text-white"}`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "https://" })}
                    className={`px-3 py-1 text-xs rounded-lg font-medium ${form.imageUrl?.startsWith("https://") || form.imageUrl?.startsWith("http://") ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    URL
                  </button>
                </div>
                {form.imageUrl?.startsWith("http") ? (
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          if (!res.ok) throw new Error("Upload failed");
                          const data = await res.json();
                          if (data.url) setForm({ ...form, imageUrl: data.url });
                        } catch {
                          toast.error("File upload failed");
                        }
                      }}
                      className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 file:font-medium hover:file:bg-green-100"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="rounded border-input text-green-600 focus:ring-green-500"
                />
                <label htmlFor="isAvailable" className="text-sm text-foreground">
                  Available for ordering
                </label>
              </div>
              <button
                type="submit"
                disabled={createFood.isPending || updateFood.isPending}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold active:scale-[0.98] transition-transform disabled:opacity-70"
              >
                {editingId ? "Update Item" : "Add Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
