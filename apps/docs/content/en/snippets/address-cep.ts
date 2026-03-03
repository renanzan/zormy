/**
 * Snippet: Address form with CEP (Brazilian postal code) lookup via ViaCEP API
 * @see https://zormy.dev/en/examples/address-cep
 */
export const addressCepCode = `import { z } from "zod";
import { useEffect } from "react";
import { field, Form, useZormy } from "zormy";

// ViaCEP response shape
type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
};

const CepField = field("address.cep")
  .schema(z.string().regex(/^\\d{5}-?\\d{3}$/, "Invalid CEP (use 00000-000)"))
  .render(({ register, fieldState }) => (
    <div>
      <label>CEP</label>
      <input placeholder="00000-000" {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

const StreetField = field("address.street")
  .schema(z.string().min(1, "Required"))
  .render(({ register, fieldState }) => (
    <div>
      <label>Street</label>
      <input {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

const NeighborhoodField = field("address.neighborhood")
  .schema(z.string())
  .render(({ register }) => (
    <div>
      <label>Neighborhood</label>
      <input {...register()} />
    </div>
  ));

const CityField = field("address.city")
  .schema(z.string().min(1, "Required"))
  .render(({ register, fieldState }) => (
    <div>
      <label>City</label>
      <input {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

const StateField = field("address.state")
  .schema(z.string().length(2, "UF (2 letters)"))
  .render(({ register, fieldState }) => (
    <div>
      <label>State (UF)</label>
      <input placeholder="SP" maxLength={2} {...register()} />
      {fieldState.error && (
        <span style={{ color: "red" }}>{fieldState.error.message}</span>
      )}
    </div>
  ));

const fields = [CepField, StreetField, NeighborhoodField, CityField, StateField];

function AddressForm() {
  const form = useZormy({
    fields,
    defaultValues: {
      address: {
        cep: "",
        street: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
  });

  const cep = form.watch("address.cep");
  const cepClean = cep?.replace(/\\D/g, "") ?? "";

  useEffect(() => {
    if (cepClean.length !== 8) return;

    fetch(\`https://viacep.com.br/ws/\${cepClean}/json/\`)
      .then((res) => res.json())
      .then((data: ViaCepResponse & { erro?: boolean }) => {
        if (data.erro) return;
        form.setValue("address.street", data.logradouro ?? "");
        form.setValue("address.neighborhood", data.bairro ?? "");
        form.setValue("address.city", data.localidade ?? "");
        form.setValue("address.state", data.uf ?? "");
      })
      .catch(() => {});
  }, [cepClean, form.setValue]);

  return (
    <Form
      methods={form}
      onSubmit={form.handleSubmit((data) =>
        alert(JSON.stringify(data, null, 2))
      )}
    >
      <CepField />
      <StreetField />
      <NeighborhoodField />
      <CityField />
      <StateField />
      <button type="submit">Submit</button>
    </Form>
  );
}

export default AddressForm;`;
