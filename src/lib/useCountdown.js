import { useEffect, useState } from "react";

function diffToParts(targetMs) {
  const total = Math.max(0, targetMs - Date.now());
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { days, hours, minutes, seconds, done: total === 0 };
}

export function useCountdown(targetDate) {
  const targetMs = new Date(targetDate).getTime();
  const [parts, setParts] = useState(() => diffToParts(targetMs));

  useEffect(() => {
    const id = setInterval(() => setParts(diffToParts(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return parts;
}
