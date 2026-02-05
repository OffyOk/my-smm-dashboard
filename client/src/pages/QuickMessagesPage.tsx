import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const quickMessages = [
  "สวัสดีค่ะ 🌟 คุณลูกค้าสนใจบริการไหน(IG,TT,FB) ยอดเท่าไหร่ หรืออยากสอบถามอะไรเพิ่มเติม สามารถสอบถามได้เลยนะคะ 💕",
  "คุณลูกค้าสามารถดูเรทราคาและรายละเอียดได้โดยการคลิกเมนูด้านล่างได้เลยนะคะ 🎀\nหรือคลิกจากลิงก์นี้ได้เลยค่า\nhttps://solyra.crd.co/",
  "สวัสดีค่ะ คุณลูกค้าสนใจเพิ่มยอดเท่าไรดีคะ 🤗💗",
  "เดี๋ยวทางร้านรีฟิลให้นะคะ 💓 ",
  "ขออภัยค่ะคุณลูกค้า ทางร้านรับขั้นต่ำ 100 ฟอล / ไลก์ / วิว ต่อครั้งนะคะ\nแต่สามารถซื้อยอด 100 แล้วแบ่งโพสต์หรือบัญชีได้ค่ะ 💖\nเช่น ซื้อไลก์ 100 ไลก์ก็สามารถแบ่งได้ 2 โพสต์ค่ะ 😊",
  "ถ้าคุณลูกค้าโอนเงินแล้ว รบกวนส่งสลิปให้ทางร้านด้วยนะคะ แล้วเดี๋ยวทางร้านจะเริ่มงานให้ค่ะ 💓",
  "รบกวนเปิดสาธารณะให้ด้วยนะคะ",
];

export function QuickMessagesPage() {
  const [filter, setFilter] = useState("");

  const filtered = quickMessages.filter((message) =>
    message.toLowerCase().includes(filter.toLowerCase())
  );

  async function copyMessage(text: string) {
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
          <h2 className="text-2xl font-semibold">Quick Messages</h2>
          <p className="text-sm text-slate-400 light:text-slate-600">
            One-click responses for admin chat. Tap copy, paste to customer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-400">{filtered.length} messages</span>
        </div>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Search message..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((message, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <CardTitle className="text-base">Message {index + 1}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => copyMessage(message)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-slate-200 light:text-slate-700">
                {message}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
