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
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const STORAGE_KEY_PRECIOS = '@cotizador_precios';
const STORAGE_KEY_HISTORIAL = '@cotizador_historial';

export type ItemHistorial = {
  id: number;
  nombreProyecto: string;
  fecha: string;
  dimensiones: { ancho: number; largo: number; alto: number; pendiente?: number };
  precioFinal: number;
  tipoColumna?: string;
  tipoViga?: string;
  cerramientoLateral?: boolean;
  cerramientoLateralChapa?: string;
  aislacionLateral?: boolean;
  tipoAislacionLateral?: string;
  cerramientoFrenteFondo?: boolean;
  cerramientoFrenteFondoChapa?: string;
  aislacionFrenteFondo?: boolean;
  tipoAislacionFrenteFondo?: string;
  portones?: boolean;
  cantidadPortones?: number;
  configuracionPorton?: string;
  portonesAncho?: number;
  portonesAlto?: number;
  portonesTipoApertura?: string;
  portonesChapa?: string;
  aislacionTecho?: boolean;
  tipoAislacionTecho?: string;
  pisoHormigon?: boolean;
  tipoHormigon?: string;
  espesorPiso?: string;
  terminacionPiso?: string;
  // NUEVOS CAMPOS
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
  logisticaFletes: 4, // Valor por defecto por KM (ajustable en config)
  viaticos: 300,
  margenGanancia: 15,
  imprevistosContingencia: 5,
};

const OPCIONES_COLUMNA = ['Alma llena', 'Reticulado', 'Tubo'] as const;
const OPCIONES_VIGA = ['Alma llena', 'Reticulado'] as const;
const OPCIONES_CHAPA = ['T-101', 'Sinusoidal', 'Prepintada'] as const;
const OPCIONES_AISLACION = [
  'Burbuja con aluminio',
  'Lana de vidrio',
  'Poliuretano expandido',
] as const;
const OPCIONES_CONFIG_PORTON = ['Simple', 'Doble'] as const;
const OPCIONES_APERTURA_PORTON = ['Corredizo', 'De abrir'] as const;
const OPCIONES_TIPO_HORMIGON = ['H21 (Liviano)', 'H30 (Industrial)'] as const;
const OPCIONES_ESPESOR_PISO = ['12 cm', '15 cm', '18 cm'] as const;
const OPCIONES_TERMINACION = [
  'Llaneado Mecánico',
  'Cuarzo Endurecedor',
  'Sin terminación',
] as const;

