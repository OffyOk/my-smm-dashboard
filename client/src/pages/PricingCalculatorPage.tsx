import { useMemo, useState } from "react";
import { Copy, Calculator, Plus, X } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";

const igRates = {
  followers: {
    100: { price: 20, free: 0 },
    200: { price: 40, free: 0 },
    300: { price: 50, free: 0 },
    400: { price: 60, free: 0 },
    500: { price: 70, free: 0 },
    600: { price: 80, free: 0 },
    700: { price: 90, free: 0 },
    800: { price: 100, free: 0 },
    900: { price: 110, free: 0 },
    1000: { price: 119, free: 0 },
    2000: { price: 228, free: 0 },
    3000: { price: 336, free: 0 },
    4000: { price: 444, free: 0 },
    5000: { price: 555, free: 0 },
    6000: { price: 666, free: 0 },
    7000: { price: 759, free: 0 },
    8000: { price: 850, free: 0 },
    9000: { price: 945, free: 0 },
    10000: { price: 1050, free: 0 },
  },
  likes: {
    100: { price: 4, free: 0 },
    200: { price: 8, free: 0 },
    300: { price: 12, free: 0 },
    400: { price: 16, free: 0 },
    500: { price: 20, free: 0 },
    600: { price: 24, free: 0 },
    700: { price: 26, free: 0 },
    800: { price: 28, free: 0 },
    900: { price: 29, free: 0 },
    1000: { price: 30, free: 0 },
    2000: { price: 60, free: 200 },
    3000: { price: 90, free: 300 },
    4000: { price: 120, free: 400 },
    5000: { price: 150, free: 500 },
    6000: { price: 180, free: 600 },
    7000: { price: 210, free: 700 },
    8000: { price: 240, free: 800 },
    9000: { price: 270, free: 900 },
    10000: { price: 300, free: 1000 },
  },
  views: {
    100: { price: 5, free: 0 },
    200: { price: 8, free: 0 },
    300: { price: 10, free: 0 },
    400: { price: 11, free: 0 },
    500: { price: 12, free: 0 },
    600: { price: 14, free: 0 },
    700: { price: 15, free: 0 },
    800: { price: 17, free: 0 },
    900: { price: 18, free: 0 },
    1000: { price: 20, free: 0 },
    2000: { price: 40, free: 0 },
    3000: { price: 60, free: 0 },
    4000: { price: 80, free: 0 },
    5000: { price: 100, free: 1000 },
    6000: { price: 120, free: 1200 },
    7000: { price: 140, free: 1400 },
    8000: { price: 160, free: 1600 },
    9000: { price: 180, free: 1800 },
    10000: { price: 200, free: 2000 },
  },
};

const tiktokRates = {
  followers: {
    100: { price: 20, free: 0 },
    200: { price: 40, free: 0 },
    300: { price: 60, free: 0 },
    400: { price: 80, free: 0 },
    500: { price: 100, free: 0 },
    600: { price: 120, free: 0 },
    700: { price: 140, free: 0 },
    800: { price: 160, free: 0 },
    900: { price: 170, free: 0 },
    1000: { price: 189, free: 0 },
    2000: { price: 378, free: 0 },
    3000: { price: 567, free: 500 },
    4000: { price: 756, free: 800 },
    5000: { price: 945, free: 1200 },
    6000: { price: 1134, free: 1500 },
    7000: { price: 1323, free: 2200 },
    8000: { price: 1512, free: 2800 },
    9000: { price: 1701, free: 3200 },
    10000: { price: 1890, free: 3500 },
  },
  likes: {
    100: { price: 4, free: 0 },
    200: { price: 8, free: 0 },
    300: { price: 12, free: 0 },
    400: { price: 16, free: 0 },
    500: { price: 20, free: 0 },
    600: { price: 24, free: 0 },
    700: { price: 26, free: 0 },
    800: { price: 28, free: 0 },
    900: { price: 29, free: 0 },
    1000: { price: 30, free: 0 },
    2000: { price: 60, free: 0 },
    3000: { price: 90, free: 0 },
    4000: { price: 120, free: 0 },
    5000: { price: 150, free: 1000 },
    6000: { price: 180, free: 1200 },
    7000: { price: 210, free: 1400 },
    8000: { price: 240, free: 1600 },
    9000: { price: 270, free: 1800 },
    10000: { price: 300, free: 2000 },
  },
  views: {
    100: { price: 5, free: 0 },
    200: { price: 8, free: 0 },
    300: { price: 10, free: 0 },
    400: { price: 11, free: 0 },
    500: { price: 12, free: 0 },
    600: { price: 14, free: 0 },
    700: { price: 15, free: 0 },
    800: { price: 17, free: 0 },
    900: { price: 18, free: 0 },
    1000: { price: 20, free: 0 },
    2000: { price: 40, free: 0 },
    3000: { price: 60, free: 0 },
    4000: { price: 80, free: 0 },
    5000: { price: 100, free: 1000 },
    6000: { price: 120, free: 1200 },
    7000: { price: 140, free: 1400 },
    8000: { price: 160, free: 1600 },
    9000: { price: 180, free: 1800 },
    10000: { price: 200, free: 2000 },
  },
};

