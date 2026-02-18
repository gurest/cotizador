import {
  calcularPresupuesto,
  type ConfigPrecios,
  type DatosCotizacion,
  type TipoColumna,
  type TipoViga,
} from '@/utils/calculator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY_PRECIOS = '@cotizador_precios';
const STORAGE_KEY_HISTORIAL = '@cotizador_historial';

// --- DEFINICIÓN DE TIPOS PARA EL HISTORIAL ---
export type ItemHistorial = {
  id: number;
  nombreProyecto: string;
  fecha: string;
  dimensiones: { ancho: number; largo: number; alto: number; pendiente?: number };
  precioFinal: number;
  // Estructura
  tipoColumna?: string;
  subTipoColumna?: string;
  medidaColumna?: string;
  tipoViga?: string;
  subTipoViga?: string;
  medidaViga?: string;
  // Cerramientos
  cerramientoLateral?: boolean;
  cerramientoLateralChapa?: string;
  aislacionLateral?: boolean;
  tipoAislacionLateral?: string;
  cerramientoFrenteFondo?: boolean;
  cerramientoFrenteFondoChapa?: string;
  aislacionFrenteFondo?: boolean;
  tipoAislacionFrenteFondo?: string;
  // Accesos
  portones?: boolean;
  cantidadPortones?: number;
  configuracionPorton?: string;
  portonesAncho?: number;
  portonesAlto?: number;
  portonesTipoApertura?: string;
  portonesChapa?: string;
  puertasAuxiliares?: boolean;
  cantidadPuertasAuxiliares?: number;
  // Techo
  aislacionTecho?: boolean;
  tipoAislacionTecho?: string;
  chapasTraslucidas?: boolean;
  cantidadChapasTraslucidas?: number;
  ventilacionEolica?: boolean;
  cantidadEolicos?: number;
  // Piso
  pisoHormigon?: boolean;
  tipoHormigon?: string;
  espesorPiso?: string;
  terminacionPiso?: string;
  estudioSuelo?: boolean;
  hormigonEntrada?: boolean;
  distanciaEntrada?: number;
  // Logística
  distanciaKm?: number;
  incluirElevacion?: boolean;
};

const configPreciosPorDefecto: ConfigPrecios = {
  precioAcero: 1.5,
  precioChapa: 12,
  precioAislacion: 8,
  tornilleriaFijaciones: 500,
  selladoresZingueria: 2,
  manoObraFabricacion: 3,
  montajeEstructura: 15,
  ingenieriaPlanos: 800,
  pinturaTratamiento: 5,
  mediosElevacion: 600,
  logisticaFletes: 4,
  viaticos: 300,
  margenGanancia: 15,
  imprevistosContingencia: 5,
};

// --- CONSTANTES Y OPCIONES ---
const OPCIONES_COLUMNA = ['Alma llena', 'Reticulado', 'Tubo'] as const;
const OPCIONES_VIGA = ['Alma llena', 'Reticulado'] as const;

// Subtipos y Medidas
const OPCIONES_SUBTIPO_PERFIL = ['IPN', 'W'] as const;
const MEDIDAS_IPN = ['IPN 200', 'IPN 240', 'IPN 300', 'IPN 340', 'IPN 400'] as const;
const MEDIDAS_W = ['W 200', 'W 250', 'W 310', 'W 360', 'W 410'] as const;
const MEDIDAS_RETICULADO = ['300 mm', '400 mm', '500 mm', '600 mm', '800 mm'] as const;
const MEDIDAS_TUBO = ['100x100', '120x120', '140x140', '160x160', '200x200'] as const;

const OPCIONES_CHAPA = ['T-101', 'Sinusoidal', 'Prepintada'] as const;
const OPCIONES_AISLACION = [
  'Burbuja',
  'Lana Vidrio',
  'Poliuretano',
  'Panel Ignífugo',
] as const;
const OPCIONES_CONFIG_PORTON = ['Simple', 'Doble'] as const;
const OPCIONES_APERTURA_PORTON = ['Corredizo', 'De abrir'] as const;
const OPCIONES_TIPO_HORMIGON = ['H21 (Liviano)', 'H30 (Industrial)'] as const;
const OPCIONES_ESPESOR_PISO = ['12 cm', '15 cm', '18 cm'] as const;
const OPCIONES_TERMINACION = [
  'Llaneado',
  'Cuarzo',
  'Sin terminación',
] as const;

