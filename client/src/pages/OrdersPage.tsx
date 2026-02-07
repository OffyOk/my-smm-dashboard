import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { OrdersTable } from "../features/orders/OrdersTable";
import { apiFetch } from "../lib/api";
import type { Service, User } from "../lib/types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

type NewOrderDraft = {
  user_id: number | "";
  user_pick: string;
  service_id: number | "";
  service_pick: string;
  link: string;
  quantity: number | "";
  start_count: number | "";
  custom_price: number | null;
  wait_for_prev: boolean;
  remark: string;
};

type ConfirmationItem = {
  orderId?: number;
  message: string;
};

type RefillDraft = {
  order_id: number | "";
  current_count: number | "";
};

const emptyDraft: NewOrderDraft = {
  user_id: "",
  user_pick: "",
  service_id: "",
  service_pick: "",
  link: "",
  quantity: "",
  start_count: "",
  custom_price: null,
  wait_for_prev: false,
  remark: "Original",
};

const emptyRefill: RefillDraft = {
  order_id: "",
  current_count: "",
};

export function OrdersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmations, setConfirmations] = useState<ConfirmationItem[]>([]);
  const [drafts, setDrafts] = useState<NewOrderDraft[]>([{ ...emptyDraft }]);
  const [refillOpen, setRefillOpen] = useState(false);
  const [refills, setRefills] = useState<RefillDraft[]>([{ ...emptyRefill }]);

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: () => apiFetch<Service[]>("/api/services"),
  });

  const usersQuery = useQuery({
    queryKey: ["users", "all"],
    queryFn: () =>
      apiFetch<{ data: User[] }>("/api/users", {
        query: { all: "true" },
      }),
  });

  const serviceMap = useMemo(() => {
    const map = new Map<number, string>();
    (servicesQuery.data ?? []).forEach((service) => {
      map.set(service.id, service.name);
    });
    return map;
  }, [servicesQuery.data]);

  const serviceOptions = useMemo(
    () =>
      (servicesQuery.data ?? []).map(
        (service) => `${service.id} | ${service.name}`,
      ),
    [servicesQuery.data],
  );

  const userOptions = useMemo(
    () =>
      (usersQuery.data?.data ?? []).map((user) =>
        `${user.id} | ${user.username ?? "-"} | ${user.platform_user_id}`.trim(),
      ),
    [usersQuery.data],
  );

  const createOrders = useMutation({
    mutationFn: (payload: { orders: NewOrderDraft[] }) =>
      apiFetch<
        { created_ids?: Array<number> } | Array<{ created_ids?: Array<number> }>
      >("/api/orders/bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (result, variables) => {
      const raw = Array.isArray(result) ? result[0] : result;
      const createdIds = raw?.created_ids ?? [];
      const cleanOrders = variables.orders;
      const messages = cleanOrders.map((order, index) => {
        const orderId = createdIds[index];
        const serviceName =
          serviceMap.get(Number(order.service_id)) ?? String(order.service_id);
        const startCount = Number(order.start_count ?? 0);
        const quantity = Number(order.quantity ?? 0);
        const target = startCount + quantity;
        const safety = target - Math.min(quantity * 0.1, 100);
        const message = buildCustomerMessage({
          orderId,
          serviceName,
          link: order.link,
          startCount,
          quantity,
          target,
          safety,
        });
        return { orderId, message };
      });
      setConfirmations(messages);
      setConfirmOpen(true);
    },
  });

  const sendRefills = useMutation({
    mutationFn: (payload: {
      refills: { order_id: number; current_count: number }[];
    }) =>
      apiFetch("/api/orders/refill-bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });

  function updateDraft(index: number, patch: Partial<NewOrderDraft>) {
    setDrafts((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  function addRow() {
    setDrafts((prev) => [...prev, { ...emptyDraft }]);
  }

  function removeRow(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function submitOrders() {
    const cleaned = drafts.filter(
      (d) => d.service_id !== "" && d.link.trim() !== "" && d.quantity !== "",
    );
    if (!cleaned.length) {
      return;
    }
    createOrders.mutate({
      orders: cleaned.map((d) => ({
        ...d,
        user_id: d.user_id === "" ? "" : Number(d.user_id),
        service_id: Number(d.service_id),
        quantity: Number(d.quantity),
        start_count: d.start_count === "" ? 0 : Number(d.start_count),
        custom_price:
          d.custom_price === null || d.custom_price === undefined
            ? null
            : Number(d.custom_price),
        remark: d.remark?.trim() || "Original",
      })),
    });
    setDialogOpen(false);
    setDrafts([{ ...emptyDraft }]);
  }

  function updateRefill(index: number, patch: Partial<RefillDraft>) {
    setRefills((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  }

  function addRefillRow() {
    setRefills((prev) => [...prev, { ...emptyRefill }]);
  }

  function removeRefillRow(index: number) {
    setRefills((prev) => prev.filter((_, i) => i !== index));
  }

  function submitRefills() {
    const cleaned = refills.filter(
      (r) => r.order_id !== "" && r.current_count !== "",
    );
    if (!cleaned.length) {
      return;
    }
    sendRefills.mutate({
      refills: cleaned.map((r) => ({
        order_id: Number(r.order_id),
        current_count: Number(r.current_count),
      })),
    });
    setRefillOpen(false);
    setRefills([{ ...emptyRefill }]);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Order Manager</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            Monitor the full order lifecycle with instant refill and resubmit
            controls.
          </p>
        </div>
        <div className="hidden flex-wrap gap-2 sm:flex">
          <Button variant="outline" onClick={() => setRefillOpen(true)}>
            Send Refill
          </Button>
          <Button onClick={() => setDialogOpen(true)}>Create Orders</Button>
        </div>
      </div>
      <OrdersTable />

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-slate-800/60 bg-panel-950/95 p-3 backdrop-blur sm:hidden light:border-slate-200 light:bg-white/95">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => setRefillOpen(true)}
        >
          Send Refill
        </Button>
        <Button className="flex-1" onClick={() => setDialogOpen(true)}>
          Create Orders
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Orders</DialogTitle>
            <DialogDescription>
              Add one or more orders and send directly to the n8n webhook.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-slate-800/60 p-3 light:border-slate-200"
              >
                <div className="grid gap-3 lg:grid-cols-[1.2fr_1.6fr_auto]">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Service (type to search)"
                      list="service-list"
                      value={draft.service_pick}
                      onChange={(event) => {
                        const value = event.target.value;
                        const id = Number(value.split("|")[0]?.trim());
                        updateDraft(index, {
                          service_pick: value,
                          service_id: Number.isNaN(id) ? "" : id,
                        });
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateDraft(index, { service_pick: "", service_id: "" })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Link URL"
                    value={draft.link}
                    onChange={(event) =>
                      updateDraft(index, { link: event.target.value })
                    }
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      const cleaned = value.split("?")[0];
                      updateDraft(index, { link: cleaned });
                    }}
                  />
                  <label className="flex items-center gap-2 rounded-md border border-slate-800/60 px-3 py-2 text-xs light:border-slate-200">
                    <input
                      type="checkbox"
                      checked={draft.wait_for_prev}
                      onChange={(event) =>
                        updateDraft(index, {
                          wait_for_prev: event.target.checked,
                        })
                      }
                    />
                    Wait previous
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Quantity"
                    type="number"
                    value={draft.quantity}
                    onChange={(event) =>
                      updateDraft(index, {
                        quantity: event.target.value
                          ? Number(event.target.value)
                          : "",
                      })
                    }
                  />
                  <Input
                    placeholder="Start Count"
                    type="number"
                    value={draft.start_count}
                    onChange={(event) =>
                      updateDraft(index, {
                        start_count: event.target.value
                          ? Number(event.target.value)
                          : "",
                      })
                    }
                  />
                  <Input
                    placeholder="Custom Price (optional)"
                    type="number"
                    step="0.01"
                    value={draft.custom_price ?? ""}
                    onChange={(event) =>
                      updateDraft(index, {
                        custom_price: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="User (type to search)"
                    list="user-list"
                    value={draft.user_pick}
                    onChange={(event) => {
                      const value = event.target.value;
                      const id = Number(value.split("|")[0]?.trim());
                      updateDraft(index, {
                        user_pick: value,
                        user_id: Number.isNaN(id) ? "" : id,
                      });
                    }}
                  />
                  <Input
                    placeholder="Remark"
                    value={draft.remark}
                    onChange={(event) =>
                      updateDraft(index, { remark: event.target.value })
                    }
                  />
                </div>
                {drafts.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRow(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <datalist id="service-list">
              {serviceOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <datalist id="user-list">
              {userOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <Button variant="outline" onClick={addRow}>
              Add Row
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitOrders} disabled={createOrders.isPending}>
              Send Orders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Message</DialogTitle>
            <DialogDescription>
              Copy the message below to reply to your customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {confirmations.map((item, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-slate-800/60 p-3 light:border-slate-200"
              >
                <textarea
                  value={item.message}
                  readOnly
                  className="min-h-[220px] w-full rounded-md border border-slate-800/60 bg-slate-950/60 p-3 text-sm text-slate-100 light:border-slate-200 light:bg-white light:text-slate-900"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(item.message)}
                >
                  Copy Message
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                copyToClipboard(
                  confirmations.map((item) => item.message).join("\n\n"),
                )
              }
            >
              Copy All
            </Button>
            <Button onClick={() => setConfirmOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refillOpen} onOpenChange={setRefillOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Refill Requests</DialogTitle>
            <DialogDescription>
              Send refill items to n8n. Provide order_id and current_count.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {refills.map((refill, index) => (
              <div
                key={index}
                className="grid grid-cols-2 gap-3 rounded-lg border border-slate-800/60 p-3 light:border-slate-200"
              >
                <Input
                  placeholder="Order ID"
                  type="number"
                  value={refill.order_id}
                  onChange={(event) =>
                    updateRefill(index, {
                      order_id: event.target.value
                        ? Number(event.target.value)
                        : "",
                    })
                  }
                />
                <Input
                  placeholder="Current Count"
                  type="number"
                  value={refill.current_count}
                  onChange={(event) =>
                    updateRefill(index, {
                      current_count: event.target.value
                        ? Number(event.target.value)
                        : "",
                    })
                  }
                />
                {refills.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRefillRow(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" onClick={addRefillRow}>
              Add Row
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefillOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRefills} disabled={sendRefills.isPending}>
              Send Refill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildCustomerMessage(input: {
  orderId?: number;
  serviceName: string;
  link: string;
  startCount: number;
  quantity: number;
  target: number;
  safety: number;
}) {
  const expire = new Date();
  expire.setDate(expire.getDate() + 30);
  const formatter = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
  return `ขอบคุณสำหรับคำสั่งซื้อค่ะ 💓\n\n📌 สรุปรายการสั่งซื้อ\nเลขออเดอร์: ${input.orderId ?? "-"}\nบริการ: ${input.serviceName}\nลิงก์: ${input.link}\nยอดเริ่มต้น: ${input.startCount}\nยอดสั่งซื้อ: ${input.quantity}\nยอดที่ต้องได้: ${input.target}\n\n⏰ ระยะเวลาดำเนินการ: 1-24 ชั่วโมง\nหากเกิน 24 ชั่วโมงแล้วยอดยังไม่เปลี่ยนแปลง สามารถติดต่อทางร้านได้เลยค่ะ\n\n⚠️ ข้อควรระวังระหว่างดำเนินการ\n- ห้ามเปลี่ยนชื่อแอคเคาท์\n- ห้ามล็อกแอคเคาท์เป็นส่วนตัว\n\n🛡️ การรับประกัน\nทางร้านรับประกัน 30 วัน (หมดอายุ: ${formatter.format(expire)})\nหากยอดลดลงต่ำกว่า ${input.safety} สามารถแจ้งขอรีฟิลได้ทันทีค่ะ\n\nขอบคุณที่ใช้บริการค่ะ 💖`;
}
