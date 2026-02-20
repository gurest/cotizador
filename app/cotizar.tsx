import {
  calcularPresupuesto,
  formatearMoneda,
  type ConfigPrecios,
  type DatosCotizacion,
  type MaterialReticulado,
  type TipoColumna,
  type TipoHormigon,
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

// --- CONSTANTES Y LISTAS DE OPCIONES ---

const OPCIONES_COLUMNA = ['Alma llena', 'Reticulado', 'Tubo', 'Perfil C'] as const;
const OPCIONES_VIGA = ['Alma llena', 'Reticulado', 'Perfil C'] as const;

const OPCIONES_SUBTIPO_PERFIL = ['IPN', 'W'] as const;
const MATERIALES_RETICULADO = ['Angulo', 'Hierro Redondo', 'Perfil C'] as const;

const OPCIONES_CHAPA = ['T-101', 'Sinusoidal', 'Prepintada'] as const;

const OPCIONES_AISLACION = [
  'Burbuja 5mm',
  'Burbuja 10mm',
  'Lana Vidrio',
  'Poliuretano',
  'Panel Ignífugo',
] as const;

const OPCIONES_TIPO_HORMIGON = ['H21 (Liviano)', 'H30 (Industrial)'] as const;
const OPCIONES_ESPESOR_PISO = ['12 cm', '15 cm', '18 cm', '20 cm'] as const;
const OPCIONES_TERMINACION = [
  'Llaneado Mecánico',
  'Rodillado',
  'Sin terminación',
] as const;


// --- COMPONENTES AUXILIARES ---

function SelectorOpciones<T extends string>({
  opciones,
  valor,
  onSeleccionar,
  style,
}: {
  opciones: readonly T[];
  valor: string;
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
            <Text
              style={[
                styles.opcionBtnText,
                isActive && styles.opcionBtnTextActivo,
              ]}
            >
              {op}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  chapa: string;
  onChapaChange: (v: any) => void;
  aislacionActiva?: boolean;
  onAislacionActivaChange?: (v: boolean) => void;
  tipoAislacion?: string;
  onTipoAislacionChange?: (v: any) => void;
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
  
  const [ancho, setAncho] = useState('');
  const [largo, setLargo] = useState('');
  const [altoHombrera, setAltoHombrera] = useState('');
  const [pendiente, setPendiente] = useState('15');
  
  const [resultadoCalculo, setResultadoCalculo] = useState<number | null>(null);
  const [desgloseCompleto, setDesgloseCompleto] = useState<any>(null);

  const [tipoColumna, setTipoColumna] = useState<TipoColumna>('Alma llena');
  const [subTipoColumna, setSubTipoColumna] = useState<'IPN' | 'W'>('IPN');
  const [medidaColumna, setMedidaColumna] = useState('');
  const [pesoColumna, setPesoColumna] = useState(''); 
  const [matReticuladoCol, setMatReticuladoCol] = useState<MaterialReticulado>('Angulo');

  const [tipoViga, setTipoViga] = useState<TipoViga>('Alma llena');
  const [subTipoViga, setSubTipoViga] = useState<'IPN' | 'W'>('IPN');
  const [medidaViga, setMedidaViga] = useState('');
  const [pesoViga, setPesoViga] = useState(''); 
  const [matReticuladoViga, setMatReticuladoViga] = useState<MaterialReticulado>('Angulo');

  const [cerramientoLateral, setCerramientoLateral] = useState(false);
  const [cerramientoLateralChapa, setCerramientoLateralChapa] = useState('T-101');
  const [aislacionLateral, setAislacionLateral] = useState(false);
  const [tipoAislacionLateral, setTipoAislacionLateral] = useState('Burbuja 10mm');
  
  const [cerramientoFrenteFondo, setCerramientoFrenteFondo] = useState(false);
  const [cerramientoFrenteFondoChapa, setCerramientoFrenteFondoChapa] = useState('T-101');
  const [aislacionFrenteFondo, setAislacionFrenteFondo] = useState(false);
  const [tipoAislacionFrenteFondo, setTipoAislacionFrenteFondo] = useState('Burbuja 10mm');
  
  const [portones, setPortones] = useState(false);
  const [cantidadPortones, setCantidadPortones] = useState('');
  const [portonesAncho, setPortonesAncho] = useState('');
  const [portonesAlto, setPortonesAlto] = useState('');

  const [puertasAuxiliares, setPuertasAuxiliares] = useState(false);
  const [cantidadPuertasAuxiliares, setCantidadPuertasAuxiliares] = useState('');

  const [aislacionTecho, setAislacionTecho] = useState(false);
  const [tipoAislacionTecho, setTipoAislacionTecho] = useState('Burbuja 10mm');
  
  const [chapasTraslucidas, setChapasTraslucidas] = useState(false);
  const [cantTraslucidas, setCantTraslucidas] = useState('');
  
  const [ventilacionEolica, setVentilacionEolica] = useState(false);
  const [cantEolicos, setCantEolicos] = useState('');

  const [pisoHormigon, setPisoHormigon] = useState(false);
  const [tipoHormigon, setTipoHormigon] = useState<TipoHormigon>('H21 (Liviano)');
  const [espesorPiso, setEspesorPiso] = useState('15 cm');
  const [terminacionPiso, setTerminacionPiso] = useState('Llaneado Mecánico');
  const [estudioSuelo, setEstudioSuelo] = useState(false);
  const [hormigonEntrada, setHormigonEntrada] = useState(false);
  const [distanciaEntrada, setDistanciaEntrada] = useState('');

  const [distanciaKm, setDistanciaKm] = useState('');
  const [incluirElevacion, setIncluirElevacion] = useState(false);


  const handleCalcular = async () => {
    const defaults = {
      precioAceroEstructural: 3.50,
      precioAceroTubular: 3.50,    
      precioAcero: 3.50,           
      precioChapa: 18.00,         
      precioAislacion: 12.00,     
      precioPanelIgnifugo: 45.00, 
      precioEolico: 150.00,           
      precioChapaTraslucida: 35.00,   
      precioPuertaEmergencia: 400.00, 
      precioEstudioSuelo: 300.00,     
      precioHormigonH21: 140.00,      
      precioHormigonH30: 160.00,      
      precioMallaCima: 8.00,          
      tornilleriaFijaciones: 500.00, 
      selladoresZingueria: 5.00,     
      manoObraFabricacion: 1.50,     
      montajeEstructura: 25.00,      
      ingenieriaPlanos: 600.00,      
      pinturaTratamiento: 4.00,      
      mediosElevacion: 800.00,       
      logisticaFletes: 2.50,         
      viaticos: 300.00,              
      margenGanancia: 25,            
      imprevistosContingencia: 5,    
    };

    let config: ConfigPrecios;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_PRECIOS);
      const userConfig = stored ? JSON.parse(stored) : {};

      const u = (val: any, def: number) => (val && parseFloat(val) > 0 ? parseFloat(val) : def);

      config = {
        precioAceroEstructural: u(userConfig.precioAceroEstructural, defaults.precioAceroEstructural),
        precioAceroTubular: u(userConfig.precioAceroTubular, defaults.precioAceroTubular),
        precioAcero: u(userConfig.precioAcero, defaults.precioAcero),
        precioChapa: u(userConfig.precioChapa, defaults.precioChapa),
        precioAislacion: u(userConfig.precioAislacion, defaults.precioAislacion),
        precioPanelIgnifugo: u(userConfig.precioPanelIgnifugo, defaults.precioPanelIgnifugo),
        precioEolico: u(userConfig.precioEolico, defaults.precioEolico),
        precioChapaTraslucida: u(userConfig.precioChapaTraslucida, defaults.precioChapaTraslucida),
        precioPuertaEmergencia: u(userConfig.precioPuertaEmergencia, defaults.precioPuertaEmergencia),
        precioEstudioSuelo: u(userConfig.precioEstudioSuelo, defaults.precioEstudioSuelo),
        precioHormigonH21: u(userConfig.precioHormigonH21, defaults.precioHormigonH21),
        precioHormigonH30: u(userConfig.precioHormigonH30, defaults.precioHormigonH30),
        precioMallaCima: u(userConfig.precioMallaCima, defaults.precioMallaCima),
        tornilleriaFijaciones: u(userConfig.tornilleriaFijaciones, defaults.tornilleriaFijaciones),
        selladoresZingueria: u(userConfig.selladoresZingueria, defaults.selladoresZingueria),
        manoObraFabricacion: u(userConfig.manoObraFabricacion, defaults.manoObraFabricacion),
        montajeEstructura: u(userConfig.montajeEstructura, defaults.montajeEstructura),
        ingenieriaPlanos: u(userConfig.ingenieriaPlanos, defaults.ingenieriaPlanos),
        pinturaTratamiento: u(userConfig.pinturaTratamiento, defaults.pinturaTratamiento),
        mediosElevacion: u(userConfig.mediosElevacion, defaults.mediosElevacion),
        logisticaFletes: u(userConfig.logisticaFletes, defaults.logisticaFletes),
        viaticos: u(userConfig.viaticos, defaults.viaticos),
        margenGanancia: u(userConfig.margenGanancia, defaults.margenGanancia),
        imprevistosContingencia: u(userConfig.imprevistosContingencia, defaults.imprevistosContingencia),
        pesosIPN: userConfig.pesosIPN || {},
        pesosW: userConfig.pesosW || {},
        pesosTubo: userConfig.pesosTubo || {},
        pesosPerfilC: userConfig.pesosPerfilC || {},
        pesosReticulado: userConfig.pesosReticulado || {},
      };

      if (!stored) {
         Alert.alert('Aviso', 'Usando precios de referencia global.');
      }

    } catch {
      Alert.alert('Error', 'Fallo al cargar precios. Usando referencia.');
      config = { ...defaults, pesosIPN: {}, pesosW: {}, pesosTubo: {}, pesosPerfilC: {}, pesosReticulado: {} } as any; 
    }

    const datos: DatosCotizacion = {
      ancho: parseFloat(ancho) || 0,
      largo: parseFloat(largo) || 0,
      altoHombrera: parseFloat(altoHombrera) || 0,
      pendiente: parseFloat(pendiente) || 0,
      tipoColumna: tipoColumna,
      subTipoColumna: tipoColumna === 'Alma llena' ? subTipoColumna : undefined,
      medidaColumna: medidaColumna,
      pesoMetroColumna: parseFloat(pesoColumna) || 0,
      materialReticuladoColumna: tipoColumna === 'Reticulado' ? matReticuladoCol : undefined,
      tipoViga: tipoViga,
      subTipoViga: tipoViga === 'Alma llena' ? subTipoViga : undefined,
      medidaViga: medidaViga,
      pesoMetroViga: parseFloat(pesoViga) || 0,
      materialReticuladoViga: tipoViga === 'Reticulado' ? matReticuladoViga : undefined,
      cerramientoLateral: cerramientoLateral,
      cerramientoLateralChapa: cerramientoLateralChapa,
      aislacionLateral: aislacionLateral,
      tipoAislacionLateral: tipoAislacionLateral,
      cerramientoFrenteFondo: cerramientoFrenteFondo,
      cerramientoFrenteFondoChapa: cerramientoFrenteFondoChapa,
      aislacionFrenteFondo: aislacionFrenteFondo,
      tipoAislacionFrenteFondo: tipoAislacionFrenteFondo,
      portones: portones,
      cantidadPortones: parseInt(cantidadPortones) || 0,
      portonesAncho: parseFloat(portonesAncho) || 0,
      portonesAlto: parseFloat(portonesAlto) || 0,
      puertasAuxiliares: puertasAuxiliares,
      cantidadPuertasAuxiliares: parseInt(cantidadPuertasAuxiliares) || 0,
      aislacionTecho: aislacionTecho,
      tipoAislacionTecho: tipoAislacionTecho,
      chapasTraslucidas: chapasTraslucidas,
      cantidadChapasTraslucidas: parseInt(cantTraslucidas) || 0,
      ventilacionEolica: ventilacionEolica,
      cantidadEolicos: parseInt(cantEolicos) || 0,
      pisoHormigon: pisoHormigon,
      tipoHormigon: tipoHormigon,
      espesorPiso: espesorPiso,
      estudioSuelo: estudioSuelo,
      hormigonEntrada: hormigonEntrada,
      distanciaEntrada: parseFloat(distanciaEntrada) || 0,
      terminacionPiso: terminacionPiso,
      distanciaKm: parseFloat(distanciaKm) || 0,
      incluirElevacion: incluirElevacion,
    };

    const res = calcularPresupuesto(datos, config);
    setResultadoCalculo(res.total);
    setDesgloseCompleto({
      ...res,
      datosInput: datos,
      fecha: new Date().toISOString()
    });
  };


  const handleGuardarHistorial = async () => {
    if (resultadoCalculo === null || !desgloseCompleto) return;

    const itemParaGuardar = {
      id: Date.now(),
      nombreProyecto: nombreProyecto.trim() || 'Proyecto Sin Nombre',
      fecha: desgloseCompleto.fecha,
      total: desgloseCompleto.total,
      subtotal: desgloseCompleto.subtotal,
      desglose: desgloseCompleto.desglose,
      cantidades: desgloseCompleto.cantidades, 
      ganancia: desgloseCompleto.ganancia, // NUEVO: Guardamos el dato de ganancia en el historial
      datosInput: {
        ancho: desgloseCompleto.datosInput.ancho,
        largo: desgloseCompleto.datosInput.largo,
        altoHombrera: desgloseCompleto.datosInput.altoHombrera,
        pendiente: desgloseCompleto.datosInput.pendiente,
        tipoColumna: desgloseCompleto.datosInput.tipoColumna,
        subTipoColumna: desgloseCompleto.datosInput.subTipoColumna,
        medidaColumna: desgloseCompleto.datosInput.medidaColumna,
        pesoMetroColumna: desgloseCompleto.datosInput.pesoMetroColumna,
        materialReticuladoColumna: desgloseCompleto.datosInput.materialReticuladoColumna,
        tipoViga: desgloseCompleto.datosInput.tipoViga,
        subTipoViga: desgloseCompleto.datosInput.subTipoViga,
        medidaViga: desgloseCompleto.datosInput.medidaViga,
        pesoMetroViga: desgloseCompleto.datosInput.pesoMetroViga,
        materialReticuladoViga: desgloseCompleto.datosInput.materialReticuladoViga,
        cerramientoLateral: desgloseCompleto.datosInput.cerramientoLateral,
        cerramientoLateralChapa: desgloseCompleto.datosInput.cerramientoLateralChapa,
        aislacionLateral: desgloseCompleto.datosInput.aislacionLateral,
        tipoAislacionLateral: desgloseCompleto.datosInput.tipoAislacionLateral,
        cerramientoFrenteFondo: desgloseCompleto.datosInput.cerramientoFrenteFondo,
        cerramientoFrenteFondoChapa: desgloseCompleto.datosInput.cerramientoFrenteFondoChapa,
        aislacionFrenteFondo: desgloseCompleto.datosInput.aislacionFrenteFondo,
        tipoAislacionFrenteFondo: desgloseCompleto.datosInput.tipoAislacionFrenteFondo,
        portones: desgloseCompleto.datosInput.portones,
        cantidadPortones: desgloseCompleto.datosInput.cantidadPortones,
        portonesAncho: desgloseCompleto.datosInput.portonesAncho,
        portonesAlto: desgloseCompleto.datosInput.portonesAlto,
        puertasAuxiliares: desgloseCompleto.datosInput.puertasAuxiliares,
        cantidadPuertasAuxiliares: desgloseCompleto.datosInput.cantidadPuertasAuxiliares,
        aislacionTecho: desgloseCompleto.datosInput.aislacionTecho,
        tipoAislacionTecho: desgloseCompleto.datosInput.tipoAislacionTecho,
        chapasTraslucidas: desgloseCompleto.datosInput.chapasTraslucidas,
        cantidadChapasTraslucidas: desgloseCompleto.datosInput.cantidadChapasTraslucidas,
        ventilacionEolica: desgloseCompleto.datosInput.ventilacionEolica,
        cantidadEolicos: desgloseCompleto.datosInput.cantidadEolicos,
        pisoHormigon: desgloseCompleto.datosInput.pisoHormigon,
        tipoHormigon: desgloseCompleto.datosInput.tipoHormigon,
        espesorPiso: desgloseCompleto.datosInput.espesorPiso,
        estudioSuelo: desgloseCompleto.datosInput.estudioSuelo,
        hormigonEntrada: desgloseCompleto.datosInput.hormigonEntrada,
        distanciaEntrada: desgloseCompleto.datosInput.distanciaEntrada,
        terminacionPiso: desgloseCompleto.datosInput.terminacionPiso,
        distanciaKm: desgloseCompleto.datosInput.distanciaKm,
        incluirElevacion: desgloseCompleto.datosInput.incluirElevacion,
      }
    };

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY_HISTORIAL);
      const lista = raw ? JSON.parse(raw) : [];
      lista.unshift(itemParaGuardar);
      await AsyncStorage.setItem(STORAGE_KEY_HISTORIAL, JSON.stringify(lista));
      Alert.alert('Guardado', 'Cotización guardada exitosamente.');
    } catch {
      Alert.alert('Error', 'No se pudo guardar en el historial.');
    }
  };


  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.brandTitle}>NUEVA COTIZACIÓN</Text>
          <Text style={styles.brandSubtitle}>Quicksheed - Sistema de Cálculo</Text>
        </View>

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

        {/* 1. DIMENSIONES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Dimensiones</Text>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Ancho (m)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#555"
                value={ancho}
                onChangeText={setAncho}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Largo (m)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#555"
                value={largo}
                onChangeText={setLargo}
              />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Alto Hombrera (m)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#555"
                value={altoHombrera}
                onChangeText={setAltoHombrera}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Pendiente (%)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor="#555"
                value={pendiente}
                onChangeText={setPendiente}
              />
            </View>
          </View>
        </View>

        {/* 2. ESTRUCTURA COLUMNAS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Estructura Columnas</Text>
          <SelectorOpciones
            opciones={OPCIONES_COLUMNA}
            valor={tipoColumna}
            onSeleccionar={(v) => { setTipoColumna(v); setMedidaColumna(''); setPesoColumna(''); }}
          />

          {tipoColumna === 'Alma llena' && (
            <>
              <Text style={styles.subLabel}>Subtipo de Perfil</Text>
              <SelectorOpciones
                opciones={OPCIONES_SUBTIPO_PERFIL}
                valor={subTipoColumna}
                onSeleccionar={setSubTipoColumna}
              />
            </>
          )}

          {tipoColumna === 'Reticulado' && (
            <>
              <Text style={styles.subLabel}>Material de Relleno</Text>
              <SelectorOpciones
                opciones={MATERIALES_RETICULADO}
                valor={matReticuladoCol}
                onSeleccionar={setMatReticuladoCol}
              />
            </>
          )}

          <View style={[styles.rowInputs, { marginTop: 12 }]}>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Etiqueta / Medida</Text>
              <TextInput
                style={styles.input}
                placeholder={tipoColumna === 'Reticulado' ? "Ej: 400 mm" : "Ej: IPN 240 / Tubo 100"}
                placeholderTextColor="#555"
                value={medidaColumna}
                onChangeText={setMedidaColumna}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Peso (kg/m)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Ej: 36.2"
                placeholderTextColor="#555"
                value={pesoColumna}
                onChangeText={setPesoColumna}
              />
            </View>
          </View>
        </View>

        {/* 3. ESTRUCTURA VIGAS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Estructura Vigas</Text>
          <SelectorOpciones
            opciones={OPCIONES_VIGA}
            valor={tipoViga}
            onSeleccionar={(v) => { setTipoViga(v); setMedidaViga(''); setPesoViga(''); }}
          />

          {tipoViga === 'Alma llena' && (
            <>
              <Text style={styles.subLabel}>Subtipo de Perfil</Text>
              <SelectorOpciones
                opciones={OPCIONES_SUBTIPO_PERFIL}
                valor={subTipoViga}
                onSeleccionar={setSubTipoViga}
              />
            </>
          )}

          {tipoViga === 'Reticulado' && (
            <>
              <Text style={styles.subLabel}>Material de Relleno</Text>
              <SelectorOpciones
                opciones={MATERIALES_RETICULADO}
                valor={matReticuladoViga}
                onSeleccionar={setMatReticuladoViga}
              />
            </>
          )}

          <View style={[styles.rowInputs, { marginTop: 12 }]}>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Etiqueta / Medida</Text>
              <TextInput
                style={styles.input}
                placeholder={tipoViga === 'Reticulado' ? "Ej: 300 mm" : "Ej: Perfil C 120"}
                placeholderTextColor="#555"
                value={medidaViga}
                onChangeText={setMedidaViga}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.subLabel}>Peso (kg/m)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Ej: 9"
                placeholderTextColor="#555"
                value={pesoViga}
                onChangeText={setPesoViga}
              />
            </View>
          </View>
        </View>

        {/* 4. CERRAMIENTOS */}
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
          labelAislacion="¿Incluir Aislación Lateral?"
        />

        <BloqueOpcionalCerramiento
          titulo="Cerramiento Frente y Fondo"
          activo={cerramientoFrenteFondo}
          onActivoChange={setCerramientoFrenteFondo}
          chapa={cerramientoFrenteFondoChapa}
          onChapaChange={setCerramientoFrenteFondoChapa}
          aislacionActiva={aislacionFrenteFondo}
          onAislacionActivaChange={setAislacionFrenteFondo}
          tipoAislacion={tipoAislacionFrenteFondo}
          onTipoAislacionChange={setTipoAislacionFrenteFondo}
          labelAislacion="¿Incluir Aislación Frt/Fnd?"
        />

        {/* 5. ACCESOS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Accesos</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Portones Industriales</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={portones}
              onValueChange={setPortones}
            />
          </View>
          {portones && (
            <View style={styles.subSection}>
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Cant.</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={cantidadPortones}
                    onChangeText={setCantidadPortones}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Ancho (m)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={portonesAncho}
                    onChangeText={setPortonesAncho}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.subLabel}>Alto (m)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={portonesAlto}
                    onChangeText={setPortonesAlto}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text style={styles.label}>Puertas de Emergencia</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={puertasAuxiliares}
              onValueChange={setPuertasAuxiliares}
            />
          </View>
          {puertasAuxiliares && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Cantidad de Puertas</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cantidadPuertasAuxiliares}
                onChangeText={setCantidadPuertasAuxiliares}
              />
            </View>
          )}
        </View>

        {/* 6. TECHOS Y CUBIERTA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>6. Techo y Cubierta</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Aislación de Techo</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={aislacionTecho}
              onValueChange={setAislacionTecho}
            />
          </View>
          {aislacionTecho && (
            <View style={styles.subSection}>
              <SelectorOpciones
                opciones={OPCIONES_AISLACION}
                valor={tipoAislacionTecho}
                onSeleccionar={setTipoAislacionTecho}
              />
            </View>
          )}

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text style={styles.label}>Chapas Traslúcidas</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={chapasTraslucidas}
              onValueChange={setChapasTraslucidas}
            />
          </View>
          {chapasTraslucidas && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Cantidad de Chapas</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cantTraslucidas}
                onChangeText={setCantTraslucidas}
              />
            </View>
          )}

          <View style={styles.separator} />

          <View style={styles.row}>
            <Text style={styles.label}>Ventilación Eólica</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={ventilacionEolica}
              onValueChange={setVentilacionEolica}
            />
          </View>
          {ventilacionEolica && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Cantidad de Eólicos</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={cantEolicos}
                onChangeText={setCantEolicos}
              />
            </View>
          )}
        </View>

        {/* 7. PISO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>7. Piso de Hormigón</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Incluir Piso</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={pisoHormigon}
              onValueChange={setPisoHormigon}
            />
          </View>
          {pisoHormigon && (
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Tipo de Hormigón</Text>
              <SelectorOpciones
                opciones={OPCIONES_TIPO_HORMIGON}
                valor={tipoHormigon}
                onSeleccionar={setTipoHormigon}
              />

              <Text style={[styles.subLabel, { marginTop: 10 }]}>
                Espesor del Piso
              </Text>
              <SelectorOpciones
                opciones={OPCIONES_ESPESOR_PISO}
                valor={espesorPiso}
                onSeleccionar={setEspesorPiso}
              />

              <Text style={[styles.subLabel, { marginTop: 10 }]}>
                Terminación
              </Text>
              <SelectorOpciones
                opciones={OPCIONES_TERMINACION}
                valor={terminacionPiso}
                onSeleccionar={setTerminacionPiso}
              />

              <View style={[styles.row, { marginTop: 15 }]}>
                <Text style={styles.labelSmall}>¿Requiere Estudio de Suelo?</Text>
                <Switch
                  trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
                  value={estudioSuelo}
                  onValueChange={setEstudioSuelo}
                />
              </View>

              <View style={[styles.row, { marginTop: 10 }]}>
                <Text style={styles.labelSmall}>¿Hormigón hasta la calle?</Text>
                <Switch
                  trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
                  value={hormigonEntrada}
                  onValueChange={setHormigonEntrada}
                />
              </View>
              {hormigonEntrada && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Distancia (m)"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                  value={distanciaEntrada}
                  onChangeText={setDistanciaEntrada}
                />
              )}
            </View>
          )}
        </View>

        {/* 8. LOGÍSTICA */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>8. Logística y Equipos</Text>
          <Text style={styles.subLabel}>Distancia de la Obra (km total)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#555"
            value={distanciaKm}
            onChangeText={setDistanciaKm}
          />

          <View style={[styles.row, { marginTop: 15 }]}>
            <Text style={styles.label}>¿Incluir Medios de Elevación?</Text>
            <Switch
              trackColor={{ false: '#3f3f46', true: '#F59E0B' }}
              value={incluirElevacion}
              onValueChange={setIncluirElevacion}
            />
          </View>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <TouchableOpacity
          style={styles.calcButton}
          onPress={handleCalcular}
          activeOpacity={0.8}
        >
          <Text style={styles.calcButtonText}>CALCULAR PRESUPUESTO</Text>
        </TouchableOpacity>

        {resultadoCalculo !== null && desgloseCompleto && (
          <View style={styles.resultadoBox}>
            <Text style={styles.resultadoLabel}>VALOR TOTAL ESTIMADO</Text>
            <Text style={styles.resultadoPrecio}>
              USD {formatearMoneda(resultadoCalculo)}
            </Text>

            <View style={styles.desgloseContainer}>
               <Text style={[styles.desgloseItem, { color: '#F59E0B', fontWeight: 'bold' }]}>
                 Acero Total Requerido: {formatearMoneda(desgloseCompleto.cantidades.kgAceroTotal)} kg
               </Text>
               <Text style={[styles.desgloseItem, { color: '#F59E0B', fontWeight: 'bold', marginBottom: 10 }]}>
                 Superficie a Cubrir: {formatearMoneda(desgloseCompleto.cantidades.areaChapaTotal)} m²
               </Text>
               <View style={styles.separator} />

               <Text style={styles.desgloseItem}>
                 Materiales: USD {formatearMoneda(desgloseCompleto.desglose.materialesEstructura)}
               </Text>
               <Text style={styles.desgloseItem}>
                 Cubiertas: USD {formatearMoneda(desgloseCompleto.desglose.cubiertasYAislaciones)}
               </Text>
               <Text style={styles.desgloseItem}>
                 Accesorios: USD {formatearMoneda(desgloseCompleto.desglose.accesorios)}
               </Text>
               <Text style={styles.desgloseItem}>
                 Obra Civil: USD {formatearMoneda(desgloseCompleto.desglose.pisoObraCivil)}
               </Text>
               <Text style={styles.desgloseItem}>
                 Mano de Obra: USD {formatearMoneda(desgloseCompleto.desglose.manoDeObra)}
               </Text>
               <Text style={styles.desgloseItem}>
                 Logística: USD {formatearMoneda(desgloseCompleto.desglose.logisticaYOtros)}
               </Text>
               
               <View style={styles.separator} />
               
               {/* NUEVO: RENGLÓN DE GANANCIA VISIBLE SOLO PARA VOS */}
               <Text style={[styles.desgloseItem, { color: '#10B981', fontWeight: 'bold', fontSize: 16 }]}>
                 Ganancia Neta ({desgloseCompleto.ganancia.porcentajeGanancia}%): USD {formatearMoneda(desgloseCompleto.ganancia.montoGanancia)}
               </Text>
            </View>

            <TouchableOpacity
              style={styles.guardarButton}
              onPress={handleGuardarHistorial}
              activeOpacity={0.8}
            >
              <Text style={styles.guardarButtonText}>GUARDAR EN HISTORIAL</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#121212' },
  scroll: { flex: 1 },
  container: { padding: 16, paddingBottom: 32 },

  headerContainer: { marginTop: 40, marginBottom: 24, alignItems: 'center' },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  brandSubtitle: { fontSize: 14, color: '#A1A1AA' },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },

  label: { fontSize: 16, color: '#fff', fontWeight: '500' },
  labelSmall: { fontSize: 15, color: '#E4E4E7' },
  subLabel: { fontSize: 13, color: '#A1A1AA', marginBottom: 6 },

  input: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },

  opcionesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  opcionBtn: {
    backgroundColor: '#27272A',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  opcionBtnActivo: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  opcionBtnText: { color: '#A1A1AA', fontSize: 12, fontWeight: '500' },
  opcionBtnTextActivo: { color: '#000', fontWeight: '700' },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  subSection: {
    marginTop: 12,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#3F3F46',
  },
  separator: { height: 1, backgroundColor: '#3F3F46', marginVertical: 12 },

  calcButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  calcButtonText: { color: '#000', fontSize: 18, fontWeight: '800' },

  resultadoBox: {
    marginTop: 24,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
  },
  resultadoLabel: { color: '#F59E0B', fontSize: 14, fontWeight: '600' },
  resultadoPrecio: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  desgloseContainer: {
    width: '100%',
    padding: 10,
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 16,
  },
  desgloseItem: { color: '#ccc', fontSize: 14, marginBottom: 4 },
  guardarButton: {
    backgroundColor: '#27272A',
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  guardarButtonText: { color: '#fff', fontWeight: '600' },
});