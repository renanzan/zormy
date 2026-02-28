import type { ComponentProps } from "react";

type SelectProps = ComponentProps<"select"> & {
	label?: string;
	error?: string;
	required?: boolean;
	options: Array<{ value: string; label: string }>;
};

export function Select({ label, error, required, options, className, ...props }: SelectProps) {
	return (
		<div className={`field ${className || ""}`}>
			{label && (
				<label className="field-label">
					{label}
					{required && <span className="required">*</span>}
				</label>
			)}
			<select {...props} className={`field-input ${error ? "field-input-error" : ""}`}>
				<option value="">Selecione...</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{error && <span className="field-error">{error}</span>}
		</div>
	);
}
