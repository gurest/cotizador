/**
 * utils/calculator.ts
 * * Lógica de cálculo actualizada para QUICKSHEED / CARMON.
 * * Sistema Dinámico: Soporta ingreso manual de peso (kg/m).
 * * Diferenciación de precios: Acero Estructural vs Tubular.
 * * Desglose exacto de cantidades para el historial.
 * * NUEVO: Formateador infalible de moneda (es-AR).
 * * NUEVO: Exportación de Ganancia neta para la "Doble Cara".
 */

// --- TIPOS Y DEFINICIONES ---

export type TipoColumna = 'Alma llena' | 'Reticulado' | 'Tubo' | 'Perfil C';
export type TipoViga = 'Alma llena' | 'Reticulado' | 'Perfil C';

// Material interno del reticulado
export type MaterialReticulado = 'Hierro Redondo' | 'Angulo' | 'Perfil C';

// Medidas Estandarizadas
export type MedidaIPN = 'IPN 200' | 'IPN 240' | 'IPN 300' | 'IPN 340' | 'IPN 400' | 'IPN 450' | 'IPN 500';
export type MedidaW = 'W 200' | 'W 250' | 'W 310' | 'W 360' | 'W 410' | 'W 460';
export type MedidaTubo = '100x100' | '120x120' | '140x140' | '160x160' | '180x180' | '200x200' | '220x220' | '260x260';
export type MedidaPerfilC = 'C 80' | 'C 100' | 'C 120' | 'C 140' | 'C 160' | 'C 180' | 'C 200' | 'C 220';
export type MedidaReticulado = '300 mm' | '400 mm' | '500 mm' | '600 mm' | '800 mm' | '1000 mm';

// Tipos de Hormigón
export type TipoHormigon = 'H21 (Liviano)' | 'H30 (Industrial)';

// Interfaz de entrada desde la pantalla Cotizar
export interface DatosCotizacion {
  ancho: number;
  largo: number;
  altoHombrera: number;
  pendiente: number;

  tipoColumna: TipoColumna;
  subTipoColumna?: 'IPN' | 'W';
  medidaColumna?: string;
  materialReticuladoColumna?: MaterialReticulado;
  pesoMetroColumna?: number;

  tipoViga: TipoViga;
  subTipoViga?: 'IPN' | 'W';
  medidaViga?: string;
  materialReticuladoViga?: MaterialReticulado;
  pesoMetroViga?: number;

  cerramientoLateral: boolean;
  cerramientoLateralChapa?: string;
  cerramientoFrenteFondo: boolean;
  cerramientoFrenteFondoChapa?: string;
  
  portones: boolean;
  cantidadPortones: number;
  portonesAncho: number;
  portonesAlto: number;
  configuracionPorton?: string;
  puertasAuxiliares: boolean;
  cantidadPuertasAuxiliares: number;

  aislacionTecho: boolean;
  tipoAislacionTecho?: string;
  aislacionLateral: boolean;
  tipoAislacionLateral?: string;
  aislacionFrenteFondo: boolean;
  tipoAislacionFrenteFondo?: string;

  chapasTraslucidas: boolean;
  cantidadChapasTraslucidas: number;
  ventilacionEolica: boolean;
  cantidadEolicos: number;

  pisoHormigon: boolean;
  tipoHormigon?: TipoHormigon;
  espesorPiso?: string;
  estudioSuelo: boolean;
  hormigonEntrada: boolean;
  distanciaEntrada?: number;
  terminacionPiso?: string;

  distanciaKm: number;
  incluirElevacion: boolean;
}

// Interfaz de Configuración de Precios
export interface ConfigPrecios {
  precioAceroEstructural: number; 
  precioAceroTubular: number;     
  precioAcero?: number;           
  precioChapa: number;            
  precioAislacion: number;        
  precioPanelIgnifugo: number;    
  
  precioEolico: number;             
  precioChapaTraslucida: number;    
  precioPuertaEmergencia: number;   
  precioEstudioSuelo: number;       
  precioHormigonH21: number;        
  precioHormigonH30: number;        
  precioMallaCima: number;          

