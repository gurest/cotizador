/**
 * utils/calculator.ts
 * * Lógica de cálculo actualizada para QUICKSHEED.
 * Incluye desglose por tipo de perfil, medidas específicas,
 * accesorios (eólicos, luces, puertas) y lógica de Perfil C.
 */

// --- TIPOS Y DEFINICIONES ---

export type TipoColumna = 'Alma llena' | 'Reticulado' | 'Tubo' | 'Perfil C';
export type TipoViga = 'Alma llena' | 'Reticulado' | 'Perfil C';

// Material interno del reticulado
export type MaterialReticulado = 'Hierro Redondo' | 'Angulo' | 'Perfil C';

// Medidas Estandarizadas (Strings fijos para evitar errores)
export type MedidaIPN = 'IPN 200' | 'IPN 240' | 'IPN 300' | 'IPN 340' | 'IPN 400' | 'IPN 450' | 'IPN 500';
export type MedidaW = 'W 200' | 'W 250' | 'W 310' | 'W 360' | 'W 410' | 'W 460';
export type MedidaTubo = '100x100' | '120x120' | '140x140' | '160x160' | '180x180' | '200x200' | '220x220' | '260x260';
export type MedidaPerfilC = 'C 80' | 'C 100' | 'C 120' | 'C 140' | 'C 160' | 'C 180' | 'C 200' | 'C 220';
export type MedidaReticulado = '300 mm' | '400 mm' | '500 mm' | '600 mm' | '800 mm' | '1000 mm';

// Tipos de Hormigón
export type TipoHormigon = 'H21 (Liviano)' | 'H30 (Industrial)';

// Interfaz de entrada desde la pantalla Cotizar
export interface DatosCotizacion {
  // Dimensiones
  ancho: number;
  largo: number;
  altoHombrera: number;
  pendiente: number;

  // Estructura Columna
  tipoColumna: TipoColumna;
  subTipoColumna?: 'IPN' | 'W'; // Solo si es Alma llena
  medidaColumna?: string; // IPN xxx, W xxx, Tubo xxx, C xxx, o Altura Reticulado
  materialReticuladoColumna?: MaterialReticulado; // Nuevo: Solo si es reticulado

  // Estructura Viga
  tipoViga: TipoViga;
  subTipoViga?: 'IPN' | 'W';
  medidaViga?: string;
  materialReticuladoViga?: MaterialReticulado; // Nuevo

  // Cerramientos
  cerramientoLateral: boolean;
  cerramientoLateralChapa?: string;
  cerramientoFrenteFondo: boolean;
  cerramientoFrenteFondoChapa?: string;
  
  // Accesos
  portones: boolean;
  cantidadPortones: number;
  portonesAncho: number;
  portonesAlto: number;
  configuracionPorton?: string; // Simple/Doble
  puertasAuxiliares: boolean; // Nuevo
  cantidadPuertasAuxiliares: number; // Nuevo

  // Techo y Aislaciones
  aislacionTecho: boolean;
  tipoAislacionTecho?: string;
  aislacionLateral: boolean;
  tipoAislacionLateral?: string;
  aislacionFrenteFondo: boolean;
  tipoAislacionFrenteFondo?: string;

  // Accesorios Techo (Nuevos)
  chapasTraslucidas: boolean;
  cantidadChapasTraslucidas: number;
  ventilacionEolica: boolean;
  cantidadEolicos: number;

  // Piso (Nuevo lógica completa)
  pisoHormigon: boolean;
  tipoHormigon?: TipoHormigon;
  espesorPiso?: string; // ej "15 cm"
  estudioSuelo: boolean;
  hormigonEntrada: boolean;
  distanciaEntrada?: number;
  terminacionPiso?: string;

  // Logística
  distanciaKm: number;
  incluirElevacion: boolean;
}

// Interfaz de Configuración de Precios (Global)
// Ahora almacena pesos por metro lineal y precios unitarios
export interface ConfigPrecios {
  // --- COSTOS BASE MATERIALES ---
  precioAcero: number;        // USD/kg
  precioChapa: number;        // USD/m2
  precioAislacion: number;    // USD/m2 (Promedio o base)
  precioPanelIgnifugo: number;// USD/m2 extra
  
  // --- COSTOS UNITARIOS ACCESORIOS (NUEVOS) ---
  precioEolico: number;             // USD c/u
  precioChapaTraslucida: number;    // USD c/u
  precioPuertaEmergencia: number;   // USD c/u
  precioEstudioSuelo: number;       // USD Global
  precioHormigonH21: number;        // USD/m3
  precioHormigonH30: number;        // USD/m3
  precioMallaCima: number;          // USD/m2 (para el piso)

  // --- PESOS ESPECÍFICOS (kg por metro lineal) ---
  // Se usarán para calcular el peso exacto de la estructura
  pesosIPN: Record<string, number>;      // ej: { 'IPN 200': 26.2, ... }
  pesosW: Record<string, number>;        // ej: { 'W 200': 30.5, ... }
  pesosTubo: Record<string, number>;     // ej: { '100x100': 12.5, ... }
  pesosPerfilC: Record<string, number>;  // ej: { 'C 120': 8.5, ... }
  
