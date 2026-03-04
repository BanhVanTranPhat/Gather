import { useState } from "react";
import { Calendar, Mic, MapPin } from "lucide-react";
import type { Event } from "../../contexts/EventContext";


export type EventLocationType = "voice" | "other";

interface EventCreateWizardProps {
  onClose: () => void;
  onCreate: (event: Partial<Event>) => Promise<unknown>;
  voiceChannelNames: { id: string; name: string }[];
}

const STEPS = ["Thư mục", "Thông tin sự kiện", "Xem lại"] as const;

export default function EventCreateWizard({
  onClose,
  onCreate,
  voiceChannelNames,
}: EventCreateWizardProps) {
  const [step, setStep] = useState(0);
  const [locationType, setLocationType] = useState<EventLocationType | null>(null);
  const [selectedVoiceChannelId, setSelectedVoiceChannelId] = useState<string | null>(null);
  const [locationOther, setLocationOther] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("13:00");
  const [frequency, setFrequency] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationLabel =
    locationType === "voice" && selectedVoiceChannelId
      ? voiceChannelNames.find((c) => c.id === selectedVoiceChannelId)?.name ?? selectedVoiceChannelId
      : locationType === "other"
        ? locationOther
        : "";

  const canNextStep1 = locationType !== null && (locationType === "other" || selectedVoiceChannelId !== null);
  const canNextStep2 = title.trim() && startDate && startTime;
  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else {
      setIsSubmitting(true);
      const [h, m] = startTime.split(":").map(Number);
      const start = new Date(startDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start);
      end.setHours(end.getHours() + 1, 0, 0, 0);
      onCreate({
        title: title.trim(),
        description: description.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location: locationType === "voice" ? `Kênh thoại: ${locationLabel}` : locationOther.trim() || "Trong phòng",
      })
        .then(() => onClose())
        .finally(() => setIsSubmitting(false));
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#313338] rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Steps */}
        <div className="flex border-b border-[#1F2023] px-6 pt-4 pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center">
              <span className={`text-xs font-semibold ${i === step ? "text-[#5865F2]" : "text-slate-500"}`}>
                {label}
              </span>
              <div
                className={`mt-1 h-0.5 w-full rounded ${i === step ? "bg-[#5865F2]" : "bg-[#1F2023]"}`}
              />
            </div>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 0 && (
            <>
              <h2 className="text-lg font-bold text-white mb-1">
                Sự kiện của bạn diễn ra ở đâu?
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Để không ai bị lạc khi truy cập.
              </p>
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    locationType === "voice"
                      ? "border-[#5865F2] bg-[#5865F2]/10"
                      : "border-[#1F2023] hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    checked={locationType === "voice"}
                    onChange={() => setLocationType("voice")}
                    className="mt-1"
                  />
                  <Mic className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-white">Kênh thoại</div>
                    <div className="text-xs text-slate-400">
                      Gặp mặt bằng gọi thoại, video và chia sẻ màn hình.
                    </div>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    locationType === "other"
                      ? "border-[#5865F2] bg-[#5865F2]/10"
                      : "border-[#1F2023] hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    checked={locationType === "other"}
                    onChange={() => setLocationType("other")}
                    className="mt-1"
                  />
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-white">Một nơi nào khác</div>
                    <div className="text-xs text-slate-400">
                      Kênh văn bản, liên kết bên ngoài hoặc địa điểm trực tiếp.
                    </div>
                  </div>
                </label>
              </div>
              {locationType === "voice" && voiceChannelNames.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Chọn kênh *</label>
                  <div className="space-y-1">
                    {voiceChannelNames.map((vc) => (
                      <button
                        key={vc.id}
                        type="button"
                        onClick={() => setSelectedVoiceChannelId(vc.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selectedVoiceChannelId === vc.id
                            ? "bg-[#5865F2]/20 border border-[#5865F2] text-white"
                            : "bg-[#1E1F22] text-slate-300 hover:bg-[#2B2D31]"
                        }`}
                      >
                        <Mic className="w-4 h-4 text-slate-500" />
                        {vc.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {locationType === "other" && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Mô tả địa điểm (tùy chọn)</label>
                  <input
                    type="text"
                    value={locationOther}
                    onChange={(e) => setLocationOther(e.target.value)}
                    placeholder="Ví dụ: Kênh #general, link Meet..."
                    className="w-full px-3 py-2 bg-[#1E1F22] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                  />
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-lg font-bold text-white mb-1">
                Sự kiện của bạn là về chủ đề gì?
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Điền thông tin chi tiết cho sự kiện của bạn.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Chủ đề sự kiện *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Chủ đề sự kiện của bạn là gì?"
                    className="w-full px-3 py-2 bg-[#1E1F22] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày bắt đầu *</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E1F22] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Giờ bắt đầu *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1E1F22] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tần suất</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1E1F22] rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                  >
                    <option value="none">Không lặp lại</option>
                    <option value="daily">Hàng ngày</option>
                    <option value="weekly">Hàng tuần</option>
                    <option value="monthly">Hàng tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Cho mọi người biết thêm về sự kiện..."
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1E1F22] rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#5865F2] resize-none"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="rounded-lg border border-[#1F2023] bg-[#2B2D31] p-4 mb-4">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  {startDate && startTime
                    ? new Date(`${startDate}T${startTime}`).toLocaleString("vi-VN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </div>
                <div className="font-medium text-white">{title || "—"}</div>
                {locationLabel && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                    {locationType === "voice" ? <Mic className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {locationLabel}
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-white mb-1">Đây là bản xem trước sự kiện của bạn.</p>
              <p className="text-xs text-slate-400">Sự kiện này sẽ hiển thị trong danh sách sự kiện của phòng.</p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-[#1F2023]">
          <button
            type="button"
            onClick={step === 0 ? onClose : handleBack}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            {step === 0 ? "Hủy bỏ" : "Trở lại"}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={
              (step === 0 && !canNextStep1) ||
              (step === 1 && !canNextStep2) ||
              isSubmitting
            }
            className="px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {step < 2 ? "Tiếp theo" : isSubmitting ? "Đang tạo…" : "Tạo sự kiện"}
          </button>
        </div>
      </div>
    </div>
  );
}
