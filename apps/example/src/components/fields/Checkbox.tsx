import type { ComponentProps } from "react";

type CheckboxProps = ComponentProps<"input"> & {
	label?: string;
	error?: string;
};

export function Checkbox({ label, error, className, ...props }: CheckboxProps) {
	return (
		<div className={`field field-checkbox ${className || ""}`}>
			<label className="field-checkbox-label">
				<input type="checkbox" {...props} className="field-checkbox-input" />
				<span>{label}</span>
			</label>
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}