const fbRates = {
  profile: {
    100: 40,
    200: 50,
    300: 60,
    400: 70,
    500: 80,
    600: 100,
    700: 110,
    800: 120,
    900: 140,
    1000: 159,
    2000: 312,
    3000: 450,
    4000: 592,
    5000: 740,
    6000: 880,
    7000: 1020,
    8000: 1150,
    9000: 1285,
    10000: 1400,
  },
  page: {
    100: 20,
    200: 40,
    300: 50,
    400: 60,
    500: 70,
    600: 80,
    700: 90,
    800: 110,
    900: 120,
    1000: 129,
    2000: 252,
    3000: 364,
    4000: 480,
    5000: 601,
    6000: 712,
    7000: 831,
    8000: 941,
    9000: 1045,
    10000: 1133,
  },
};

const youtubeRates = {
  followers: {
    100: { price: 20, free: 0 },
    200: { price: 35, free: 0 },
    300: { price: 50, free: 0 },
    400: { price: 65, free: 0 },
    500: { price: 80, free: 0 },
    600: { price: 100, free: 0 },
    700: { price: 115, free: 0 },
    800: { price: 125, free: 0 },
    900: { price: 140, free: 0 },
    1000: { price: 149, free: 0 },
    2000: { price: 295, free: 0 },
    3000: { price: 439, free: 0 },
    4000: { price: 579, free: 0 },
    5000: { price: 719, free: 0 },
    6000: { price: 855, free: 0 },
    7000: { price: 989, free: 0 },
    8000: { price: 1129, free: 0 },
    9000: { price: 1269, free: 0 },
    10000: { price: 1399, free: 0 },
  },
};

type RateItem = number | { price: number; free?: number };

type LineItem = {
  platform: string;
  service: string;
  quantity: number;
  link: string;
};

