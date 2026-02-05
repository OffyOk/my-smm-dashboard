import { OrdersTable } from "../features/orders/OrdersTable";

export function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Order Manager</h2>
        <p className="text-sm text-slate-400 light:text-slate-600">
          Monitor the full order lifecycle with instant refill and resubmit controls.
        </p>
      </div>
      <OrdersTable />
    </div>
  );
}