  // Para reticulados, definimos un peso estimado por metro lineal de columna/viga
  // basándonos en su altura (300mm, etc) y su material de relleno
  pesosReticulado: Record<string, number>; // clave ej: "300mm_Angulo", "500mm_PerfilC"

  // --- MANO DE OBRA Y OTROS ---
  tornilleriaFijaciones: number; // USD global o % (interpretado como global en este cálculo simplificado)
  selladoresZingueria: number;   // USD por metro lineal de perímetro
  manoObraFabricacion: number;   // USD/kg
  montajeEstructura: number;     // USD/m2
  ingenieriaPlanos: number;      // USD Global
  pinturaTratamiento: number;    // USD/m2 cubierta total
  mediosElevacion: number;       // USD Global
  logisticaFletes: number;       // USD/km
  viaticos: number;              // USD Global
  
  // --- MÁRGENES ---
  margenGanancia: number;          // %
  imprevistosContingencia: number; // %
}

// Resultado final devuelto a la pantalla
export interface ResultadoPresupuesto {
  total: number;
  subtotal: number;
  desglose: {
    materialesEstructura: number; // Acero
    cubiertasYAislaciones: number; // Chapas + Aislaciones
    accesorios: number;           // Eólicos, Luces, Puertas
    pisoObraCivil: number;        // Hormigón, Mov suelo
    manoDeObra: number;           // Fab + Montaje + Pintura
    logisticaYOtros: number;      // Fletes, Elevación, Ing
  };
}

