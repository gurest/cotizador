/**
 * Calcula el presupuesto de una cotización de estructura metálica
 * a partir de dimensiones, opciones y precios de configuración.
 */

export type TipoColumna = 'Alma llena' | 'Reticulado' | 'Tubo';
export type TipoViga = 'Alma llena' | 'Reticulado';

const KG_ACERO_POR_M2: Record<TipoColumna, number> = {
  'Alma llena': 30,
  Reticulado: 22,
  Tubo: 18,
};

export interface DatosCotizacion {
  ancho: number;
  largo: number;
  altoHombrera: number;
  pendiente: number;
  tipoColumna: TipoColumna;
  tipoViga: TipoViga;
  cerramientoLateral: boolean;
  cerramientoFrenteFondo: boolean;
  portones: boolean;
  cantidadPortones: number;
  portonesAncho: number;
  portonesAlto: number;
  aislacionTecho: boolean;
  aislacionLateral: boolean;
  aislacionFrenteFondo: boolean;
}

export interface ConfigPrecios {
  precioAcero: number;
  precioChapa: number;
  precioAislacion: number;
  tornilleriaFijaciones: number;
  selladoresZingueria: number;
  manoObraFabricacion: number;
  montajeEstructura: number;
  ingenieriaPlanos: number;
  pinturaTratamiento: number;
  mediosElevacion: number;
  logisticaFletes: number;
  viaticos: number;
  margenGanancia: number;
  imprevistosContingencia: number;
}

export interface DesglosePresupuesto {
  materiales: number;
  manoDeObra: number;
  otros: number;
}

export interface ResultadoPresupuesto {
  total: number;
  subtotal: number;
  desglose: DesglosePresupuesto;
}

function n(val: number): number {
  return Number.isFinite(val) ? val : 0;
}

/**
 * Calcula áreas (planta, techo, paredes) y aplica precios para obtener
 * el presupuesto total con desglose (Materiales, Mano de Obra, Otros).
 */
export function calcularPresupuesto(
  datos: DatosCotizacion,
  config: ConfigPrecios
): ResultadoPresupuesto {
  const ancho = n(datos.ancho);
  const largo = n(datos.largo);
  const alto = n(datos.altoHombrera);
  const pendiente = n(datos.pendiente);

  // —— 1. Calcular áreas ——
  const areaPlanta = ancho * largo;
  const factorPendiente = Math.sqrt(1 + Math.pow(pendiente / 100, 2));
  const areaTecho = areaPlanta * factorPendiente;

  let areaParedes = 0;
  if (datos.cerramientoLateral) {
    areaParedes += 2 * largo * alto; // laterales
  }
  if (datos.cerramientoFrenteFondo) {
    areaParedes += 2 * ancho * alto; // frente y fondo
  }
  if (datos.portones && datos.cantidadPortones > 0) {
    const areaPortones =
      n(datos.portonesAncho) * n(datos.portonesAlto) * datos.cantidadPortones;
    areaParedes = Math.max(0, areaParedes - areaPortones);
  }

  // —— 2. Pesos y cantidades ——
  const kgAceroPorM2 = KG_ACERO_POR_M2[datos.tipoColumna] ?? 22;
  const kgAcero = areaPlanta * kgAceroPorM2;

  const areaChapaTecho = areaTecho;
  const areaChapaParedes = areaParedes;
  const areaChapaTotal = areaChapaTecho + areaChapaParedes;

  let areaAislacion = 0;
  if (datos.aislacionTecho) areaAislacion += areaTecho;
  if (datos.aislacionLateral) areaAislacion += 2 * largo * alto;
  if (datos.aislacionFrenteFondo) areaAislacion += 2 * ancho * alto;

  const perimetroPlanta = 2 * (ancho + largo);
  const metroLinealSelladores = perimetroPlanta;

  // —— 3. Costos por concepto ——
  const c = config;
  const costoAcero = kgAcero * n(c.precioAcero);
  const costoChapa = areaChapaTotal * n(c.precioChapa);
  const costoAislacion = areaAislacion * n(c.precioAislacion);
  const costoTornilleria = n(c.tornilleriaFijaciones);
  const costoSelladores = metroLinealSelladores * n(c.selladoresZingueria);

  const costoManoObraFab = kgAcero * n(c.manoObraFabricacion);
  const costoMontaje = areaPlanta * n(c.montajeEstructura);
  const costoPintura = areaChapaTotal * n(c.pinturaTratamiento);

  const costoIngenieria = n(c.ingenieriaPlanos);
  const costoMediosElevacion = n(c.mediosElevacion);
  const costoLogistica = n(c.logisticaFletes);
  const costoViaticos = n(c.viaticos);

  // —— 4. Desglose ——
  const materiales =
    costoAcero +
    costoChapa +
    costoAislacion +
    costoTornilleria +
    costoSelladores;
  const manoDeObra = costoManoObraFab + costoMontaje + costoPintura;
  const otros = costoIngenieria + costoMediosElevacion + costoLogistica + costoViaticos;

  const subtotal = materiales + manoDeObra + otros;

  const imprevistos = n(c.imprevistosContingencia) / 100;
  const conImprevistos = subtotal * (1 + imprevistos);
  const margen = n(c.margenGanancia) / 100;
  const total = conImprevistos * (1 + margen);

  return {
    total: Math.round(total * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    desglose: {
      materiales: Math.round(materiales * 100) / 100,
      manoDeObra: Math.round(manoDeObra * 100) / 100,
      otros: Math.round(otros * 100) / 100,
    },
  };
}