  pesosIPN: Record<string, number>;
  pesosW: Record<string, number>;
  pesosTubo: Record<string, number>;
  pesosPerfilC: Record<string, number>;
  pesosReticulado: Record<string, number>;

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

// Resultado final devuelto a la pantalla
export interface ResultadoPresupuesto {
  total: number;
  subtotal: number;
  desglose: {
    materialesEstructura: number;
    cubiertasYAislaciones: number;
    accesorios: number;
    pisoObraCivil: number;
    manoDeObra: number;
    logisticaYOtros: number;
  };
  cantidades: {
    kgAceroTotal: number;
    areaChapaTotal: number;
  };
  // NUEVO: Datos exactos de ganancia para la "Doble Cara"
  ganancia: {
    porcentajeImprevistos: number;
    montoImprevistos: number;
    porcentajeGanancia: number;
    montoGanancia: number;
  };
}

// --- HERRAMIENTAS GLOBALES DEL TALLER ---

// Función auxiliar para sanitizar números
function n(val: any): number {
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : 0;
}

// NUEVO: Función infalible para formatear dinero y kilos (ej: 1.500.320,50)
export function formatearMoneda(numero: number | string | undefined | null): string {
  if (numero === undefined || numero === null) return '0,00';
  const numCrudo = parseFloat(numero.toString());
  if (isNaN(numCrudo)) return '0,00';
  
  // Forzamos 2 decimales y separamos la parte entera de los centavos
  const partes = numCrudo.toFixed(2).split('.');
  
  // Le clavamos el punto de los miles a la parte entera
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  // Unimos todo con una coma
  return partes.join(',');
}

// Función auxiliar para obtener el peso por metro
function obtenerPesoMetro(
  tipo: TipoColumna | TipoViga,
  subTipo: string | undefined,
  medida: string | undefined,
  materialReticulado: MaterialReticulado | undefined,
  config: ConfigPrecios
): number {
  if (!medida) return 0;

  if (tipo === 'Perfil C') {
    return config.pesosPerfilC?.[medida] || 0;
  }

  if (tipo === 'Alma llena') {
    if (subTipo === 'IPN') return config.pesosIPN?.[medida] || 0;
    if (subTipo === 'W') return config.pesosW?.[medida] || 0;
  }

  if (tipo === 'Tubo') {
    return config.pesosTubo?.[medida] || 0;
  }

  if (tipo === 'Reticulado' && materialReticulado) {
    const key = `${medida}_${materialReticulado}`;
    return config.pesosReticulado?.[key] || config.pesosReticulado?.[medida] || 25;
  }

  return 0;
}

/**
 * CÁLCULO PRINCIPAL
 */
export function calcularPresupuesto(
  datos: DatosCotizacion,
  config: ConfigPrecios
): ResultadoPresupuesto {
  
  const ancho = n(datos.ancho);
  const largo = n(datos.largo);
  const alto = n(datos.altoHombrera);
  const pendiente = n(datos.pendiente);

  if (ancho === 0 || largo === 0) {
    return {
      total: 0,
      subtotal: 0,
      desglose: {
        materialesEstructura: 0,
        cubiertasYAislaciones: 0,
        accesorios: 0,
        pisoObraCivil: 0,
        manoDeObra: 0,
        logisticaYOtros: 0,
      },
      cantidades: {
        kgAceroTotal: 0,
        areaChapaTotal: 0,
      },
      ganancia: {
        porcentajeImprevistos: 0,
        montoImprevistos: 0,
        porcentajeGanancia: 0,
        montoGanancia: 0,
      }
    };
  }

  const precioEstructural = n(config.precioAceroEstructural) > 0 ? n(config.precioAceroEstructural) : n(config.precioAcero);
  const precioTubular = n(config.precioAceroTubular) > 0 ? n(config.precioAceroTubular) : n(config.precioAcero);

  // --- 1. GEOMETRÍA Y ESTRUCTURA ---
  
  const separacionPorticos = 5;
  const cantidadPorticos = Math.ceil(largo / separacionPorticos) + 1;

  const factorPendiente = Math.sqrt(1 + Math.pow(pendiente / 100, 2));
  const longitudVigaTecho = ancho * factorPendiente; 

  const metrosLinealesColumnas = cantidadPorticos * 2 * alto;
  const metrosLinealesVigas = cantidadPorticos * longitudVigaTecho; 

  const pesoMetroColumna = n(datos.pesoMetroColumna) > 0 
    ? n(datos.pesoMetroColumna) 
    : obtenerPesoMetro(datos.tipoColumna, datos.subTipoColumna, datos.medidaColumna, datos.materialReticuladoColumna, config);
  const kgTotalColumnas = metrosLinealesColumnas * pesoMetroColumna;
  
  const costoColumnas = kgTotalColumnas * (datos.tipoColumna === 'Tubo' ? precioTubular : precioEstructural);

  const pesoMetroViga = n(datos.pesoMetroViga) > 0 
    ? n(datos.pesoMetroViga) 
    : obtenerPesoMetro(datos.tipoViga, datos.subTipoViga, datos.medidaViga, datos.materialReticuladoViga, config);
  const kgTotalVigas = metrosLinealesVigas * pesoMetroViga;
  
  const costoVigas = kgTotalVigas * precioEstructural;

  const filasCorreas = Math.ceil(ancho / 1.2); 
  const metrosLinealesCorreas = filasCorreas * largo; 
  const kgTotalCorreas = metrosLinealesCorreas * 5; 
  const costoCorreas = kgTotalCorreas * precioEstructural;

  const kgAceroTotal = kgTotalColumnas + kgTotalVigas + kgTotalCorreas;
  const costoAcero = costoColumnas + costoVigas + costoCorreas;

  // --- 2. CUBIERTAS Y CERRAMIENTOS ---
  
  const areaTecho = ancho * largo * factorPendiente; 
  
  let areaParedes = 0;
  if (datos.cerramientoLateral) areaParedes += 2 * largo * alto;
  if (datos.cerramientoFrenteFondo) areaParedes += 2 * ancho * alto;

  let areaHuecos = 0;
  if (datos.portones && datos.cantidadPortones > 0) {
    areaHuecos += n(datos.cantidadPortones) * n(datos.portonesAncho) * n(datos.portonesAlto);
  }
  areaParedes = Math.max(0, areaParedes - areaHuecos);

  const areaChapaTotal = areaTecho + areaParedes;
  const costoChapa = areaChapaTotal * n(config.precioChapa);

  let costoAislacionTotal = 0;
  if (datos.aislacionTecho) {
    let precioAis = n(config.precioAislacion);
    if (datos.tipoAislacionTecho?.toLowerCase().includes('ignífugo')) {
      precioAis = n(config.precioPanelIgnifugo);
    }
    costoAislacionTotal += areaTecho * precioAis;
  }
  if (datos.aislacionLateral) {
     costoAislacionTotal += (2 * largo * alto) * n(config.precioAislacion);
  }
  if (datos.aislacionFrenteFondo) {
     costoAislacionTotal += (2 * ancho * alto) * n(config.precioAislacion);
  }

  // --- 3. ACCESORIOS ---
  
  let costoAccesorios = 0;

  if (datos.ventilacionEolica && datos.cantidadEolicos > 0) {
    costoAccesorios += n(datos.cantidadEolicos) * n(config.precioEolico);
  }

  if (datos.chapasTraslucidas && datos.cantidadChapasTraslucidas > 0) {
    costoAccesorios += n(datos.cantidadChapasTraslucidas) * n(config.precioChapaTraslucida);
  }

  if (datos.puertasAuxiliares && datos.cantidadPuertasAuxiliares > 0) {
    costoAccesorios += n(datos.cantidadPuertasAuxiliares) * n(config.precioPuertaEmergencia);
  }

  if (datos.estudioSuelo) {
    costoAccesorios += n(config.precioEstudioSuelo);
  }

  // --- 4. OBRA CIVIL / PISO ---
  
  let costoPisoObraCivil = 0;
  if (datos.pisoHormigon) {
    const espesorMetros = datos.espesorPiso ? (parseFloat(datos.espesorPiso) / 100) : 0.15;
    const areaPiso = ancho * largo;
    const volumenHormigon = areaPiso * espesorMetros;

    let precioM3 = n(config.precioHormigonH21);
    if (datos.tipoHormigon?.includes('H30')) {
      precioM3 = n(config.precioHormigonH30);
    }
    
    costoPisoObraCivil += volumenHormigon * precioM3;
    costoPisoObraCivil += areaPiso * n(config.precioMallaCima);

    if (datos.hormigonEntrada && datos.distanciaEntrada) {
      const volEntrada = (n(datos.distanciaEntrada) * 6) * espesorMetros;
      costoPisoObraCivil += volEntrada * precioM3;
    }
  }

  // --- 5. MANO DE OBRA Y SERVICIOS ---
  
  const costoFabricacion = kgAceroTotal * n(config.manoObraFabricacion);
  const costoMontaje = (ancho * largo) * n(config.montajeEstructura);
  const costoPintura = areaChapaTotal * n(config.pinturaTratamiento);
  
  const costoTornilleria = n(config.tornilleriaFijaciones);
  const perimetro = 2 * (ancho + largo);
  const costoSelladores = perimetro * n(config.selladoresZingueria);

  let costoFlete = n(datos.distanciaKm) * n(config.logisticaFletes);
  let costoElevacion = datos.incluirElevacion ? n(config.mediosElevacion) : 0;
  let costoIngenieria = n(config.ingenieriaPlanos);
  let costoViaticos = n(config.viaticos);

  // --- 6. SUMATORIA Y DESGLOSE ---

  const totalMaterialesEstructura = costoAcero + costoTornilleria + costoSelladores;
  const totalCubiertas = costoChapa + costoAislacionTotal;
  const totalManoDeObra = costoFabricacion + costoMontaje + costoPintura;
  const totalLogistica = costoFlete + costoElevacion + costoIngenieria + costoViaticos;

  const subtotal = totalMaterialesEstructura + 
                   totalCubiertas + 
                   costoAccesorios + 
                   costoPisoObraCivil + 
                   totalManoDeObra + 
                   totalLogistica;

  // LÓGICA DE MÁRGENES (Separada para exportar)
  const porcImprevistos = n(config.imprevistosContingencia);
  const imprevistos = subtotal * (porcImprevistos / 100);
  const baseConImprevistos = subtotal + imprevistos;
  
  const porcGanancia = n(config.margenGanancia);
  const ganancia = baseConImprevistos * (porcGanancia / 100);
  
  const totalFinal = baseConImprevistos + ganancia;

  return {
    total: Math.round(totalFinal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    desglose: {
      materialesEstructura: Math.round(totalMaterialesEstructura * 100) / 100,
      cubiertasYAislaciones: Math.round(totalCubiertas * 100) / 100,
      accesorios: Math.round(costoAccesorios * 100) / 100,
      pisoObraCivil: Math.round(costoPisoObraCivil * 100) / 100,
      manoDeObra: Math.round(totalManoDeObra * 100) / 100,
      logisticaYOtros: Math.round(totalLogistica * 100) / 100,
    },
    cantidades: {
      kgAceroTotal: Math.round(kgAceroTotal * 100) / 100,
      areaChapaTotal: Math.round(areaChapaTotal * 100) / 100,
    },
    // NUEVO: Exportamos la ganancia exacta para mostrar en el historial
    ganancia: {
      porcentajeImprevistos: porcImprevistos,
      montoImprevistos: Math.round(imprevistos * 100) / 100,
      porcentajeGanancia: porcGanancia,
      montoGanancia: Math.round(ganancia * 100) / 100,
    }
  };
}