// Función auxiliar para sanitizar números
function n(val: any): number {
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Función auxiliar para obtener el peso por metro según configuración
function obtenerPesoMetro(
  tipo: TipoColumna | TipoViga,
  subTipo: string | undefined, // IPN, W
  medida: string | undefined,  // 200, 240, etc
  materialReticulado: MaterialReticulado | undefined,
  config: ConfigPrecios
): number {
  if (!medida) return 0;

  // 1. Perfil C Directo
  if (tipo === 'Perfil C') {
    return config.pesosPerfilC[medida] || 0;
  }

  // 2. Alma Llena (IPN / W)
  if (tipo === 'Alma llena') {
    if (subTipo === 'IPN') return config.pesosIPN[medida] || 0;
    if (subTipo === 'W') return config.pesosW[medida] || 0;
  }

  // 3. Tubo
  if (tipo === 'Tubo') {
    return config.pesosTubo[medida] || 0;
  }

  // 4. Reticulado
  if (tipo === 'Reticulado' && materialReticulado) {
    // La clave en el objeto config será combinada, ej: "300 mm_Angulo"
    // Normalizamos quitando espacios si es necesario en la clave
    const key = `${medida}_${materialReticulado}`;
    // Si no encuentra la combinación exacta, intenta buscar solo por medida (fallback)
    return config.pesosReticulado[key] || config.pesosReticulado[medida] || 25; // 25kg/m fallback conservador
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
      }
    };
  }

  // --- 1. GEOMETRÍA Y ESTRUCTURA ---
  
  // Estimación de Pórticos (Marcos)
  // Asumimos separación estándar de 5m.
  const separacionPorticos = 5;
  const cantidadPorticos = Math.ceil(largo / separacionPorticos) + 1; // +1 para cerrar el final

  // Longitud de vigas (Rafters) usando Pitágoras
  // Asumimos techo a dos aguas simétrico para simplificar longitud (ancho / 2)
  // Si es un agua, el factor cubre la hipotenusa igual.
  const factorPendiente = Math.sqrt(1 + Math.pow(pendiente / 100, 2));
  const longitudVigaTecho = ancho * factorPendiente; 

  // Metros lineales totales de perfiles PRINCIPALES
  // (No incluye correas, eso se calcula por m2 o porcentaje, aquí simplificamos en kg/m2 extra o sumamos correas perfil C)
  // Para ser precisos con los Perfiles C que pidió el usuario, calcularemos las correas como Perfil C estándar.
  
  const metrosLinealesColumnas = cantidadPorticos * 2 * alto; // 2 columnas por pórtico
  const metrosLinealesVigas = cantidadPorticos * longitudVigaTecho; 

  // Peso Columna Principal
  const pesoMetroColumna = obtenerPesoMetro(
    datos.tipoColumna,
    datos.subTipoColumna,
    datos.medidaColumna,
    datos.materialReticuladoColumna,
    config
  );
  const kgTotalColumnas = metrosLinealesColumnas * pesoMetroColumna;

  // Peso Viga Principal
  const pesoMetroViga = obtenerPesoMetro(
    datos.tipoViga,
    datos.subTipoViga,
    datos.medidaViga,
    datos.materialReticuladoViga,
    config
  );
  const kgTotalVigas = metrosLinealesVigas * pesoMetroViga;

  // Correas (Purlins) - Usualmente Perfil C
  // Estimación: Filas de correas separadas cada 1.2m aprox a lo largo del techo
  const filasCorreas = Math.ceil(ancho / 1.2); 
  const metrosLinealesCorreas = filasCorreas * largo; 
  // Asumimos un Perfil C 100 o 120 promedio para correas (aprox 4.5 kg/m) si no se especifica
  // O usamos el precio del Perfil C configurado más común. Usaremos un factor fijo de 5kg/m para correas.
  const kgTotalCorreas = metrosLinealesCorreas * 5; 

  // Totales Acero
  const kgAceroTotal = kgTotalColumnas + kgTotalVigas + kgTotalCorreas;
  const costoAcero = kgAceroTotal * n(config.precioAcero);

  // --- 2. CUBIERTAS Y CERRAMIENTOS ---
  
  const areaTecho = ancho * largo * factorPendiente; // Area real inclinada
  
  let areaParedes = 0;
  if (datos.cerramientoLateral) areaParedes += 2 * largo * alto;
  if (datos.cerramientoFrenteFondo) areaParedes += 2 * ancho * alto;

  // Restar huecos de portones
  let areaHuecos = 0;
  if (datos.portones && datos.cantidadPortones > 0) {
    areaHuecos += n(datos.cantidadPortones) * n(datos.portonesAncho) * n(datos.portonesAlto);
  }
  areaParedes = Math.max(0, areaParedes - areaHuecos);

  const areaChapaTotal = areaTecho + areaParedes;
  const costoChapa = areaChapaTotal * n(config.precioChapa);

  // Aislaciones
  let costoAislacionTotal = 0;
  // Aislación Techo
  if (datos.aislacionTecho) {
    // Si eligió panel ignífugo en el select (lógica simple: precio base + extra ignífugo si aplica)
    // Asumiremos que 'tipoAislacionTecho' viene como string.
    let precioAis = n(config.precioAislacion);
    if (datos.tipoAislacionTecho?.toLowerCase().includes('ignífugo')) {
      precioAis = n(config.precioPanelIgnifugo);
    }
    costoAislacionTotal += areaTecho * precioAis;
  }
  // Aislación Paredes
  if (datos.aislacionLateral) {
     costoAislacionTotal += (2 * largo * alto) * n(config.precioAislacion);
  }
  if (datos.aislacionFrenteFondo) {
     costoAislacionTotal += (2 * ancho * alto) * n(config.precioAislacion);
  }

  // --- 3. ACCESORIOS (NUEVO) ---
  
  let costoAccesorios = 0;

  // Eólicos
  if (datos.ventilacionEolica && datos.cantidadEolicos > 0) {
    costoAccesorios += n(datos.cantidadEolicos) * n(config.precioEolico);
  }

  // Chapas Traslúcidas
  if (datos.chapasTraslucidas && datos.cantidadChapasTraslucidas > 0) {
    costoAccesorios += n(datos.cantidadChapasTraslucidas) * n(config.precioChapaTraslucida);
  }

  // Puertas Emergencia
  if (datos.puertasAuxiliares && datos.cantidadPuertasAuxiliares > 0) {
    costoAccesorios += n(datos.cantidadPuertasAuxiliares) * n(config.precioPuertaEmergencia);
  }

  // Estudio de Suelo
  if (datos.estudioSuelo) {
    costoAccesorios += n(config.precioEstudioSuelo);
  }

  // --- 4. OBRA CIVIL / PISO (NUEVO) ---
  
  let costoPisoObraCivil = 0;
  if (datos.pisoHormigon) {
    const espesorMetros = datos.espesorPiso ? (parseFloat(datos.espesorPiso) / 100) : 0.15; // default 15cm
    const areaPiso = ancho * largo;
    const volumenHormigon = areaPiso * espesorMetros;

    // Precio según tipo
    let precioM3 = n(config.precioHormigonH21);
    if (datos.tipoHormigon?.includes('H30')) {
      precioM3 = n(config.precioHormigonH30);
    }
    
    // Costo del Hormigón
    costoPisoObraCivil += volumenHormigon * precioM3;

    // Malla cima (hierro para piso) - precio x m2
    costoPisoObraCivil += areaPiso * n(config.precioMallaCima);

    // Entrada vehicular
    if (datos.hormigonEntrada && datos.distanciaEntrada) {
      // Suponemos entrada de 6m de ancho estándar
      const volEntrada = (n(datos.distanciaEntrada) * 6) * espesorMetros;
      costoPisoObraCivil += volEntrada * precioM3;
    }
  }

  // --- 5. MANO DE OBRA Y SERVICIOS ---
  
  const costoFabricacion = kgAceroTotal * n(config.manoObraFabricacion);
  const costoMontaje = (ancho * largo) * n(config.montajeEstructura); // Se cobra por m2 de planta usualmente
  const costoPintura = areaChapaTotal * n(config.pinturaTratamiento);
  
  // Tornilleria y Selladores
  const costoTornilleria = n(config.tornilleriaFijaciones); // Si es global
  const perimetro = 2 * (ancho + largo);
  const costoSelladores = perimetro * n(config.selladoresZingueria);

  // Logística
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

  // Márgenes
  const imprevistos = subtotal * (n(config.imprevistosContingencia) / 100);
  const baseConImprevistos = subtotal + imprevistos;
  const ganancia = baseConImprevistos * (n(config.margenGanancia) / 100);
  
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
  };
}