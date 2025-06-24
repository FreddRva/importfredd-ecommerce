"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  featured?: boolean;
  description?: string;
}

export default function AdminProductsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/admin/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Forzar el campo featured a booleano
        setProducts(
          (data.products || []).map((p: any) => ({
            ...p,
            featured: p.featured === true || p.featured === "true"
          }))
        );
      } else {
        console.error("Failed to fetch products");
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, router]);

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:8080/admin/products/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          fetchProducts();
          alert("Producto eliminado");
        } else {
          const data = await res.json();
          alert(`Error al eliminar: ${data.error || "Error desconocido"}`);
        }
      } catch (err) {
        alert("Error de red al intentar eliminar el producto.");
      }
    }
  };

  const handleToggleFeatured = async (id: number, featured: boolean) => {
    try {
      const token = localStorage.getItem("token");
      // Obtener datos actuales del producto
      const resGet = await fetch(`http://localhost:8080/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resGet.ok) {
        alert("No se pudo obtener el producto actual");
        return;
      }
      const data = await resGet.json();
      const product = data.product;
      // Enviar todos los campos requeridos + featured actualizado como FormData
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("description", product.description || "");
      formData.append("price", String(product.price));
      formData.append("stock", String(product.stock));
      formData.append("category_id", String(product.category_id));
      formData.append("is_active", String(product.is_active));
      formData.append("featured", String(featured));

      const res = await fetch(`http://localhost:8080/admin/products/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // No se debe poner Content-Type, el navegador lo setea automáticamente para FormData
        },
        body: formData,
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p =>
            p.id === id ? { ...p, featured } : p
          )
        );
        fetchProducts();
      } else {
        const data = await res.json();
        alert(`Error al actualizar: ${data.error || "Error desconocido"}`);
      }
    } catch (err) {
      alert("Error de red al intentar actualizar el producto.");
    }
  };

  if (isLoading || loadingProducts) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Administrar Productos</h1>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <PlusCircle size={16} /> Nuevo Producto
        </button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destacado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {product.is_active ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Sí
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="checkbox"
                    checked={!!product.featured}
                    onChange={e => handleToggleFeatured(product.id, e.target.checked)}
                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 