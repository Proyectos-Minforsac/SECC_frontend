// Los montos (soles o dólares) llevan como máximo 2 decimales, por ejemplo 182.00. Se usa en el `onChange` de los campos
// de monto: si el texto nuevo tiene un tercer decimal (o no es un número), no se acepta y el campo conserva lo anterior.
const DOS_DECIMALES = /^\d*(\.\d{0,2})?$/;

export const esMontoValido = (texto: string) => DOS_DECIMALES.test(texto);

// Para los estados que guardan el texto tal cual: solo actualiza si el monto escrito es válido.
export const aceptarMonto = (texto: string, guardar: (valor: string) => void) => {
  if (esMontoValido(texto)) guardar(texto);
};

// Para los estados numéricos (número o vacío).
export const aceptarMontoNumero = (texto: string, guardar: (valor: number | '') => void) => {
  if (esMontoValido(texto)) guardar(texto === '' ? '' : Number(texto));
};
