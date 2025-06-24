"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { API_BASE_URL } from '@/lib/api'

interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  payment_status: string;
  tracking?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editing, setEditing] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTracking, setEditTracking] = useState("");

  useEffect(() => {
    if (user?.isAdmin) fetchOrders();
    // eslint-disable-next-line
  }, [user, page]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/orders?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Error al cargar pedidos");
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (order: Order) => {
    setEditing(order.id);
    setEditStatus(order.status);
    setEditTracking(order.tracking || "");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditStatus("");
    setEditTracking("");
  };

  const updateOrder = async (orderId: number, status: string, tracking?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status, tracking }),
      });
      if (res.ok) {
        fetchOrders();
        setEditing(null);
      }
    } catch (err: any) {
      console.error('Error updating order:', err);
    }
  };

  if (!user?.isAdmin) {
    return <div className="p-8 text-center text-red-500">Acceso denegado.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Gestión de Pedidos</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Usuario</th>
                <th className="px-4 py-2">Pedido</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Pago</th>
                <th className="px-4 py-2">Tracking</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2">{order.id}</td>
                  <td className="px-4 py-2">{order.user_id}</td>
                  <td className="px-4 py-2">{order.order_number}</td>
                  <td className="px-4 py-2">
                    {editing === order.id ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="border rounded px-2 py-1"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="capitalize font-semibold">{order.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{order.payment_status}</td>
                  <td className="px-4 py-2">
                    {editing === order.id ? (
                      <input
                        type="text"
                        value={editTracking}
                        onChange={(e) => setEditTracking(e.target.value)}
                        className="border rounded px-2 py-1"
                        placeholder="Nº seguimiento"
                      />
                    ) : (
                      <span>{order.tracking || "-"}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{order.currency} {order.total.toFixed(2)}</td>
                  <td className="px-4 py-2">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {editing === order.id ? (
                      <>
                        <button
                          onClick={() => updateOrder(order.id, editStatus, editTracking)}
                          className="bg-green-600 text-white px-3 py-1 rounded mr-2 hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(order)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 flex justify-center items-center gap-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 