import { useState } from "react";
import { audio } from "../../audio";
import { useTownStore } from "../../store";

type Op = "+" | "−" | "×" | "÷";
const KEYS = ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="];

function apply(a: number, b: number, op: Op) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
  }
}

function format(n: number) {
  if (!Number.isFinite(n)) return "Error";
  return String(Number(n.toPrecision(10)));
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);

  const press = (key: string) => {
    audio.uiClick();
    if (/^\d$/.test(key)) {
      setDisplay((d) => (fresh || d === "0" ? key : d + key));
      setFresh(false);
    } else if (key === ".") {
      if (fresh) setDisplay("0.");
      else if (!display.includes(".")) setDisplay(display + ".");
      setFresh(false);
    } else if (key === "C") {
      setDisplay("0"); setAcc(null); setOp(null); setFresh(true);
    } else if (key === "±") {
      setDisplay(format(-Number(display)));
    } else if (key === "%") {
      setDisplay(format(Number(display) / 100));
    } else {
      const current = Number(display);
      const result = acc !== null && op && !fresh ? apply(acc, current, op) : current;
      if (key === "=") {
        setDisplay(format(result));
        setAcc(null); setOp(null); setFresh(true);
        if (format(result) === "42") {
          useTownStore.getState().unlock("answer");
        }
      } else {
        setAcc(result);
        setOp(key as Op);
        setDisplay(format(result));
        setFresh(true);
      }
    }
  };

  return (
    <div className="pc-calc">
      <output>{display}</output>
      <div>
        {KEYS.map((k) => (
          <button key={k} type="button" className={`${/[+−×÷=]/.test(k) ? "op" : ""} ${k === "0" ? "zero" : ""}`} onClick={() => press(k)}>{k}</button>
        ))}
      </div>
    </div>
  );
}