type TipoChapa = (typeof OPCIONES_CHAPA)[number];
type TipoAislacion = (typeof OPCIONES_AISLACION)[number];
type ConfigPorton = (typeof OPCIONES_CONFIG_PORTON)[number];
type AperturaPorton = (typeof OPCIONES_APERTURA_PORTON)[number];
type TipoHormigon = (typeof OPCIONES_TIPO_HORMIGON)[number];
type EspesorPiso = (typeof OPCIONES_ESPESOR_PISO)[number];
type TerminacionPiso = (typeof OPCIONES_TERMINACION)[number];

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
      {opciones.map((op) => (
        <TouchableOpacity
          key={op}
          style={[styles.opcionBtn, valor === op && styles.opcionBtnActivo]}
          onPress={() => onSeleccionar(op)}
        >
          <Text style={[styles.opcionBtnText, valor === op && styles.opcionBtnTextActivo]}>
            {op}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

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
    <View style={styles.bloqueOpcional}>
      <View style={styles.row}>
        <Text style={styles.label}>{titulo}</Text>
        <Switch value={activo} onValueChange={onActivoChange} />
      </View>
      {activo && (
        <View style={styles.chapaSelector}>
          <Text style={styles.chapaLabel}>Elegir tipo de Chapa</Text>
          <SelectorOpciones
            opciones={OPCIONES_CHAPA}
            valor={chapa}
            onSeleccionar={onChapaChange}
          />
          {conAislacion && labelAislacion && (
            <>
              <View style={styles.rowAislacion}>
                <Text style={styles.label}>{labelAislacion}</Text>
                <Switch
                  value={aislacionActiva}
                  onValueChange={onAislacionActivaChange}
                />
              </View>
              {aislacionActiva && (
                <View style={styles.aislacionSelector}>
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

export default function CotizarScreen() {
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [ancho, setAncho] = useState('');
  const [largo, setLargo] = useState('');
  const [altoHombrera, setAltoHombrera] = useState('');
  const [pendiente, setPendiente] = useState('');
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);

  const [tipoColumna, setTipoColumna] = useState<(typeof OPCIONES_COLUMNA)[number] | ''>('');
  const [tipoViga, setTipoViga] = useState<(typeof OPCIONES_VIGA)[number] | ''>('');

  const [cerramientoLateral, setCerramientoLateral] = useState(false);
  const [cerramientoLateralChapa, setCerramientoLateralChapa] = useState<TipoChapa | ''>('');
  const [aislacionLateral, setAislacionLateral] = useState(false);
  const [tipoAislacionLateral, setTipoAislacionLateral] = useState<TipoAislacion | ''>('');
  const [cerramientoFrenteFondo, setCerramientoFrenteFondo] = useState(false);
  const [cerramientoFrenteFondoChapa, setCerramientoFrenteFondoChapa] = useState<TipoChapa | ''>(
    ''
  );
  const [aislacionFrenteFondo, setAislacionFrenteFondo] = useState(false);
  const [tipoAislacionFrenteFondo, setTipoAislacionFrenteFondo] = useState<TipoAislacion | ''>('');
  const [portones, setPortones] = useState(false);
  const [cantidadPortones, setCantidadPortones] = useState('');
  const [configuracionPorton, setConfiguracionPorton] = useState<ConfigPorton | ''>('');
  const [portonesAncho, setPortonesAncho] = useState('');
  const [portonesAlto, setPortonesAlto] = useState('');
  const [portonesTipoApertura, setPortonesTipoApertura] = useState<AperturaPorton | ''>('');
  const [portonesChapa, setPortonesChapa] = useState<TipoChapa | ''>('');
  const [aislacionTecho, setAislacionTecho] = useState(false);
  const [tipoAislacion, setTipoAislacion] = useState<TipoAislacion | ''>('');
  const [pisoHormigon, setPisoHormigon] = useState(false);
  const [tipoHormigon, setTipoHormigon] = useState<TipoHormigon | ''>('');
  const [espesorPiso, setEspesorPiso] = useState<EspesorPiso | ''>('');
  const [terminacionPiso, setTerminacionPiso] = useState<TerminacionPiso | ''>('');

  // NUEVOS ESTADOS LOGÍSTICA
  const [distanciaKm, setDistanciaKm] = useState('');
  const [incluirElevacion, setIncluirElevacion] = useState(false);

  const handleCalcular = async () => {
    let config: ConfigPrecios = { ...configPreciosPorDefecto };
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_PRECIOS);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        config = {
          precioAcero: parseFloat(parsed.precioAcero ?? '') || configPreciosPorDefecto.precioAcero,
          precioChapa: parseFloat(parsed.precioChapa ?? '') || configPreciosPorDefecto.precioChapa,
          precioAislacion: parseFloat(parsed.precioAislacion ?? '') || configPreciosPorDefecto.precioAislacion,
          tornilleriaFijaciones: parseFloat(parsed.tornilleriaFijaciones ?? '') || configPreciosPorDefecto.tornilleriaFijaciones,
          selladoresZingueria: parseFloat(parsed.selladoresZingueria ?? '') || configPreciosPorDefecto.selladoresZingueria,
          manoObraFabricacion: parseFloat(parsed.manoObraFabricacion ?? '') || configPreciosPorDefecto.manoObraFabricacion,
          montajeEstructura: parseFloat(parsed.montajeEstructura ?? '') || configPreciosPorDefecto.montajeEstructura,
          ingenieriaPlanos: parseFloat(parsed.ingenieriaPlanos ?? '') || configPreciosPorDefecto.ingenieriaPlanos,
          pinturaTratamiento: parseFloat(parsed.pinturaTratamiento ?? '') || configPreciosPorDefecto.pinturaTratamiento,
          mediosElevacion: parseFloat(parsed.mediosElevacion ?? '') || configPreciosPorDefecto.mediosElevacion,
          logisticaFletes: parseFloat(parsed.logisticaFletes ?? '') || configPreciosPorDefecto.logisticaFletes,
          viaticos: parseFloat(parsed.viaticos ?? '') || configPreciosPorDefecto.viaticos,
          margenGanancia: parseFloat(parsed.margenGanancia ?? '') || configPreciosPorDefecto.margenGanancia,
          imprevistosContingencia: parseFloat(parsed.imprevistosContingencia ?? '') || configPreciosPorDefecto.imprevistosContingencia,
        };
      }
    } catch {
      // usar config por defecto ya asignado
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

    // --- CÁLCULO DE ADICIONALES (Logística y Elevación) ---
    
    // 1. Flete: (Km * Precio por Km)
    const km = parseFloat(distanciaKm) || 0;
    if (km > 0) {
      // Usamos 'logisticaFletes' como valor unitario por Km
      const costoFlete = km * config.logisticaFletes;
      totalCalculado += costoFlete;
    }

    // 2. Medios de Elevación
    if (incluirElevacion) {
      totalCalculado += config.mediosElevacion;
    }

    setResultadoCalculo(totalCalculado);
  };

  const handleGuardarHistorial = async () => {
    if (resultadoCalculo === null) return;
    const item: ItemHistorial = {
      id: Date.now(),
      nombreProyecto: nombreProyecto.trim() || 'Sin nombre',
      fecha: new Date().toISOString(),
      dimensiones: {
        ancho: parseFloat(ancho) || 0,
        largo: parseFloat(largo) || 0,
        alto: parseFloat(altoHombrera) || 0,
        pendiente: parseFloat(pendiente) || 0,
      },
      precioFinal: resultadoCalculo,
      tipoColumna: tipoColumna || undefined,
      tipoViga: tipoViga || undefined,
      cerramientoLateral: cerramientoLateral || undefined,
      cerramientoLateralChapa: cerramientoLateralChapa || undefined,
      aislacionLateral: aislacionLateral || undefined,
      tipoAislacionLateral: tipoAislacionLateral || undefined,
      cerramientoFrenteFondo: cerramientoFrenteFondo || undefined,
      cerramientoFrenteFondoChapa: cerramientoFrenteFondoChapa || undefined,
      aislacionFrenteFondo: aislacionFrenteFondo || undefined,
      tipoAislacionFrenteFondo: tipoAislacionFrenteFondo || undefined,
      portones: portones || undefined,
      cantidadPortones: parseInt(cantidadPortones, 10) || undefined,
      configuracionPorton: configuracionPorton || undefined,
      portonesAncho: parseFloat(portonesAncho) || undefined,
      portonesAlto: parseFloat(portonesAlto) || undefined,
      portonesTipoApertura: portonesTipoApertura || undefined,
      portonesChapa: portonesChapa || undefined,
      aislacionTecho: aislacionTecho || undefined,
      tipoAislacionTecho: tipoAislacion || undefined,
      pisoHormigon: pisoHormigon || undefined,
      tipoHormigon: tipoHormigon || undefined,
      espesorPiso: espesorPiso || undefined,
      terminacionPiso: terminacionPiso || undefined,
      // Guardamos los nuevos datos
      distanciaKm: parseFloat(distanciaKm) || 0,
      incluirElevacion: incluirElevacion,
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const lista: ItemHistorial[] = raw ? JSON.parse(raw) : [];
      lista.unshift(item);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(lista));
      Alert.alert('Guardado', 'Cotización guardada en el historial.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar en el historial.');
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Nombre del Proyecto</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Galpón de Angel"
        value={nombreProyecto}
        onChangeText={setNombreProyecto}
      />
      {/* Dimensiones */}
      <Text style={styles.sectionTitle}>Dimensiones</Text>
      <TextInput
        style={styles.input}
        placeholder="Ancho (m)"
        value={ancho}
        onChangeText={setAncho}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Largo (m)"
        value={largo}
        onChangeText={setLargo}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Alto de Hombrera (m)"
        value={altoHombrera}
        onChangeText={setAltoHombrera}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Pendiente (%)"
        value={pendiente}
        onChangeText={setPendiente}
        keyboardType="decimal-pad"
      />

      {/* Estructura */}
      <Text style={styles.sectionTitle}>Estructura</Text>
      <Text style={styles.campoLabel}>Tipo de Columna</Text>
      <SelectorOpciones
        opciones={OPCIONES_COLUMNA}
        valor={tipoColumna}
        onSeleccionar={setTipoColumna}
      />
      <Text style={[styles.campoLabel, { marginTop: 12 }]}>Tipo de Viga</Text>
      <SelectorOpciones
        opciones={OPCIONES_VIGA}
        valor={tipoViga}
        onSeleccionar={setTipoViga}
      />

      {/* Cerramientos */}
      <Text style={styles.sectionTitle}>Cerramientos</Text>
      <BloqueOpcionalCerramiento
        titulo="¿Cerramiento Lateral?"
        activo={cerramientoLateral}
        onActivoChange={setCerramientoLateral}
        chapa={cerramientoLateralChapa}
        onChapaChange={setCerramientoLateralChapa}
        aislacionActiva={aislacionLateral}
        onAislacionActivaChange={setAislacionLateral}
        tipoAislacion={tipoAislacionLateral}
        onTipoAislacionChange={setTipoAislacionLateral}
        labelAislacion="¿Aislación en paredes laterales?"
      />
      <BloqueOpcionalCerramiento
        titulo="¿Cerramiento Frente/Fondo?"
        activo={cerramientoFrenteFondo}
        onActivoChange={setCerramientoFrenteFondo}
        chapa={cerramientoFrenteFondoChapa}
        onChapaChange={setCerramientoFrenteFondoChapa}
        aislacionActiva={aislacionFrenteFondo}
        onAislacionActivaChange={setAislacionFrenteFondo}
        tipoAislacion={tipoAislacionFrenteFondo}
        onTipoAislacionChange={setTipoAislacionFrenteFondo}
        labelAislacion="¿Aislación en frente/fondo?"
      />
      {/* Portones (bloque completo) */}
      <View style={styles.bloqueOpcional}>
        <View style={styles.row}>
          <Text style={styles.label}>¿Portones?</Text>
          <Switch value={portones} onValueChange={setPortones} />
        </View>
        {portones && (
          <View style={styles.bloquePortones}>
            <TextInput
              style={styles.input}
              placeholder="Cantidad de portones"
              value={cantidadPortones}
              onChangeText={setCantidadPortones}
              keyboardType="number-pad"
            />
            <Text style={styles.chapaLabel}>Configuración del portón</Text>
            <SelectorOpciones
              opciones={OPCIONES_CONFIG_PORTON}
              valor={configuracionPorton}
              onSeleccionar={setConfiguracionPorton}
            />
            <TextInput
              style={styles.input}
              placeholder="Ancho (m)"
              value={portonesAncho}
              onChangeText={setPortonesAncho}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Alto (m)"
              value={portonesAlto}
              onChangeText={setPortonesAlto}
              keyboardType="decimal-pad"
            />
            <Text style={styles.chapaLabel}>Tipo de Apertura</Text>
            <SelectorOpciones
              opciones={OPCIONES_APERTURA_PORTON}
              valor={portonesTipoApertura}
              onSeleccionar={setPortonesTipoApertura}
            />
            <Text style={styles.chapaLabel}>Tipo de Chapa</Text>
            <SelectorOpciones
              opciones={OPCIONES_CHAPA}
              valor={portonesChapa}
              onSeleccionar={setPortonesChapa}
            />
          </View>
        )}
      </View>

      {/* Aislación Techo */}
      <View style={styles.bloqueOpcional}>
        <View style={styles.row}>
          <Text style={styles.label}>¿Aislación Techo?</Text>
          <Switch value={aislacionTecho} onValueChange={setAislacionTecho} />
        </View>
        {aislacionTecho && (
          <View style={styles.chapaSelector}>
            <Text style={styles.chapaLabel}>Tipo de aislación</Text>
            <SelectorOpciones
              opciones={OPCIONES_AISLACION}
              valor={tipoAislacion}
              onSeleccionar={setTipoAislacion}
            />
          </View>
        )}
      </View>

      {/* Piso de Hormigón */}
      <Text style={styles.sectionTitle}>Piso de Hormigón</Text>
      <View style={styles.bloqueOpcional}>
        <View style={styles.row}>
          <Text style={styles.label}>¿Incluir Piso de Hormigón?</Text>
          <Switch value={pisoHormigon} onValueChange={setPisoHormigon} />
        </View>
        {pisoHormigon && (
          <View style={styles.bloquePortones}>
            <Text style={styles.chapaLabel}>Tipo de Hormigón</Text>
            <SelectorOpciones
              opciones={OPCIONES_TIPO_HORMIGON}
              valor={tipoHormigon}
              onSeleccionar={setTipoHormigon}
            />
            <Text style={styles.chapaLabel}>Espesor del piso</Text>
            <SelectorOpciones
              opciones={OPCIONES_ESPESOR_PISO}
              valor={espesorPiso}
              onSeleccionar={setEspesorPiso}
            />
            <Text style={styles.chapaLabel}>Terminación</Text>
            <SelectorOpciones
              opciones={OPCIONES_TERMINACION}
              valor={terminacionPiso}
              onSeleccionar={setTerminacionPiso}
            />
          </View>
        )}
      </View>

      {/* --- NUEVA SECCIÓN: LOGÍSTICA Y EQUIPOS --- */}
      <Text style={styles.sectionTitle}>Logística y Equipos</Text>
      <TextInput
        style={styles.input}
        placeholder="Distancia a la obra (km ida y vuelta)"
        value={distanciaKm}
        onChangeText={setDistanciaKm}
        keyboardType="decimal-pad"
      />
      <View style={styles.bloqueOpcional}>
        <View style={styles.row}>
          <Text style={styles.label}>¿Incluir Medios de Elevación?</Text>
          <Switch value={incluirElevacion} onValueChange={setIncluirElevacion} />
        </View>
      </View>
      {/* ------------------------------------------ */}

      <TouchableOpacity style={styles.calcButton} onPress={handleCalcular} activeOpacity={0.8}>
        <Text style={styles.calcButtonText}>CALCULAR</Text>
      </TouchableOpacity>

      {resultadoCalculo !== null && (
        <View style={styles.resultadoBox}>
          <Text style={styles.resultadoLabel}>Precio Final</Text>
          <Text style={styles.resultadoPrecio}>USD {resultadoCalculo.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.guardarButton}
            onPress={handleGuardarHistorial}
            activeOpacity={0.8}
          >
            <Text style={styles.guardarButtonText}>GUARDAR EN HISTORIAL</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#c4c4c4' },
  container: { padding: 16, paddingBottom: 32, backgroundColor: '#c4c4c4' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  campoLabel: { fontSize: 15, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  opcionesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  opcionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  opcionBtnActivo: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  opcionBtnText: { fontSize: 14 },
  opcionBtnTextActivo: { color: '#2563eb', fontWeight: '600' },
  bloqueOpcional: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: { fontSize: 16 },
  chapaSelector: { marginTop: 8, marginLeft: 0 },
  chapaLabel: { fontSize: 14, marginBottom: 6, color: '#555' },
  rowAislacion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  aislacionSelector: { marginTop: 8 },
  bloquePortones: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calcButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  calcButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  resultadoBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  resultadoLabel: { fontSize: 14, color: '#0369a1', marginBottom: 4 },
  resultadoPrecio: { fontSize: 22, fontWeight: '700', color: '#0c4a6e', marginBottom: 12 },
  guardarButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  guardarButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});