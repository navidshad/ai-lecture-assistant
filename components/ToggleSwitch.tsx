import React from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  icon,
  className = "",
  title,
}) => {
  return (
    <label 
      className={`inline-flex items-center cursor-pointer select-none ${className}`}
      title={title}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className={`block w-8 h-4.5 rounded-full transition-colors duration-200 ${
            checked ? "bg-yellow-500" : "bg-gray-600"
          }`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-3.5" : "translate-x-0"
          }`}
        ></div>
      </div>
      {(label || icon) && (
        <span className="ml-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {icon && <span className={checked ? "text-yellow-500" : ""}>{icon}</span>}
          {label}
        </span>
      )}
    </label>
  );
};

export default ToggleSwitch;
