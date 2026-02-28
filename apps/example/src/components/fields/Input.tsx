import type { ComponentProps } from "react";

type InputProps = ComponentProps<"input"> & {
	label?: string;
	error?: string;
	required?: boolean;
};

export function Input({ label, error, required, className, ...props }: InputProps) {
	return (
		<div className={`field ${className || ""}`}>
			{label && (
				<label className="field-label">
					{label}
					{required && <span className="required">*</span>}
				</label>
			)}
			<input {...props} className={`field-input ${error ? "field-input-error" : ""}`} />
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}
