"use client";

export type ConstructorTool = "select" | "room" | "wall" | "light" | "dimension" | "delete";

const tools: Array<[ConstructorTool, string, string]> = [
  ["select", "↖", "Вибір"],
  ["room", "▱", "Приміщення"],
  ["wall", "╱", "Стіна"],
  ["light", "✦", "Світло"],
  ["dimension", "↔", "Розмір"],
  ["delete", "⌫", "Видалити"],
];

export function ConstructorToolbar({ tool, onToolChange }: { tool: ConstructorTool; onToolChange: (tool: ConstructorTool) => void }) {
  return <div className="constructor-toolbar" aria-label="Інструменти конструктора">
    {tools.map(([id, icon, label]) => <button key={id} type="button" className={tool === id ? "tool active" : "tool"} onClick={() => onToolChange(id)}>
      <span className="tool-icon">{icon}</span><span>{label}</span>
    </button>)}
  </div>;
}