type TipoChapa = (typeof OPCIONES_CHAPA)[number];
type TipoAislacion = (typeof OPCIONES_AISLACION)[number];
type ConfigPorton = (typeof OPCIONES_CONFIG_PORTON)[number];
type AperturaPorton = (typeof OPCIONES_APERTURA_PORTON)[number];
type TipoHormigon = (typeof OPCIONES_TIPO_HORMIGON)[number];
type EspesorPiso = (typeof OPCIONES_ESPESOR_PISO)[number];
type TerminacionPiso = (typeof OPCIONES_TERMINACION)[number];

// --- COMPONENTE SELECTOR REUTILIZABLE (Estilo Dark/Orange) ---
function SelectorOpciones<T extends string>({
  opciones,
  valor,
  onSeleccionar,
  style,
}: {
  opciones: readonly T[];
  valor: T | '';
  onSeleccionar: (v: T) => void;
  style?: object;
}) {
  return (
    <View style={[styles.opcionesRow, style]}>
      {opciones.map((op) => {
        const isActive = valor === op;
        return (
          <TouchableOpacity
            key={op}
            style={[styles.opcionBtn, isActive && styles.opcionBtnActivo]}
            onPress={() => onSeleccionar(op)}
          >
            <Text style={[styles.opcionBtnText, isActive && styles.opcionBtnTextActivo]}>
              {op}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- COMPONENTE BLOQUE CERRAMIENTO ---
function BloqueOpcionalCerramiento({
  titulo,
  activo,
  onActivoChange,
  chapa,
  onChapaChange,
  aislacionActiva,
  onAislacionActivaChange,
  tipoAislacion,
  onTipoAislacionChange,
  labelAislacion,
}: {
  titulo: string;
  activo: boolean;
  onActivoChange: (v: boolean) => void;
  chapa: TipoChapa | '';
  onChapaChange: (v: TipoChapa) => void;
  aislacionActiva?: boolean;
  onAislacionActivaChange?: (v: boolean) => void;
  tipoAislacion?: TipoAislacion | '';
  onTipoAislacionChange?: (v: TipoAislacion) => void;
  labelAislacion?: string;
}) {
  const conAislacion =
    onAislacionActivaChange !== undefined && onTipoAislacionChange !== undefined;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{titulo}</Text>
        <Switch
          trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
          thumbColor={activo ? '#fff' : '#f4f3f4'}
          value={activo}
          onValueChange={onActivoChange}
        />
      </View>
      {activo && (
        <View style={styles.subSection}>
          <Text style={styles.subLabel}>Tipo de Chapa</Text>
          <SelectorOpciones
            opciones={OPCIONES_CHAPA}
            valor={chapa}
            onSeleccionar={onChapaChange}
          />
          {conAislacion && labelAislacion && (
            <>
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={styles.labelSmall}>{labelAislacion}</Text>
                <Switch
                  trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
                  thumbColor={aislacionActiva ? '#fff' : '#f4f3f4'}
                  value={aislacionActiva}
                  onValueChange={onAislacionActivaChange}
                />
              </View>
              {aislacionActiva && (
                <View style={{ marginTop: 8 }}>
                  <SelectorOpciones
                    opciones={OPCIONES_AISLACION}
                    valor={tipoAislacion ?? ''}
                    onSeleccionar={onTipoAislacionChange}
                  />
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

// --- PANTALLA PRINCIPAL ---
export default function CotizarScreen() {
  const [nombreProyecto, setNombreProyecto] = useState('');
  
  // Dimensiones
  const [ancho, setAncho] = useState('');
  const [largo, setLargo] = useState('');
  const [altoHombrera, setAltoHombrera] = useState('');
  const [pendiente, setPendiente] = useState('');
  
  // Resultado
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);

  // Estructura
  const [tipoColumna, setTipoColumna] = useState<(typeof OPCIONES_COLUMNA)[number] | ''>('');
  const [subTipoColumna, setSubTipoColumna] = useState<'IPN' | 'W' | ''>('');
  const [medidaColumna, setMedidaColumna] = useState('');

  const [tipoViga, setTipoViga] = useState<(typeof OPCIONES_VIGA)[number] | ''>('');
  const [subTipoViga, setSubTipoViga] = useState<'IPN' | 'W' | ''>('');
  const [medidaViga, setMedidaViga] = useState('');

  // Cerramientos
  const [cerramientoLateral, setCerramientoLateral] = useState(false);
  const [cerramientoLateralChapa, setCerramientoLateralChapa] = useState<TipoChapa | ''>('');
  const [aislacionLateral, setAislacionLateral] = useState(false);
  const [tipoAislacionLateral, setTipoAislacionLateral] = useState<TipoAislacion | ''>('');
  
  const [cerramientoFrenteFondo, setCerramientoFrenteFondo] = useState(false);
  const [cerramientoFrenteFondoChapa, setCerramientoFrenteFondoChapa] = useState<TipoChapa | ''>('');
  const [aislacionFrenteFondo, setAislacionFrenteFondo] = useState(false);
  const [tipoAislacionFrenteFondo, setTipoAislacionFrenteFondo] = useState<TipoAislacion | ''>('');
  
  // Accesos
  const [portones, setPortones] = useState(false);
  const [cantidadPortones, setCantidadPortones] = useState('');
  const [configuracionPorton, setConfiguracionPorton] = useState<ConfigPorton | ''>('');
  const [portonesAncho, setPortonesAncho] = useState('');
  const [portonesAlto, setPortonesAlto] = useState('');
  const [portonesTipoApertura, setPortonesTipoApertura] = useState<AperturaPorton | ''>('');
  const [portonesChapa, setPortonesChapa] = useState<TipoChapa | ''>('');

  const [puertasAuxiliares, setPuertasAuxiliares] = useState(false);
  const [cantidadPuertasAuxiliares, setCantidadPuertasAuxiliares] = useState('');

  // Techo
  const [aislacionTecho, setAislacionTecho] = useState(false);
  const [tipoAislacion, setTipoAislacion] = useState<TipoAislacion | ''>('');
  const [chapasTraslucidas, setChapasTraslucidas] = useState(false);
  const [cantidadChapasTraslucidas, setCantidadChapasTraslucidas] = useState('');
  const [ventilacionEolica, setVentilacionEolica] = useState(false);
  const [cantidadEolicos, setCantidadEolicos] = useState('');

  // Piso
  const [pisoHormigon, setPisoHormigon] = useState(false);
  const [tipoHormigon, setTipoHormigon] = useState<TipoHormigon | ''>('');
  const [espesorPiso, setEspesorPiso] = useState<EspesorPiso | ''>('');
  const [terminacionPiso, setTerminacionPiso] = useState<TerminacionPiso | ''>('');
  const [estudioSuelo, setEstudioSuelo] = useState(false);
  const [hormigonEntrada, setHormigonEntrada] = useState(false);
  const [distanciaEntrada, setDistanciaEntrada] = useState('');

  // Logística
  const [distanciaKm, setDistanciaKm] = useState('');
  const [incluirElevacion, setIncluirElevacion] = useState(false);

  // --- LÓGICA DE CÁLCULO ---
  const handleCalcular = async () => {
    let config: ConfigPrecios = { ...configPreciosPorDefecto };
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_PRECIOS);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        // Mapeo seguro de configuración
        config = {
            ...configPreciosPorDefecto,
            ...Object.fromEntries(
                Object.entries(parsed).map(([k, v]) => [k, parseFloat(v) || 0])
            )
        } as ConfigPrecios;
      }
    } catch {
      // Usa default
    }

    const datos: DatosCotizacion = {
      ancho: parseFloat(ancho) || 0,
      largo: parseFloat(largo) || 0,
      altoHombrera: parseFloat(altoHombrera) || 0,
      pendiente: parseFloat(pendiente) || 0,
      tipoColumna: (tipoColumna || 'Alma llena') as TipoColumna,
      tipoViga: (tipoViga || 'Alma llena') as TipoViga,
      cerramientoLateral,
      cerramientoFrenteFondo,
      portones,
      cantidadPortones: parseInt(cantidadPortones, 10) || 0,
      portonesAncho: parseFloat(portonesAncho) || 0,
      portonesAlto: parseFloat(portonesAlto) || 0,
      aislacionTecho,
      aislacionLateral,
      aislacionFrenteFondo,
    };

    const resultadoBase = calcularPresupuesto(datos, config);
    let totalCalculado = resultadoBase.total;

    // Adicionales
    const km = parseFloat(distanciaKm) || 0;
    if (km > 0) totalCalculado += km * config.logisticaFletes;
    if (incluirElevacion) totalCalculado += config.mediosElevacion;

    // NOTA: Aquí agregarías lógica extra para cobrar eólicos o puertas si tuvieras precios unitarios definidos en config.
    // Por ahora, se suman al desglose base si se implementa en 'calculator.ts'.

    setResultadoCalculo(totalCalculado);
  };

  const handleGuardarHistorial = async () => {
    if (resultadoCalculo === null) return;
    const item: ItemHistorial = {
      id: Date.now(),
      nombreProyecto: nombreProyecto.trim() || 'Proyecto Sin Nombre',
      fecha: new Date().toISOString(),
      dimensiones: {
        ancho: parseFloat(ancho) || 0,
        largo: parseFloat(largo) || 0,
        alto: parseFloat(altoHombrera) || 0,
        pendiente: parseFloat(pendiente) || 0,
      },
      precioFinal: resultadoCalculo,
      tipoColumna: tipoColumna || undefined,
      subTipoColumna: subTipoColumna || undefined,
      medidaColumna: medidaColumna || undefined,
      tipoViga: tipoViga || undefined,
      subTipoViga: subTipoViga || undefined,
      medidaViga: medidaViga || undefined,
      cerramientoLateral, cerramientoLateralChapa: cerramientoLateralChapa || undefined, aislacionLateral, tipoAislacionLateral: tipoAislacionLateral || undefined,
      cerramientoFrenteFondo, cerramientoFrenteFondoChapa: cerramientoFrenteFondoChapa || undefined, aislacionFrenteFondo, tipoAislacionFrenteFondo: tipoAislacionFrenteFondo || undefined,
      portones, cantidadPortones: parseInt(cantidadPortones, 10) || undefined, configuracionPorton: configuracionPorton || undefined, portonesAncho: parseFloat(portonesAncho) || undefined, portonesAlto: parseFloat(portonesAlto) || undefined, portonesTipoApertura: portonesTipoApertura || undefined, portonesChapa: portonesChapa || undefined,
      puertasAuxiliares, cantidadPuertasAuxiliares: parseInt(cantidadPuertasAuxiliares, 10) || undefined,
      aislacionTecho, tipoAislacionTecho: tipoAislacion || undefined,
      chapasTraslucidas, cantidadChapasTraslucidas: parseInt(cantidadChapasTraslucidas, 10) || undefined,
      ventilacionEolica, cantidadEolicos: parseInt(cantidadEolicos, 10) || undefined,
      pisoHormigon, tipoHormigon: tipoHormigon || undefined, espesorPiso: espesorPiso || undefined, terminacionPiso: terminacionPiso || undefined,
      estudioSuelo, hormigonEntrada, distanciaEntrada: parseFloat(distanciaEntrada) || undefined,
      distanciaKm: parseFloat(distanciaKm) || 0, incluirElevacion,
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const lista: ItemHistorial[] = raw ? JSON.parse(raw) : [];
      lista.unshift(item);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(lista));
      Alert.alert('Guardado', 'Cotización guardada exitosamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar.');
    }
  };

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        
        {/* HEADER MARCA */}
        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>NUEVA COTIZACIÓN</Text>
          <Text style={styles.brandSubtitle}>Cotizador Industrial Profesional</Text>
        </View>

        {/* NOMBRE PROYECTO */}
        <View style={styles.card}>
          <Text style={styles.label}>Nombre del Proyecto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Galpón Angel - Córdoba"
            placeholderTextColor="#9ca3af"
            value={nombreProyecto}
            onChangeText={setNombreProyecto}
          />
        </View>

        {/* DIMENSIONES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dimensiones</Text>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
                <Text style={styles.subLabel}>Ancho (m)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={ancho} onChangeText={setAncho} />
            </View>
            <View style={styles.halfInput}>
                <Text style={styles.subLabel}>Largo (m)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={largo} onChangeText={setLargo} />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
                <Text style={styles.subLabel}>Alto Hombrera (m)</Text>
                <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={altoHombrera} onChangeText={setAltoHombrera} />
            </View>
            <View style={styles.halfInput}>
                <Text style={styles.subLabel}>Pendiente (%)</Text>
                <TextInput style={styles.input} placeholder="15" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={pendiente} onChangeText={setPendiente} />
            </View>
          </View>
        </View>

        {/* ESTRUCTURA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Estructura</Text>
          
          {/* COLUMNAS */}
          <Text style={styles.subLabel}>Tipo de Columna</Text>
          <SelectorOpciones
            opciones={OPCIONES_COLUMNA}
            valor={tipoColumna}
            onSeleccionar={(val) => { setTipoColumna(val); setSubTipoColumna(''); setMedidaColumna(''); }}
          />
          {tipoColumna === 'Alma llena' && (
            <>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Perfil (IPN / W)</Text>
              <SelectorOpciones
                opciones={OPCIONES_SUBTIPO_PERFIL}
                valor={subTipoColumna}
                onSeleccionar={(val) => { setSubTipoColumna(val as 'IPN' | 'W'); setMedidaColumna(''); }}
              />
              {subTipoColumna === 'IPN' && <SelectorOpciones style={{ marginTop: 8 }} opciones={MEDIDAS_IPN} valor={medidaColumna} onSeleccionar={setMedidaColumna} />}
              {subTipoColumna === 'W' && <SelectorOpciones style={{ marginTop: 8 }} opciones={MEDIDAS_W} valor={medidaColumna} onSeleccionar={setMedidaColumna} />}
            </>
          )}
          {tipoColumna === 'Reticulado' && (
            <>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Altura Reticulado</Text>
              <SelectorOpciones opciones={MEDIDAS_RETICULADO} valor={medidaColumna} onSeleccionar={setMedidaColumna} />
            </>
          )}
          {tipoColumna === 'Tubo' && (
            <>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Medida Tubo</Text>
              <SelectorOpciones opciones={MEDIDAS_TUBO} valor={medidaColumna} onSeleccionar={setMedidaColumna} />
            </>
          )}

          {/* VIGAS */}
          <Text style={[styles.subLabel, { marginTop: 16 }]}>Tipo de Viga</Text>
          <SelectorOpciones
            opciones={OPCIONES_VIGA}
            valor={tipoViga}
            onSeleccionar={(val) => { setTipoViga(val); setSubTipoViga(''); setMedidaViga(''); }}
          />
          {tipoViga === 'Alma llena' && (
            <>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Perfil (IPN / W)</Text>
              <SelectorOpciones
                opciones={OPCIONES_SUBTIPO_PERFIL}
                valor={subTipoViga}
                onSeleccionar={(val) => { setSubTipoViga(val as 'IPN' | 'W'); setMedidaViga(''); }}
              />
              {subTipoViga === 'IPN' && <SelectorOpciones style={{ marginTop: 8 }} opciones={MEDIDAS_IPN} valor={medidaViga} onSeleccionar={setMedidaViga} />}
              {subTipoViga === 'W' && <SelectorOpciones style={{ marginTop: 8 }} opciones={MEDIDAS_W} valor={medidaViga} onSeleccionar={setMedidaViga} />}
            </>
          )}
          {tipoViga === 'Reticulado' && (
            <>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Altura Reticulado</Text>
              <SelectorOpciones opciones={MEDIDAS_RETICULADO} valor={medidaViga} onSeleccionar={setMedidaViga} />
            </>
          )}
        </View>

        {/* CERRAMIENTOS */}
        <BloqueOpcionalCerramiento
          titulo="Cerramiento Lateral"
          activo={cerramientoLateral}
          onActivoChange={setCerramientoLateral}
          chapa={cerramientoLateralChapa}
          onChapaChange={setCerramientoLateralChapa}
          aislacionActiva={aislacionLateral}
          onAislacionActivaChange={setAislacionLateral}
          tipoAislacion={tipoAislacionLateral}
          onTipoAislacionChange={setTipoAislacionLateral}
          labelAislacion="¿Aislación Lateral?"
        />
        <BloqueOpcionalCerramiento
          titulo="Frente y Fondo"
          activo={cerramientoFrenteFondo}
          onActivoChange={setCerramientoFrenteFondo}
          chapa={cerramientoFrenteFondoChapa}
          onChapaChange={setCerramientoFrenteFondoChapa}
          aislacionActiva={aislacionFrenteFondo}
          onAislacionActivaChange={setAislacionFrenteFondo}
          tipoAislacion={tipoAislacionFrenteFondo}
          onTipoAislacionChange={setTipoAislacionFrenteFondo}
          labelAislacion="¿Aislación Frente/Fondo?"
        />

        {/* ACCESOS (Portones y Puertas) */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Portones Industriales</Text>
            <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={portones ? '#fff' : '#f4f3f4'} value={portones} onValueChange={setPortones} />
          </View>
          {portones && (
            <View style={styles.subSection}>
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                    <Text style={styles.subLabel}>Cantidad</Text>
                    <TextInput style={styles.input} placeholder="1" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={cantidadPortones} onChangeText={setCantidadPortones} />
                </View>
                <View style={styles.halfInput}>
                    <Text style={styles.subLabel}>Ancho (m)</Text>
                    <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={portonesAncho} onChangeText={setPortonesAncho} />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                    <Text style={styles.subLabel}>Alto (m)</Text>
                    <TextInput style={styles.input} placeholder="0.00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={portonesAlto} onChangeText={setPortonesAlto} />
                </View>
              </View>
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Configuración</Text>
              <SelectorOpciones opciones={OPCIONES_CONFIG_PORTON} valor={configuracionPorton} onSeleccionar={setConfiguracionPorton} />
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Apertura</Text>
              <SelectorOpciones opciones={OPCIONES_APERTURA_PORTON} valor={portonesTipoApertura} onSeleccionar={setPortonesTipoApertura} />
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Tipo de Chapa</Text>
              <SelectorOpciones opciones={OPCIONES_CHAPA} valor={portonesChapa} onSeleccionar={setPortonesChapa} />
            </View>
          )}

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text style={styles.label}>Puertas de Emergencia</Text>
            <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={puertasAuxiliares ? '#fff' : '#f4f3f4'} value={puertasAuxiliares} onValueChange={setPuertasAuxiliares} />
          </View>
          {puertasAuxiliares && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Cantidad de Puertas</Text>
              <TextInput style={styles.input} placeholder="2" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={cantidadPuertasAuxiliares} onChangeText={setCantidadPuertasAuxiliares} />
            </View>
          )}
        </View>

        {/* EXTRAS TECHO */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Techo y Cubierta</Text>
            
            <View style={styles.row}>
                <Text style={styles.label}>¿Aislación Techo?</Text>
                <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={aislacionTecho ? '#fff' : '#f4f3f4'} value={aislacionTecho} onValueChange={setAislacionTecho} />
            </View>
            {aislacionTecho && (
                <View style={styles.subSection}>
                    <SelectorOpciones opciones={OPCIONES_AISLACION} valor={tipoAislacion} onSeleccionar={setTipoAislacion} />
                </View>
            )}

            <View style={styles.separator} />
            
            <View style={styles.row}>
                <Text style={styles.label}>¿Chapas Traslúcidas?</Text>
                <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={chapasTraslucidas ? '#fff' : '#f4f3f4'} value={chapasTraslucidas} onValueChange={setChapasTraslucidas} />
            </View>
            {chapasTraslucidas && (
                <View style={styles.subSection}>
                    <TextInput style={styles.input} placeholder="Cantidad" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={cantidadChapasTraslucidas} onChangeText={setCantidadChapasTraslucidas} />
                </View>
            )}

            <View style={styles.separator} />

            <View style={styles.row}>
                <Text style={styles.label}>¿Ventilación Eólica?</Text>
                <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={ventilacionEolica ? '#fff' : '#f4f3f4'} value={ventilacionEolica} onValueChange={setVentilacionEolica} />
            </View>
            {ventilacionEolica && (
                <View style={styles.subSection}>
                    <TextInput style={styles.input} placeholder="Cantidad de Eólicos" placeholderTextColor="#9ca3af" keyboardType="number-pad" value={cantidadEolicos} onChangeText={setCantidadEolicos} />
                </View>
            )}
        </View>

        {/* PISO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Piso de Hormigón</Text>
          <View style={styles.row}>
            <Text style={styles.label}>¿Incluir Piso?</Text>
            <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={pisoHormigon ? '#fff' : '#f4f3f4'} value={pisoHormigon} onValueChange={setPisoHormigon} />
          </View>
          {pisoHormigon && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Tipo</Text>
              <SelectorOpciones opciones={OPCIONES_TIPO_HORMIGON} valor={tipoHormigon} onSeleccionar={setTipoHormigon} />
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Espesor</Text>
              <SelectorOpciones opciones={OPCIONES_ESPESOR_PISO} valor={espesorPiso} onSeleccionar={setEspesorPiso} />
              <Text style={[styles.subLabel, { marginTop: 8 }]}>Terminación</Text>
              <SelectorOpciones opciones={OPCIONES_TERMINACION} valor={terminacionPiso} onSeleccionar={setTerminacionPiso} />
              
              <View style={[styles.separator, { marginVertical: 12 }]} />
              
              <View style={styles.row}>
                <Text style={styles.labelSmall}>¿Estudio de Suelo?</Text>
                <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={estudioSuelo ? '#fff' : '#f4f3f4'} value={estudioSuelo} onValueChange={setEstudioSuelo} />
              </View>

              <View style={[styles.row, { marginTop: 8 }]}>
                <Text style={styles.labelSmall}>¿Hormigón hasta la calle?</Text>
                <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={hormigonEntrada ? '#fff' : '#f4f3f4'} value={hormigonEntrada} onValueChange={setHormigonEntrada} />
              </View>
              {hormigonEntrada && (
                  <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Distancia Portón a Calle (m)" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={distanciaEntrada} onChangeText={setDistanciaEntrada} />
              )}
            </View>
          )}
        </View>

        {/* LOGÍSTICA */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Logística y Equipos</Text>
            <Text style={styles.subLabel}>Distancia Obra (km ida y vuelta)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" value={distanciaKm} onChangeText={setDistanciaKm} />
            
            <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={styles.label}>¿Medios de Elevación?</Text>
                <Switch trackColor={{ false: '#3f3f46', true: '#F59E0B' }} thumbColor={incluirElevacion ? '#fff' : '#f4f3f4'} value={incluirElevacion} onValueChange={setIncluirElevacion} />
            </View>
        </View>

        {/* BOTÓN CALCULAR */}
        <TouchableOpacity style={styles.calcButton} onPress={handleCalcular} activeOpacity={0.8}>
          <Text style={styles.calcButtonText}>CALCULAR PRESUPUESTO</Text>
        </TouchableOpacity>

        {/* RESULTADO */}
        {resultadoCalculo !== null && (
          <View style={styles.resultadoBox}>
            <Text style={styles.resultadoLabel}>VALOR FINAL ESTIMADO</Text>
            <Text style={styles.resultadoPrecio}>USD {resultadoCalculo.toFixed(2)}</Text>
            <TouchableOpacity style={styles.guardarButton} onPress={handleGuardarHistorial} activeOpacity={0.8}>
              <Text style={styles.guardarButtonText}>GUARDAR EN HISTORIAL</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// --- ESTILOS DARK MODE & ORANGE ---
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  scroll: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 16, paddingBottom: 32 },
  
  // HEADER
  headerContainer: { marginTop: 40, marginBottom: 24, alignItems: 'center' },
  brandTitle: { fontSize: 28, fontWeight: '900', color: '#F59E0B', letterSpacing: 1, textTransform: 'uppercase' },
  brandSubtitle: { fontSize: 14, color: '#A1A1AA', marginTop: 2, letterSpacing: 0.5 },

  // CARDS / SECCIONES
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  
  // TEXTOS
  label: { fontSize: 16, color: '#fff', fontWeight: '500' },
  labelSmall: { fontSize: 15, color: '#E4E4E7' },
  subLabel: { fontSize: 13, color: '#A1A1AA', marginBottom: 6 },
  
  // INPUTS
  input: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    marginTop: 4,
  },
  rowInputs: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  halfInput: { flex: 1 },

  // BOTONES SELECTORES
  opcionesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opcionBtn: {
    backgroundColor: '#27272A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  opcionBtnActivo: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  opcionBtnText: { color: '#A1A1AA', fontSize: 13, fontWeight: '500' },
  opcionBtnTextActivo: { color: '#000', fontWeight: '700' },

  // UTILS
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subSection: { marginTop: 12, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#3F3F46' },
  separator: { height: 1, backgroundColor: '#3F3F46', marginVertical: 12 },

  // ACCIONES PRINCIPALES
  calcButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calcButtonText: { color: '#000', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  // RESULTADO
  resultadoBox: {
    marginTop: 24,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  resultadoLabel: { color: '#F59E0B', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  resultadoPrecio: { color: '#fff', fontSize: 32, fontWeight: '700', marginBottom: 16 },
  guardarButton: {
    backgroundColor: '#27272A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
    width: '100%',
    alignItems: 'center',
  },
  guardarButtonText: { color: '#fff', fontWeight: '600' },
});