const platforms = [
  { value: "ig", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebookProfile", label: "Facebook Profile" },
  { value: "facebookPage", label: "Facebook Page" },
  { value: "youtube", label: "YouTube" },
];

const services = [
  { value: "followers", label: "Followers" },
  { value: "likes", label: "Likes" },
  { value: "views", label: "Views" },
];

const emptyItem: LineItem = {
  platform: "ig",
  service: "followers",
  quantity: 1000,
  link: "",
};

function normalizeRate(item: RateItem) {
  if (typeof item === "number") {
    return { price: item, free: 0 };
  }
  return { price: item.price, free: item.free ?? 0 };
}

function interpolate(rateSet: Record<number, RateItem>, quantity: number) {
  const quantities = Object.keys(rateSet)
    .map(Number)
    .sort((a, b) => a - b);
  if (!quantities.length || quantity <= 0) {
    return { price: 0, free: 0, note: "" };
  }

  if (rateSet[quantity]) {
    const exact = normalizeRate(rateSet[quantity]);
    return {
      price: exact.price,
      free: exact.free,
      note: `ราคาอ้างอิง ${quantity}`,
    };
  }

  const firstQty = quantities[0];
  const lastQty = quantities[quantities.length - 1];

  if (quantity < firstQty) {
    const first = normalizeRate(rateSet[firstQty]);
    const approx = Math.ceil((first.price * quantity) / firstQty);
    const free = Math.round((first.free * quantity) / firstQty);
    return { price: approx, free, note: `เทียบสัดส่วนขั้นต่ำ ${firstQty}` };
  }

  if (quantity > lastQty) {
    const last = normalizeRate(rateSet[lastQty]);
    const approx = Math.ceil((last.price * quantity) / lastQty);
    const free = Math.round((last.free * quantity) / lastQty);
    return { price: approx, free, note: `เทียบสัดส่วนสูงสุด ${lastQty}` };
  }

  let lowerQty = firstQty;
  let upperQty = lastQty;
  for (let i = 0; i < quantities.length; i++) {
    if (quantity < quantities[i]) {
      upperQty = quantities[i];
      lowerQty = quantities[i - 1];
      break;
    }
  }

  const lower = normalizeRate(rateSet[lowerQty]);
  const upper = normalizeRate(rateSet[upperQty]);
  const ratio = (quantity - lowerQty) / (upperQty - lowerQty);
  const price = Math.round(lower.price + (upper.price - lower.price) * ratio);
  const free = Math.round(lower.free + (upper.free - lower.free) * ratio);
  return {
    price,
    free,
    note: `คำนวณจากช่วง ${lowerQty}-${upperQty}`,
  };
}

function getRateSet(platform: string, service: string) {
  if (platform === "ig") return igRates[service as keyof typeof igRates];
  if (platform === "tiktok")
    return tiktokRates[service as keyof typeof tiktokRates];
  if (platform === "facebookProfile") return fbRates.profile;
  if (platform === "facebookPage") return fbRates.page;
  if (platform === "youtube") return youtubeRates.followers;
  return undefined;
}

function getPlatformLabel(value: string) {
  return platforms.find((p) => p.value === value)?.label ?? value;
}

function getServiceLabel(value: string, platform: string) {
  if (platform === "youtube" && value === "followers") return "Subscribers";
  return services.find((s) => s.value === value)?.label ?? value;
}

function buildServiceLine(item: LineItem, _price: number, free: number) {
  const label = getServiceLabel(item.service, item.platform);
  return free > 0
    ? `- ${label} ${item.quantity} + ${free}`
    : `- ${label} ${item.quantity}`;
}

export function PricingCalculatorPage() {
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);

  const computed = useMemo(() => {
    return items.map((item) => {
      const rateSet = getRateSet(item.platform, item.service);
      const result = rateSet
        ? interpolate(rateSet as Record<number, RateItem>, item.quantity)
        : { price: 0, free: 0, note: "ไม่มีเรทราคา" };
      return { ...item, ...result };
    });
  }, [items]);

  const totals = useMemo(() => {
    const total = computed.reduce((sum, item) => sum + item.price, 0);
    const youtubeFollowers = computed.some(
      (item) =>
        item.platform === "youtube" &&
        item.service === "followers" &&
        item.quantity > 0,
    );
    const hasFollowers = computed.some(
      (item) => item.service === "followers" && item.quantity > 0,
    );
    const hasLikesOrViews = computed.some(
      (item) =>
        (item.service === "likes" || item.service === "views") &&
        item.quantity > 0,
    );
    return { total, youtubeFollowers, hasFollowers, hasLikesOrViews };
  }, [computed]);

  const serviceMessages = useMemo(() => {
    const grouped = new Map<string, string[]>();
    computed.forEach((item) => {
      if (!item.quantity) return;
      const platformLabel = getPlatformLabel(item.platform);
      const lines = grouped.get(platformLabel) ?? [];
      lines.push(buildServiceLine(item, item.price, item.free));
      grouped.set(platformLabel, lines);
    });

    return Array.from(grouped.entries())
      .map(([platformLabel, lines]) => `#${platformLabel}\n${lines.join("\n")}`)
      .join("\n");
  }, [computed]);

  const paymentInstruction = useMemo(() => {
    if (totals.hasFollowers && totals.hasLikesOrViews) {
      return "2️⃣ ส่งลิงก์ account ที่ต้องการเพิ่มฟอล + ลิงก์โพสต์ที่ต้องการเพิ่มไลก์/วิวมาให้ทางร้าน";
    }
    if (totals.hasFollowers) {
      return "2️⃣ ส่งลิงก์ account ที่ต้องการเพิ่มฟอลมาให้ทางร้าน";
    }
    return "2️⃣ ส่งลิงก์โพสต์ที่ต้องการเพิ่มไลก์/วิวมาให้ทางร้าน";
  }, [totals]);

  const summary = useMemo(() => {
    return `ขอบคุณที่ไว้วางใจใช้บริการของเรานะคะ 💖\n\n🌿 รายละเอียดการชำระเงิน 🌿\n\n🏦 โอนผ่านธนาคาร KBANK (กสิกรไทย)\n📇 เลขบัญชี: 200-1-24962-5\n👩 ชื่อบัญชี: โซไลรา โกลบอลซิงค์ (Solyra Globalsync)\n\n--\n\n💳 True Money Wallet สามารถกดลิงก์เพื่อชำระเงินได้เลยค่ะ\n📇 https://tmn.app.link/VmRuLkFV5Ub\n👩 ชื่อบัญชี: นางสาวสุชัญญา นามวงศ์\n\n---\n\n💰 ยอดที่ต้องชำระ: ${totals.total} บาท\n\n🛍️ บริการ:\n${serviceMessages || "-"}\n---\n\n✨ ขั้นตอนหลังการชำระเงิน ✨\n1️⃣ ส่งสลิปการชำระเงิน\n${paymentInstruction}\n3️⃣ ห้ามเปลี่ยนชื่อบัญชี หรือตั้งบัญชีเป็นส่วนตัวระหว่างดำเนินการเพื่มยอด\n4️⃣ เริ่มงานภายใน ${totals.youtubeFollowers ? "24 ชั่วโมง" : "2-3 ชั่วโมง"} หลังได้รับการยืนยันยอดโอน\n\n--\n\n🔐 เพื่อความปลอดภัยของบัญชีคุณลูกค้า\n✅ แนะนำให้ยืนยันอีเมล / เบอร์โทรใน account ให้เรียบร้อย\n🚫 ไม่ต้องส่งรหัสผ่าน อีเมล หรือข้อมูลส่วนตัวให้ทางร้านนะคะ\n\n--\n\nหากมีคำถามเพิ่มเติม สามารถทักแชทได้ตลอดเลยค่ะ 💌\nขอบคุณอีกครั้งนะคะ ขอให้มีวันที่ดีและสดใสค่ะ 🌷😊`;
  }, [totals, serviceMessages, paymentInstruction]);

  async function copy(text: string) {
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

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Pricing Calculator</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            รวมหลายบริการในใบสรุปเดียว พร้อมคัดลอกส่งลูกค้าได้ทันที
          </p>
        </div>
        <Button variant="outline" onClick={() => copy(summary)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Summary
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const platformLabel = getPlatformLabel(item.platform);
              return (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 light:border-slate-200 light:bg-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">บริการ {index + 1}</p>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map((platformItem) => (
                      <Button
                        key={platformItem.value}
                        variant={
                          item.platform === platformItem.value
                            ? "subtle"
                            : "outline"
                        }
                        onClick={() =>
                          updateItem(index, {
                            platform: platformItem.value,
                            service:
                              platformItem.value.startsWith("facebook") ||
                              platformItem.value === "youtube"
                                ? "followers"
                                : item.service,
                          })
                        }
                      >
                        {platformItem.label}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {services.map((serviceItem) => (
                      <Button
                        key={serviceItem.value}
                        variant={
                          item.service === serviceItem.value
                            ? "subtle"
                            : "outline"
                        }
                        onClick={() =>
                          updateItem(index, { service: serviceItem.value })
                        }
                        disabled={
                          item.platform.startsWith("facebook") ||
                          item.platform === "youtube"
                            ? serviceItem.value !== "followers"
                            : false
                        }
                      >
                        {serviceItem.label}
                      </Button>
                    ))}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      type="number"
                      placeholder="จำนวน"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, {
                          quantity: Number(event.target.value),
                        })
                      }
                    />
                    <Input
                      placeholder="ลิงก์ (optional)"
                      value={item.link}
                      onChange={(event) =>
                        updateItem(index, { link: event.target.value })
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Platform: {platformLabel}
                  </p>
                </div>
              );
            })}

            <Button variant="outline" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มบริการ
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-slate-800/60 p-4 text-sm light:border-slate-200">
              <p className="font-mono text-lg text-slate-100 light:text-slate-900">
                {totals.total} บาท
              </p>
              <p className="text-xs text-slate-400">
                รวม {items.length} บริการ
              </p>
            </div>
            <Card className="border border-slate-800/60 light:border-slate-200">
              <CardContent className="pt-4">
                <pre className="whitespace-pre-line text-sm text-slate-200 light:text-slate-700">
                  {summary}
                </pre>
              </CardContent>
            </Card>
            <Button onClick={() => copy(summary)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Summary
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
