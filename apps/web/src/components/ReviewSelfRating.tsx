import { useState } from "react";
import { applyReview, dueLabel } from "../store/progress";

const RATINGS = [
  { value: 1, label: "忘了", emoji: "😵" },
  { value: 2, label: "模糊", emoji: "🤔" },
  { value: 3, label: "记得", emoji: "🙂" },
  { value: 4, label: "轻松", emoji: "😎" },
] as const;

/** AC 后的复习自评（SM-2）：仅对已进入复习计划的题显示 */
export default function ReviewSelfRating({ slug }: { slug: string }) {
  const [rated, setRated] = useState<number | null>(null);
  const [nextLabel, setNextLabel] = useState<string>("");

  const rate = (value: number) => {
    const after = applyReview(slug, value);
    setRated(value);
    setNextLabel(dueLabel(after));
  };

  if (rated !== null) {
    return (
      <div className="self-rating">
        <span className="rating-done">✅ 已记录，{nextLabel}后再见</span>
      </div>
    );
  }

  return (
    <div className="self-rating">
      <span className="rating-label">复习自评（决定下次复习间隔）：</span>
      {RATINGS.map((r) => (
        <button key={r.value} type="button" className="btn ghost rating-btn" onClick={() => rate(r.value)}>
          {r.emoji} {r.label}
        </button>
      ))}
    </div>
  );
}
